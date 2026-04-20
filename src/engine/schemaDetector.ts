import type {
  DataType,
  ColumnMeta,
  DetectedSchema,
  InferredColumnType,
  OHLCVRow,
  PortfolioRow,
  ReturnsRow,
} from '../types/financial'

// ─── 컬럼명 패턴 사전 (skills/data-schema.md 반영) ──────────────────────────

const COLUMN_PATTERNS: Record<string, RegExp> = {
  date:    /^(date|time|timestamp|날짜|일자|거래일|기준일)$/i,
  open:    /^(open|시가|o)$/i,
  high:    /^(high|고가|h)$/i,
  low:     /^(low|저가|l)$/i,
  close:   /^(close|종가|c|price|가격)$/i,
  volume:  /^(volume|vol|거래량|v)$/i,
  ticker:  /^(ticker|symbol|종목코드|종목|code)$/i,
  weight:  /^(weight|allocation|비중|weights|alloc|proportion)$/i,
  return:  /^(return|returns|수익률|pnl|profit|손익)$/i,
  revenue: /^(revenue|sales|매출|매출액|net_income|영업이익|eps|순이익)$/i,
}

// ─── 컬럼 타입 추론 ────────────────────────────────────────────────────────

function inferColumnType(values: (string | number | boolean | null)[]): InferredColumnType {
  const sample = values.filter((v) => v != null).slice(0, 20)
  if (sample.length === 0) return 'string'

  const dateRegex = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/
  if (sample.every((v) => dateRegex.test(String(v)))) return 'date'

  if (sample.every((v) => !isNaN(Number(v)) && String(v).trim() !== '')) return 'number'

  return 'string'
}

// ─── 컬럼명 → 역할 매핑 ────────────────────────────────────────────────────

function matchColumn(name: string): string | null {
  for (const [key, pattern] of Object.entries(COLUMN_PATTERNS)) {
    if (pattern.test(name.trim())) return key
  }
  return null
}

// ─── 메인 감지 함수 ────────────────────────────────────────────────────────

export function detectSchema(
  headers: string[],
  rows: Record<string, string | number | null>[],
): DetectedSchema {
  const warnings: string[] = []

  if (headers.length < 2) {
    warnings.push('최소 2개 이상의 컬럼이 필요합니다.')
  }
  if (rows.length < 10) {
    warnings.push('데이터가 부족합니다 (최소 10행 권장).')
  }
  if (rows.length > 100_000) {
    warnings.push('대용량 데이터 — 자동 리샘플링이 적용됩니다.')
  }

  // 컬럼 메타 분석
  const columns: ColumnMeta[] = headers.map((name) => {
    const values = rows.map((r) => r[name] ?? null)
    const nullCount = values.filter((v) => v == null || v === '').length
    return {
      name,
      inferredType: inferColumnType(values),
      sample: values.slice(0, 5),
      nullRatio: rows.length > 0 ? nullCount / rows.length : 0,
    }
  })

  // 높은 결측치 경고
  columns.forEach((col) => {
    if (col.nullRatio > 0.5) {
      warnings.push(`'${col.name}' 컬럼의 결측치가 ${Math.round(col.nullRatio * 100)}%를 초과합니다.`)
    }
  })

  // 숫자 비율 경고
  const numericRatio = columns.filter((c) => c.inferredType === 'number').length / Math.max(columns.length, 1)
  if (numericRatio < 0.3) {
    warnings.push('숫자 데이터 비율이 낮습니다 (30% 미만).')
  }

  // 컬럼명 역할 매핑
  const matched: Record<string, string> = {}
  headers.forEach((h) => {
    const key = matchColumn(h)
    if (key && !(key in matched)) matched[key] = h
  })

  // 데이터 타입 결정 (우선순위 순서)
  let dataType: DataType = 'GENERIC'
  let confidence = 0.5

  if (matched['open'] && matched['high'] && matched['low'] && matched['close']) {
    dataType = 'STOCK_OHLCV'
    confidence = matched['volume'] ? 0.97 : 0.88
  } else if (matched['ticker'] && (matched['weight'] || matched['return'])) {
    dataType = 'PORTFOLIO'
    confidence = 0.92
  } else if (matched['date'] && matched['return']) {
    dataType = 'RETURNS'
    confidence = 0.90
  } else if (matched['revenue']) {
    dataType = 'FINANCIAL_STATEMENT'
    confidence = 0.85
  }

  const valueColumns = Object.entries(matched)
    .filter(([key]) => key !== 'date')
    .map(([, col]) => col)

  return {
    dataType,
    columns,
    primaryKey: matched['date'] ?? matched['ticker'] ?? null,
    dateColumn: matched['date'] ?? null,
    valueColumns,
    confidence,
    warnings,
    rowCount: rows.length,
  }
}

// ─── 타입 변환 헬퍼 ────────────────────────────────────────────────────────

export function toOHLCVRows(
  rows: Record<string, string | number | null>[],
  schema: DetectedSchema,
): OHLCVRow[] {
  const dc = schema.dateColumn
  if (!dc) return []

  const colMap: Record<string, string> = {}
  schema.columns.forEach((col) => {
    const role = matchColumn(col.name)
    if (role) colMap[role] = col.name
  })

  return rows
    .filter((r) => r[dc] != null)
    .map((r) => ({
      date: String(r[dc] ?? ''),
      open: Number(r[colMap['open'] ?? ''] ?? 0),
      high: Number(r[colMap['high'] ?? ''] ?? 0),
      low: Number(r[colMap['low'] ?? ''] ?? 0),
      close: Number(r[colMap['close'] ?? ''] ?? 0),
      volume: Number(r[colMap['volume'] ?? ''] ?? 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function toPortfolioRows(
  rows: Record<string, string | number | null>[],
  schema: DetectedSchema,
): PortfolioRow[] {
  const colMap: Record<string, string> = {}
  schema.columns.forEach((col) => {
    const role = matchColumn(col.name)
    if (role) colMap[role] = col.name
  })

  const tickerCol = colMap['ticker']
  const weightCol = colMap['weight']
  if (!tickerCol) return []

  return rows
    .filter((r) => r[tickerCol] != null)
    .map((r) => ({
      ticker: String(r[tickerCol] ?? ''),
      weight: weightCol ? Number(r[weightCol] ?? 0) : 0,
      returnRate: colMap['return'] ? Number(r[colMap['return']] ?? 0) : undefined,
    }))
}

export function toReturnsRows(
  rows: Record<string, string | number | null>[],
  schema: DetectedSchema,
): ReturnsRow[] {
  const colMap: Record<string, string> = {}
  schema.columns.forEach((col) => {
    const role = matchColumn(col.name)
    if (role) colMap[role] = col.name
  })

  const dateCol = colMap['date']
  const returnCol = colMap['return']
  if (!dateCol || !returnCol) return []

  return rows
    .filter((r) => r[dateCol] != null && r[returnCol] != null)
    .map((r) => ({
      date: String(r[dateCol] ?? ''),
      return: Number(r[returnCol] ?? 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
