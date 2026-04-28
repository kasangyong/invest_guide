// ─── 기본 데이터 구조 ───────────────────────────────────────────────────────

export interface OHLCVRow {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PortfolioRow {
  ticker: string
  name?: string
  weight: number        // 0~100 (%)
  returnRate?: number   // 수익률 %
  sector?: string
  currentValue?: number
}

export interface ReturnsRow {
  date: string
  return: number        // 일간 수익률 (소수: 0.01 = 1%)
  benchmark?: number    // 벤치마크 수익률
}

// ─── 스키마 감지 결과 ──────────────────────────────────────────────────────

export type DataType =
  | 'STOCK_OHLCV'
  | 'PORTFOLIO'
  | 'RETURNS'
  | 'FINANCIAL_STATEMENT'
  | 'GENERIC'

export type InferredColumnType = 'date' | 'number' | 'string' | 'boolean'

export interface ColumnMeta {
  name: string
  inferredType: InferredColumnType
  sample: (string | number | boolean | null)[]
  nullRatio: number
}

export interface DetectedSchema {
  dataType: DataType
  columns: ColumnMeta[]
  primaryKey: string | null
  dateColumn: string | null
  valueColumns: string[]
  confidence: number
  warnings: string[]
  rowCount: number
}

// ─── 금융 지표 계산 결과 ────────────────────────────────────────────────────

export interface FinancialMetrics {
  // 수익률
  totalReturn: number
  cagr: number | null
  alpha: number | null
  // 위험 조정
  sharpeRatio: number | null
  sortinoRatio: number | null
  mdd: number              // 음수 %
  volatility: number       // 연환산 %
  // 기술적 지표 (최신 값)
  ma20: number | null
  ma50: number | null
  ma200: number | null
  rsi14: number | null
  bollingerUpper: number | null
  bollingerLower: number | null
  bollingerMiddle: number | null
  // 시계열 데이터 (차트용)
  ma20Series: (number | null)[]
  ma50Series: (number | null)[]
  rsiSeries: (number | null)[]
  bollingerSeries: BollingerPoint[]
  cumulativeReturns: number[]
  drawdownSeries: number[]
}

export interface BollingerPoint {
  upper: number | null
  middle: number | null
  lower: number | null
}

// ─── 포트폴리오 지표 ─────────────────────────────────────────────────────

export interface PortfolioMetrics {
  totalReturn: number
  sharpeRatio: number | null
  sortinoRatio: number | null
  mdd: number | null        // 시계열 없으면 null
  volatility: number | null // 수익률 분산 (횡단면 std)
  assetCount: number
  topAsset: string
  worstAsset: string
  topConcentration: number  // 최대 비중 %
}

// ─── 인사이트 생성 ────────────────────────────────────────────────────────

export interface InsightRequest {
  dataType: DataType
  metrics: Partial<FinancialMetrics & PortfolioMetrics>
  summary: string
}

export interface InsightResult {
  insights: string[]
  disclaimer: string
}

// ─── 앱 상태 ─────────────────────────────────────────────────────────────

export type AppState = 'landing' | 'loading' | 'dashboard'

export type DashboardData =
  | { type: 'STOCK_OHLCV'; rows: OHLCVRow[]; schema: DetectedSchema }
  | { type: 'PORTFOLIO'; rows: PortfolioRow[]; schema: DetectedSchema }
  | { type: 'RETURNS'; rows: ReturnsRow[]; schema: DetectedSchema }
  | { type: 'GENERIC'; rows: Record<string, string | number | null>[]; schema: DetectedSchema }

// ─── 차트 공통 ────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  date: string
  value: number
}

export type TimePeriod = '1M' | '3M' | '6M' | '1Y' | '3Y' | 'ALL'
