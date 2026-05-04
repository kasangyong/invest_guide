# 투자 데이터 대시보드 — 상세 구현 계획

> 기반 문서: `research.md`  
> 작성일: 2026-04-15  
> 전략 요약: Skills.md 5종 + React 프론트엔드 + Claude API 인사이트 생성 + Vercel 배포

---

## 목차

1. [아키텍처 전체 그림](#1-아키텍처-전체-그림)
2. [디렉터리 구조](#2-디렉터리-구조)
3. [기술 스택 선택 근거](#3-기술-스택-선택-근거)
4. [Phase 1 — Skills.md 5종 설계](#4-phase-1--skillsmd-5종-설계)
5. [Phase 2 — 데이터 스키마 자동 감지 엔진](#5-phase-2--데이터-스키마-자동-감지-엔진)
6. [Phase 3 — 금융 지표 계산 엔진](#6-phase-3--금융-지표-계산-엔진)
7. [Phase 4 — 시각화 컴포넌트 시스템](#7-phase-4--시각화-컴포넌트-시스템)
8. [Phase 5 — LLM 인사이트 생성 파이프라인](#8-phase-5--llm-인사이트-생성-파이프라인)
9. [Phase 6 — 대시보드 레이아웃 및 라우팅](#9-phase-6--대시보드-레이아웃-및-라우팅)
10. [Phase 7 — 더미 데이터 & 데모 모드](#10-phase-7--더미-데이터--데모-모드)
11. [Phase 8 — 배포 전략](#11-phase-8--배포-전략)
12. [바이브 코딩 워크플로우](#12-바이브-코딩-워크플로우)
13. [구현 우선순위 & 타임라인](#13-구현-우선순위--타임라인)

---

## 1. 아키텍처 전체 그림

```
┌─────────────────────────────────────────────────────────┐
│                     사용자 (브라우저)                      │
└───────────────────────────┬─────────────────────────────┘
                            │ CSV / JSON 업로드
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 React 프론트엔드 (Vite)                   │
│                                                         │
│  ┌─────────────────┐    ┌──────────────────────────┐   │
│  │ SchemaDetector   │───▶│  FinancialEngine          │   │
│  │ (data-schema.md) │    │  (indicators.md)          │   │
│  └─────────────────┘    └─────────────┬────────────┘   │
│                                       │                 │
│  ┌─────────────────┐    ┌─────────────▼────────────┐   │
│  │ InsightGenerator │◀───│  ChartSelector            │   │
│  │ (insight-gen.md) │    │  (visualization.md)       │   │
│  └────────┬────────┘    └─────────────┬────────────┘   │
│           │                           │                 │
│           ▼                           ▼                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │           DashboardLayout (layout.md)            │   │
│  │   [KPI Cards] [Charts] [Insights] [Tables]       │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            │ API 호출 (인사이트 생성)
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Claude API (Anthropic)                     │
│       시스템 프롬프트 = Skills.md 내용 주입               │
└─────────────────────────────────────────────────────────┘
```

**핵심 원칙**: Skills.md 문서들이 코드의 동작 규칙을 결정한다. 코드는 Skills.md를 읽고 실행하는 인터프리터다.

---

## 2. 디렉터리 구조

```
invest-dashboard/
│
├── skills/                        # ★ 핵심 — Skills.md 5종
│   ├── data-schema.md             # 데이터 구조 감지 및 전처리 규칙
│   ├── visualization.md           # 차트 선택 기준
│   ├── indicators.md              # 금융 지표 계산 공식
│   ├── insight-generation.md      # 인사이트 생성 템플릿
│   └── dashboard-layout.md        # 레이아웃 구성 규칙
│
├── src/
│   ├── engine/                    # 코어 분석 엔진
│   │   ├── schemaDetector.ts      # 데이터 타입 자동 감지
│   │   ├── financialEngine.ts     # 금융 지표 계산
│   │   ├── chartSelector.ts       # 차트 유형 자동 결정
│   │   └── insightGenerator.ts    # LLM 인사이트 생성
│   │
│   ├── components/                # UI 컴포넌트
│   │   ├── layout/
│   │   │   ├── DashboardShell.tsx
│   │   │   ├── KPIBar.tsx
│   │   │   └── PanelGrid.tsx
│   │   ├── charts/
│   │   │   ├── CandlestickChart.tsx
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── HeatmapChart.tsx
│   │   │   ├── TreemapChart.tsx
│   │   │   └── ChartFactory.tsx   # 차트 유형 자동 라우팅
│   │   ├── widgets/
│   │   │   ├── KPICard.tsx
│   │   │   ├── InsightPanel.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── UploadZone.tsx
│   │   └── dashboard/
│   │       ├── StockDashboard.tsx
│   │       ├── PortfolioDashboard.tsx
│   │       └── MarketDashboard.tsx
│   │
│   ├── data/                      # 더미 데이터
│   │   ├── demoStock.ts
│   │   ├── demoPortfolio.ts
│   │   └── demoMarket.ts
│   │
│   ├── hooks/
│   │   ├── useSchemaDetect.ts
│   │   └── useFinancialCalc.ts
│   │
│   ├── types/
│   │   └── financial.ts
│   │
│   └── App.tsx
│
├── public/
├── package.json
├── vite.config.ts
└── README.md
```

---

## 3. 기술 스택 선택 근거

| 레이어 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **React + Vite** | 빠른 빌드, 컴포넌트 재사용, 광범위한 생태계 |
| 차트 라이브러리 | **Recharts + lightweight-charts** | Recharts=범용, lightweight-charts=캔들스틱 전문 |
| 스타일링 | **Tailwind CSS** | 빠른 UI 구성, 반응형 대응 용이 |
| 상태 관리 | **Zustand** | 경량, Skills.md 규칙 상태 관리에 적합 |
| 데이터 파싱 | **Papa Parse** | CSV 파싱 표준 라이브러리 |
| LLM | **Claude API (claude-sonnet-4-6)** | 한국어 인사이트 생성, Skills.md 해석 능력 |
| 배포 | **Vercel** | 무료, GitHub 연동, 즉시 HTTPS |
| 언어 | **TypeScript** | 금융 데이터 타입 안전성 확보 |

---

## 4. Phase 1 — Skills.md 5종 설계

### 4.1 `skills/data-schema.md` — 데이터 구조 감지 규칙

```markdown
# Data Schema Detection Rules

## 목적
업로드된 CSV/JSON 데이터의 컬럼을 분석하여 데이터 타입을 자동 분류한다.

## 우선순위 감지 규칙

### STOCK_OHLCV (주가 OHLCV 데이터)
조건: 다음 컬럼 패턴 중 하나 이상 존재
- 날짜 컬럼: date | time | timestamp | 날짜 | 일자
- 가격 컬럼: open+high+low+close (모두 존재 시 확정)
- 거래량: volume | vol | 거래량

출력:
  dataType: "STOCK_OHLCV"
  primaryKey: date 컬럼
  valueColumns: [open, high, low, close, volume]

### PORTFOLIO (포트폴리오 데이터)
조건:
- ticker | symbol | 종목코드 + weight | allocation | 비중 존재
- 또는 asset + value | amount 존재

출력:
  dataType: "PORTFOLIO"
  assetColumn: ticker/symbol/asset
  weightColumn: weight/allocation

### RETURNS (수익률 시계열)
조건:
- date 컬럼 + return | returns | 수익률 | pnl | profit 컬럼 존재

출력:
  dataType: "RETURNS"
  returnColumn: 수익률 컬럼명

### MARKET_INDEX (시장 지수 데이터)
조건:
- index | benchmark | 지수 컬럼 존재
- 또는 ticker 값이 ^GSPC, ^KS11, KOSPI, S&P 등 지수 코드

출력:
  dataType: "MARKET_INDEX"

### FINANCIAL_STATEMENT (재무제표)
조건:
- revenue | sales | net_income | eps | 매출 | 영업이익 존재

출력:
  dataType: "FINANCIAL_STATEMENT"

## 예외 처리
- 감지 불가 시: dataType: "GENERIC" → 기본 통계 대시보드 표시
- 컬럼 수가 2개 미만: 에러 메시지 표시
- 숫자 데이터가 전체의 50% 미만: 경고 표시
```

### 4.2 `skills/visualization.md` — 차트 선택 기준

```markdown
# Visualization Selection Rules

## 핵심 원칙
1. 단일 차트 = 단일 인사이트
2. 금융 표준 색상: 상승=green(#26a69a), 하락=red(#ef5350), 중립=blue(#2196f3)
3. 모든 차트는 인터랙티브(툴팁, 줌) 지원

## 데이터 타입별 차트 매핑

### STOCK_OHLCV
PRIMARY: CandlestickChart
  - x축: 날짜 (YYYY-MM-DD)
  - 캔들: open/high/low/close
  - 하단 오버레이: volume (바 차트)
  - 오버레이: MA20(파란선), MA50(주황선), MA200(빨간선)

SECONDARY: RSI(14) + MACD 서브패널

### PORTFOLIO
PRIMARY: TreemapChart
  - 크기: 비중(weight)
  - 색상: 수익률 (수익=녹색, 손실=빨간색)

SECONDARY: DonutChart (섹터 배분)
TERTIARY: BarChart (종목별 수익률 비교)

### RETURNS
PRIMARY: LineChart
  - 누적 수익률 곡선
  - 벤치마크(KOSPI/S&P500) 비교선

SECONDARY: HistogramChart (수익률 분포)
TERTIARY: DrawdownChart (낙폭 차트)

### MARKET_INDEX
PRIMARY: MultiLineChart (복수 지수 비교)
SECONDARY: HeatmapChart (섹터별 성과)

## 공통 규칙
- 데이터 포인트 1000개 초과 시: 자동 리샘플링 (일→주 또는 주→월)
- 모바일 (<768px): 차트 1열 배치
- 데스크탑 (≥1024px): 차트 2~3열 배치
```

### 4.3 `skills/indicators.md` — 금융 지표 계산 공식

```markdown
# Financial Indicators Calculation Rules

## 수익률 지표

### 총 수익률 (Total Return)
공식: (현재가 - 매입가) / 매입가 × 100
단위: %
표시 형식: +12.5% (양수에 + 표시)
색상: 양수=green, 음수=red, 0=gray

### CAGR (연환산 복리 수익률)
공식: (종료값 / 시작값)^(1 / 연수) - 1
연수 계산: (종료일 - 시작일).days / 365.25
데이터 부족 조건: 기간 < 1년 → "N/A (1년 이상 필요)"

### 알파 (Alpha)
공식: 포트폴리오 수익률 - (베타 × 벤치마크 수익률)
기본 무위험 수익률(Rf): 3.5% (한국 기준금리 기준, 사용자 수정 가능)

## 위험 조정 지표

### 샤프 비율 (Sharpe Ratio)
공식: (평균 수익률 - Rf) / 수익률_표준편차
연환산: 일간 데이터 → × √252
해석 규칙:
  < 0    → "위험 대비 수익 부족" (red)
  0 ~ 1  → "보통" (yellow)
  1 ~ 2  → "양호" (green)
  > 2    → "우수" (dark-green)

### 소르티노 비율 (Sortino Ratio)
공식: (평균 수익률 - Rf) / 하방_표준편차
하방_표준편차: 음수 수익률만 사용하여 계산

### 최대 낙폭 (MDD, Maximum Drawdown)
공식: max((누적최고가 - 현재가) / 누적최고가)
표시: -25.3% (항상 음수)
시각화: 낙폭 구간을 LineChart에 음영 표시

### 변동성 (Volatility)
공식: 일간 수익률_표준편차 × √252
표시: 연환산 %

## 기술적 지표

### 이동평균 (Moving Average)
MA_N = 최근 N개 종가의 산술 평균
지원: MA20, MA50, MA200

### RSI (Relative Strength Index)
기간: 14일
공식:
  RS = 평균상승폭 / 평균하락폭
  RSI = 100 - (100 / (1 + RS))
해석: > 70 과매수 (red zone), < 30 과매도 (green zone)

### 볼린저 밴드 (Bollinger Bands)
중심선: MA20
상단: MA20 + (2 × 표준편차_20)
하단: MA20 - (2 × 표준편차_20)
```

### 4.4 `skills/insight-generation.md` — 인사이트 생성 규칙

```markdown
# Insight Generation Rules

## 시스템 역할
당신은 전문 투자 분석가입니다. 제공된 금융 데이터와 계산된 지표를 기반으로
한국어로 명확하고 실용적인 투자 인사이트를 생성합니다.

## 인사이트 생성 우선순위
1. 가장 두드러진 수치 변화를 먼저 언급
2. 위험 요소를 기회 요소보다 먼저 언급 (보수적 원칙)
3. 숫자는 반드시 포함 (막연한 "좋다"보다 "샤프비율 1.8로 우수")
4. 최대 3개 인사이트, 각각 2-3문장

## 템플릿 (데이터 타입별)

### STOCK_OHLCV 인사이트 템플릿
입력: { ticker, currentPrice, priceChange, volume, ma20, ma50, rsi, trend }
출력 형식:
  📈 추세: "[ticker]는 현재 [trend] 추세입니다. MA20([ma20])이 MA50([ma50])을 [상향돌파/하향이탈]하여 [단기 상승/하락] 신호를 보이고 있습니다."
  ⚠️ 모멘텀: "RSI [rsi]로 [과매수/과매도/중립] 구간입니다. [구체적 해석]"
  📊 거래량: "거래량이 평균 대비 [+N%] [증가/감소]하여 [신뢰도 높음/낮음]"

### PORTFOLIO 인사이트 템플릿
입력: { totalReturn, sharpe, mdd, topAsset, worstAsset, concentration }
출력 형식:
  💼 성과: "포트폴리오 총 수익률 [totalReturn]%, 샤프비율 [sharpe]로 [해석]"
  🔴 위험: "최대 낙폭 [mdd]%, [topAsset]에 [concentration]% 집중으로 분산 필요"
  ✅ 추천: "[worstAsset] 비중 축소 및 [구체적 대안] 검토 권고"

### RETURNS 인사이트 템플릿
입력: { cagr, sharpe, sortino, benchmarkReturn, alpha }
출력 형식:
  📊 수익성: "연환산 수익률(CAGR) [cagr]%, 벤치마크 대비 알파 [alpha]%"
  ⚡ 효율성: "샤프비율 [sharpe], 소르티노 비율 [sortino]로 [비교 해석]"
  🎯 종합: "[투자 전략 효율성 종합 평가]"

## 금지 사항
- "투자하세요", "매수하세요" 등 직접 투자 권유 금지
- 미래 수익률 보장 표현 금지
- 근거 없는 추측 금지
- 모든 분석은 과거 데이터 기반임을 명시
```

### 4.5 `skills/dashboard-layout.md` — 레이아웃 구성 규칙

```markdown
# Dashboard Layout Rules

## 레이아웃 원칙
1. F-Pattern: 최상단 KPI → 주요 차트 → 보조 분석 → 상세 테이블
2. 모바일 우선 반응형 설계
3. 다크 테마 기본 (금융 대시보드 표준)

## 데이터 타입별 레이아웃

### STOCK_OHLCV 레이아웃
┌────────────────────────────────────────────────┐
│  KPI Bar: 현재가 | 등락률 | 거래량 | RSI | MA상태 │
├─────────────────────────┬──────────────────────┤
│  캔들스틱 차트 (60%)     │  인사이트 패널 (40%) │
│  + 거래량 서브패널       │  + KPI 상세          │
├─────────────────────────┴──────────────────────┤
│  RSI 패널 (50%)  |  볼린저 밴드 (50%)           │
├────────────────────────────────────────────────┤
│  원시 데이터 테이블 (접기/펼치기)               │
└────────────────────────────────────────────────┘

### PORTFOLIO 레이아웃
┌────────────────────────────────────────────────┐
│  KPI Bar: 총수익률 | 샤프비율 | MDD | 보유종목수 │
├─────────────────────────┬──────────────────────┤
│  트리맵 (50%)            │  도넛 차트 (50%)     │
├─────────────────────────┬──────────────────────┤
│  수익률 바 차트 (60%)    │  인사이트 (40%)      │
├────────────────────────────────────────────────┤
│  포트폴리오 상세 테이블                          │
└────────────────────────────────────────────────┘

## KPI 카드 스펙
- 크기: min-width 160px, 패딩 16px
- 수치 글자: 24px bold
- 레이블: 12px gray
- 변화율: 14px (색상 코딩)
- 로딩: 스켈레톤 애니메이션

## 색상 시스템 (다크 테마)
배경: #0f1117
카드 배경: #1a1d27
보더: #2d3142
텍스트 기본: #e2e8f0
상승: #26a69a  (teal-green)
하락: #ef5350  (red)
중립: #90caf9  (light-blue)
경고: #ffa726  (orange)
```

---

## 5. Phase 2 — 데이터 스키마 자동 감지 엔진

```typescript
// src/engine/schemaDetector.ts

export type DataType =
  | "STOCK_OHLCV"
  | "PORTFOLIO"
  | "RETURNS"
  | "MARKET_INDEX"
  | "FINANCIAL_STATEMENT"
  | "GENERIC";

export interface DetectedSchema {
  dataType: DataType;
  columns: ColumnMeta[];
  primaryKey: string | null;
  dateColumn: string | null;
  valueColumns: string[];
  confidence: number; // 0~1
  warnings: string[];
}

export interface ColumnMeta {
  name: string;
  inferredType: "date" | "number" | "string" | "boolean";
  sample: unknown[];
  nullRatio: number;
}

// 컬럼명 패턴 사전 (skills/data-schema.md 반영)
const COLUMN_PATTERNS = {
  date: /^(date|time|timestamp|날짜|일자|거래일|기준일)$/i,
  open: /^(open|시가|o)$/i,
  high: /^(high|고가|h)$/i,
  low: /^(low|저가|l)$/i,
  close: /^(close|종가|c|price|가격)$/i,
  volume: /^(volume|vol|거래량|v)$/i,
  ticker: /^(ticker|symbol|종목코드|종목|code)$/i,
  weight: /^(weight|allocation|비중|weights|alloc)$/i,
  return: /^(return|returns|수익률|pnl|profit|수익)$/i,
  revenue: /^(revenue|sales|매출|매출액|net_income|영업이익|eps)$/i,
};

function inferColumnType(values: unknown[]): ColumnMeta["inferredType"] {
  const sample = values.filter((v) => v != null).slice(0, 20);
  if (sample.length === 0) return "string";

  // 날짜 패턴 감지
  const dateRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
  if (sample.every((v) => dateRegex.test(String(v)))) return "date";

  // 숫자 감지
  if (sample.every((v) => !isNaN(Number(v)))) return "number";

  return "string";
}

function matchColumn(
  name: string,
  patterns: Record<string, RegExp>
): string | null {
  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.test(name)) return key;
  }
  return null;
}

export function detectSchema(
  headers: string[],
  rows: Record<string, unknown>[]
): DetectedSchema {
  const warnings: string[] = [];

  // 컬럼 메타 분석
  const columns: ColumnMeta[] = headers.map((name) => {
    const values = rows.map((r) => r[name]);
    const nullCount = values.filter((v) => v == null || v === "").length;
    return {
      name,
      inferredType: inferColumnType(values),
      sample: values.slice(0, 5),
      nullRatio: nullCount / values.length,
    };
  });

  // 컬럼명 매핑
  const matched: Record<string, string> = {};
  headers.forEach((h) => {
    const key = matchColumn(h, COLUMN_PATTERNS);
    if (key) matched[key] = h;
  });

  // 데이터 타입 결정 (우선순위 순)
  let dataType: DataType = "GENERIC";
  let confidence = 0.5;

  if (matched.open && matched.high && matched.low && matched.close) {
    dataType = "STOCK_OHLCV";
    confidence = matched.volume ? 0.97 : 0.88;
  } else if (matched.ticker && (matched.weight || matched.return)) {
    dataType = "PORTFOLIO";
    confidence = 0.92;
  } else if (matched.date && matched.return) {
    dataType = "RETURNS";
    confidence = 0.9;
  } else if (matched.revenue) {
    dataType = "FINANCIAL_STATEMENT";
    confidence = 0.85;
  }

  // 경고 생성
  if (columns.length < 2) warnings.push("컬럼이 2개 미만입니다.");
  const numericRatio =
    columns.filter((c) => c.inferredType === "number").length / columns.length;
  if (numericRatio < 0.3) warnings.push("숫자 데이터 비율이 낮습니다 (30% 미만).");

  return {
    dataType,
    columns,
    primaryKey: matched.date || matched.ticker || null,
    dateColumn: matched.date || null,
    valueColumns: Object.values(matched).filter((v) => v !== matched.date),
    confidence,
    warnings,
  };
}
```

---

## 6. Phase 3 — 금융 지표 계산 엔진

```typescript
// src/engine/financialEngine.ts
// skills/indicators.md 를 코드로 구현

export interface OHLCVRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FinancialMetrics {
  // 수익률
  totalReturn: number;
  cagr: number | null;
  // 위험 조정
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  mdd: number;
  volatility: number;
  // 기술적
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
  rsi14: number | null;
  bollingerUpper: number | null;
  bollingerLower: number | null;
}

const RF_DAILY = 0.035 / 252; // 연 3.5% 무위험 수익률 → 일간

// ─── 이동평균 ──────────────────────────────────────────
export function movingAverage(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

// ─── RSI ──────────────────────────────────────────────
export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const changes = closes.map((c, i) => (i === 0 ? 0 : c - closes[i - 1]));
  const result: (number | null)[] = new Array(period).fill(null);

  let avgGain = changes.slice(1, period + 1).filter((c) => c > 0).reduce((a, b) => a + b, 0) / period;
  let avgLoss = changes.slice(1, period + 1).filter((c) => c < 0).reduce((a, b) => a + Math.abs(b), 0) / period;

  for (let i = period; i < closes.length; i++) {
    const change = changes[i];
    avgGain = (avgGain * (period - 1) + Math.max(0, change)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.abs(Math.min(0, change))) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }
  return result;
}

// ─── 볼린저 밴드 ────────────────────────────────────────
export function bollingerBands(closes: number[], period = 20, multiplier = 2) {
  const mas = movingAverage(closes, period);
  return closes.map((_, i) => {
    if (i < period - 1) return { upper: null, middle: null, lower: null };
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = mas[i]!;
    const std = Math.sqrt(slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period);
    return {
      upper: mean + multiplier * std,
      middle: mean,
      lower: mean - multiplier * std,
    };
  });
}

// ─── 샤프 비율 ─────────────────────────────────────────
export function sharpeRatio(returns: number[], rf = RF_DAILY): number | null {
  if (returns.length < 20) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std = Math.sqrt(returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / returns.length);
  if (std === 0) return null;
  return ((mean - rf) / std) * Math.sqrt(252); // 연환산
}

// ─── 소르티노 비율 ──────────────────────────────────────
export function sortinoRatio(returns: number[], rf = RF_DAILY): number | null {
  if (returns.length < 20) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downside = returns.filter((r) => r < rf);
  if (downside.length === 0) return null;
  const downsideStd = Math.sqrt(downside.reduce((acc, r) => acc + (r - rf) ** 2, 0) / downside.length);
  if (downsideStd === 0) return null;
  return ((mean - rf) / downsideStd) * Math.sqrt(252);
}

// ─── 최대 낙폭 (MDD) ────────────────────────────────────
export function maxDrawdown(prices: number[]): number {
  let peak = prices[0];
  let mdd = 0;
  for (const price of prices) {
    if (price > peak) peak = price;
    const dd = (peak - price) / peak;
    if (dd > mdd) mdd = dd;
  }
  return -mdd * 100; // 음수 %
}

// ─── CAGR ───────────────────────────────────────────────
export function calculateCAGR(startValue: number, endValue: number, days: number): number | null {
  if (days < 365) return null;
  const years = days / 365.25;
  return ((endValue / startValue) ** (1 / years) - 1) * 100;
}

// ─── 종합 계산 ──────────────────────────────────────────
export function calculateAllMetrics(data: OHLCVRow[]): FinancialMetrics {
  const closes = data.map((d) => d.close);
  const returns = closes.map((c, i) => (i === 0 ? 0 : (c - closes[i - 1]) / closes[i - 1])).slice(1);

  const mas20 = movingAverage(closes, 20);
  const mas50 = movingAverage(closes, 50);
  const mas200 = movingAverage(closes, 200);
  const rsis = calculateRSI(closes);
  const bands = bollingerBands(closes);

  const last = closes.length - 1;
  const first = closes[0];
  const lastClose = closes[last];
  const days = data.length; // 거래일 기준

  return {
    totalReturn: ((lastClose - first) / first) * 100,
    cagr: calculateCAGR(first, lastClose, (days / 252) * 365),
    sharpeRatio: sharpeRatio(returns),
    sortinoRatio: sortinoRatio(returns),
    mdd: maxDrawdown(closes),
    volatility: (Math.sqrt(returns.reduce((acc, r) => {
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      return acc + (r - mean) ** 2;
    }, 0) / returns.length) * Math.sqrt(252)) * 100,
    ma20: mas20[last],
    ma50: mas50[last],
    ma200: mas200[last],
    rsi14: rsis[last],
    bollingerUpper: bands[last].upper,
    bollingerLower: bands[last].lower,
  };
}
```

---

## 7. Phase 4 — 시각화 컴포넌트 시스템

### 7.1 KPI 카드 컴포넌트

```tsx
// src/components/widgets/KPICard.tsx

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;      // 변화율 (%)
  unit?: string;
  tooltip?: string;
  size?: "sm" | "md" | "lg";
}

const colorMap = {
  positive: "text-teal-400",
  negative: "text-red-400",
  neutral: "text-blue-300",
};

export function KPICard({ label, value, change, unit, tooltip, size = "md" }: KPICardProps) {
  const changeColor =
    change === undefined ? colorMap.neutral
    : change > 0 ? colorMap.positive
    : change < 0 ? colorMap.negative
    : colorMap.neutral;

  const sizeClass = {
    sm: "p-3 min-w-[120px]",
    md: "p-4 min-w-[160px]",
    lg: "p-6 min-w-[200px]",
  }[size];

  return (
    <div
      className={`bg-[#1a1d27] border border-[#2d3142] rounded-xl ${sizeClass} hover:border-blue-500/50 transition-colors`}
      title={tooltip}
    >
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
      </p>
      {change !== undefined && (
        <p className={`text-sm mt-1 ${changeColor}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
        </p>
      )}
    </div>
  );
}
```

### 7.2 차트 팩토리 — 자동 차트 선택

```tsx
// src/components/charts/ChartFactory.tsx
// skills/visualization.md 규칙을 컴포넌트로 구현

import { DetectedSchema } from "../../engine/schemaDetector";
import { CandlestickChart } from "./CandlestickChart";
import { PortfolioTreemap } from "./TreemapChart";
import { ReturnsLineChart } from "./LineChart";
import { GenericBarChart } from "./BarChart";

interface ChartFactoryProps {
  schema: DetectedSchema;
  data: Record<string, unknown>[];
  height?: number;
}

export function ChartFactory({ schema, data, height = 400 }: ChartFactoryProps) {
  switch (schema.dataType) {
    case "STOCK_OHLCV":
      return <CandlestickChart data={data as OHLCVRow[]} height={height} />;

    case "PORTFOLIO":
      return <PortfolioTreemap data={data} height={height} />;

    case "RETURNS":
      return <ReturnsLineChart data={data} height={height} />;

    case "MARKET_INDEX":
      return <MultiIndexChart data={data} height={height} />;

    default:
      // GENERIC: 컬럼 타입에 따라 자동 선택
      const numericCols = schema.columns.filter((c) => c.inferredType === "number");
      if (numericCols.length >= 2) {
        return <GenericBarChart data={data} columns={numericCols.map((c) => c.name)} height={height} />;
      }
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          데이터를 인식할 수 없습니다. CSV 형식을 확인해주세요.
        </div>
      );
  }
}
```

### 7.3 캔들스틱 차트 (lightweight-charts)

```tsx
// src/components/charts/CandlestickChart.tsx

import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickData } from "lightweight-charts";

interface Props {
  data: OHLCVRow[];
  height?: number;
}

export function CandlestickChart({ data, height = 400 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0f1117" },
        textColor: "#e2e8f0",
      },
      grid: {
        vertLines: { color: "#2d3142" },
        horzLines: { color: "#2d3142" },
      },
      height,
    });

    // 캔들스틱
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    const candleData: CandlestickData[] = data.map((d) => ({
      time: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candleSeries.setData(candleData);

    // MA20
    const ma20Series = chart.addLineSeries({ color: "#2196f3", lineWidth: 1 });
    const ma20Data = movingAverage(data.map((d) => d.close), 20);
    ma20Series.setData(
      data.map((d, i) => ({ time: d.date, value: ma20Data[i] ?? NaN }))
        .filter((d) => !isNaN(d.value))
    );

    // MA50
    const ma50Series = chart.addLineSeries({ color: "#ff9800", lineWidth: 1 });
    const ma50Data = movingAverage(data.map((d) => d.close), 50);
    ma50Series.setData(
      data.map((d, i) => ({ time: d.date, value: ma50Data[i] ?? NaN }))
        .filter((d) => !isNaN(d.value))
    );

    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [data, height]);

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
```

---

## 8. Phase 5 — LLM 인사이트 생성 파이프라인

```typescript
// src/engine/insightGenerator.ts
// skills/insight-generation.md 를 시스템 프롬프트로 주입

import insightSkill from "../../skills/insight-generation.md?raw"; // Vite raw import

interface InsightRequest {
  dataType: string;
  metrics: Record<string, number | null>;
  summary: string; // 데이터 요약 텍스트
}

interface InsightResponse {
  insights: string[];
  summary: string;
  loading: boolean;
  error: string | null;
}

export async function generateInsights(
  request: InsightRequest,
  apiKey: string
): Promise<string[]> {
  const systemPrompt = `
${insightSkill}

## 현재 분석 대상
- 데이터 타입: ${request.dataType}
- 데이터 요약: ${request.summary}
`;

  const userMessage = `
다음 금융 지표를 분석하고 insight-generation.md 규칙에 따라 한국어 인사이트를 생성해주세요.

지표:
${Object.entries(request.metrics)
  .filter(([, v]) => v !== null)
  .map(([k, v]) => `- ${k}: ${typeof v === "number" ? v.toFixed(4) : v}`)
  .join("\n")}

JSON 형식으로 반환: { "insights": ["인사이트1", "인사이트2", "인사이트3"] }
`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) throw new Error(`API 오류: ${response.status}`);

  const result = await response.json();
  const text = result.content[0].text;

  // JSON 파싱
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("인사이트 파싱 실패");
  return JSON.parse(jsonMatch[0]).insights;
}
```

### 8.1 인사이트 패널 컴포넌트

```tsx
// src/components/widgets/InsightPanel.tsx

import { useState, useEffect } from "react";
import { generateInsights } from "../../engine/insightGenerator";

interface Props {
  metrics: Record<string, number | null>;
  dataType: string;
  summary: string;
}

export function InsightPanel({ metrics, dataType, summary }: Props) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey) {
      // API 키 없으면 규칙 기반 폴백
      setInsights(generateRuleBasedInsights(metrics, dataType));
      return;
    }

    setLoading(true);
    generateInsights({ dataType, metrics, summary }, apiKey)
      .then(setInsights)
      .catch((e) => {
        setError("인사이트 생성 실패");
        setInsights(generateRuleBasedInsights(metrics, dataType));
      })
      .finally(() => setLoading(false));
  }, [metrics]);

  return (
    <div className="bg-[#1a1d27] border border-[#2d3142] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">AI 인사이트</h3>
      {loading && <SkeletonInsight />}
      {insights.map((insight, i) => (
        <div key={i} className="mb-3 p-3 bg-[#0f1117] rounded-lg text-sm text-gray-200 leading-relaxed">
          {insight}
        </div>
      ))}
      {error && <p className="text-xs text-orange-400">{error} (규칙 기반 분석 사용 중)</p>}
    </div>
  );
}

// API 미사용 시 규칙 기반 폴백 (skills/insight-generation.md 기반)
function generateRuleBasedInsights(
  metrics: Record<string, number | null>,
  dataType: string
): string[] {
  const insights: string[] = [];
  const { sharpeRatio, totalReturn, mdd, rsi14, volatility } = metrics as Record<string, number | null>;

  if (sharpeRatio !== null) {
    const grade =
      sharpeRatio > 2 ? "매우 우수 (2.0+)" :
      sharpeRatio > 1 ? "양호 (1.0~2.0)" :
      sharpeRatio > 0 ? "보통 (0~1.0)" : "위험 대비 수익 부족";
    insights.push(`💼 위험 대비 수익: 샤프 비율 ${sharpeRatio.toFixed(2)}로 ${grade}합니다.`);
  }

  if (totalReturn !== null) {
    const sign = totalReturn >= 0 ? "+" : "";
    insights.push(`📈 총 수익률: ${sign}${totalReturn.toFixed(2)}%${mdd !== null ? `, 최대 낙폭 ${mdd.toFixed(1)}%` : ""}`);
  }

  if (rsi14 !== null) {
    const status = rsi14 > 70 ? "과매수 구간 — 단기 조정 가능성" :
                   rsi14 < 30 ? "과매도 구간 — 반등 가능성" : "중립 구간";
    insights.push(`⚡ RSI(14): ${rsi14.toFixed(1)} — ${status}`);
  }

  return insights.length > 0 ? insights : ["데이터가 충분하지 않아 인사이트를 생성할 수 없습니다."];
}
```

---

## 9. Phase 6 — 대시보드 레이아웃 및 라우팅

```tsx
// src/App.tsx

import { useState } from "react";
import { UploadZone } from "./components/widgets/UploadZone";
import { DashboardShell } from "./components/layout/DashboardShell";
import { detectSchema } from "./engine/schemaDetector";
import Papa from "papaparse";

type AppState = "landing" | "loading" | "dashboard";

export default function App() {
  const [state, setState] = useState<AppState>("landing");
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [schema, setSchema] = useState(null);

  const handleFileUpload = (file: File) => {
    setState("loading");
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        const rows = result.data as Record<string, unknown>[];
        const headers = result.meta.fields ?? [];
        const detected = detectSchema(headers, rows);
        setData(rows);
        setSchema(detected);
        setState("dashboard");
      },
    });
  };

  const handleDemoMode = () => {
    // 더미 데이터로 즉시 대시보드 진입
    import("./data/demoStock").then(({ DEMO_STOCK_DATA, DEMO_SCHEMA }) => {
      setData(DEMO_STOCK_DATA);
      setSchema(DEMO_SCHEMA);
      setState("dashboard");
    });
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {state === "landing" && (
        <LandingPage onUpload={handleFileUpload} onDemo={handleDemoMode} />
      )}
      {state === "loading" && <LoadingScreen />}
      {state === "dashboard" && schema && (
        <DashboardShell data={data} schema={schema} onReset={() => setState("landing")} />
      )}
    </div>
  );
}
```

```tsx
// src/components/layout/DashboardShell.tsx

import { KPIBar } from "./KPIBar";
import { ChartFactory } from "../charts/ChartFactory";
import { InsightPanel } from "../widgets/InsightPanel";
import { DataTable } from "../widgets/DataTable";
import { calculateAllMetrics } from "../../engine/financialEngine";

export function DashboardShell({ data, schema, onReset }) {
  const metrics = schema.dataType === "STOCK_OHLCV"
    ? calculateAllMetrics(data)
    : null;

  return (
    <div className="flex flex-col h-screen overflow-auto">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#2d3142]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">📊 InvestDash</span>
          <span className="px-2 py-0.5 text-xs bg-[#2d3142] rounded-full text-gray-300">
            {schema.dataType}
          </span>
          <span className="text-xs text-gray-500">
            신뢰도: {(schema.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <button onClick={onReset} className="text-xs text-gray-400 hover:text-white">
          ← 새 파일 업로드
        </button>
      </header>

      {/* KPI 바 */}
      {metrics && <KPIBar metrics={metrics} />}

      {/* 메인 그리드 */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 p-4">
        {/* 주요 차트 (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          <ChartFactory schema={schema} data={data} height={380} />
        </div>

        {/* 사이드 패널 (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {metrics && (
            <InsightPanel
              metrics={metrics as any}
              dataType={schema.dataType}
              summary={`${data.length}개 데이터 포인트`}
            />
          )}
        </div>
      </main>

      {/* 데이터 테이블 */}
      <section className="p-4">
        <DataTable data={data.slice(0, 50)} />
      </section>
    </div>
  );
}
```

---

## 10. Phase 7 — 더미 데이터 & 데모 모드

```typescript
// src/data/demoStock.ts
// 삼성전자 2년치 모의 주가 데이터

import { DetectedSchema } from "../engine/schemaDetector";

function generateStockData(
  startPrice: number,
  days: number,
  startDate: string
): OHLCVRow[] {
  const data: OHLCVRow[] = [];
  let price = startPrice;
  const date = new Date(startDate);

  for (let i = 0; i < days; i++) {
    // 다음 거래일 (주말 제외)
    do { date.setDate(date.getDate() + 1); }
    while (date.getDay() === 0 || date.getDay() === 6);

    // GBM (Geometric Brownian Motion) 모의
    const drift = 0.0003;     // 일간 드리프트
    const sigma = 0.018;      // 일간 변동성
    const z = (Math.random() - 0.5) * 2;
    const change = price * (drift + sigma * z);
    price = Math.max(price + change, price * 0.85);

    const high = price * (1 + Math.random() * 0.02);
    const low = price * (1 - Math.random() * 0.02);
    const open = low + Math.random() * (high - low);
    const volume = Math.floor(10_000_000 + Math.random() * 30_000_000);

    data.push({
      date: date.toISOString().split("T")[0],
      open: +open.toFixed(0),
      high: +high.toFixed(0),
      low: +low.toFixed(0),
      close: +price.toFixed(0),
      volume,
    });
  }
  return data;
}

export const DEMO_STOCK_DATA = generateStockData(70000, 504, "2024-01-01");

export const DEMO_SCHEMA: DetectedSchema = {
  dataType: "STOCK_OHLCV",
  columns: [
    { name: "date", inferredType: "date", sample: [], nullRatio: 0 },
    { name: "open", inferredType: "number", sample: [], nullRatio: 0 },
    { name: "high", inferredType: "number", sample: [], nullRatio: 0 },
    { name: "low", inferredType: "number", sample: [], nullRatio: 0 },
    { name: "close", inferredType: "number", sample: [], nullRatio: 0 },
    { name: "volume", inferredType: "number", sample: [], nullRatio: 0 },
  ],
  primaryKey: "date",
  dateColumn: "date",
  valueColumns: ["open", "high", "low", "close", "volume"],
  confidence: 0.97,
  warnings: [],
};
```

---

## 11. Phase 8 — 배포 전략

### 11.1 환경 변수 설정

```bash
# .env.local (로컬 개발용 — .gitignore에 추가)
VITE_CLAUDE_API_KEY=sk-ant-xxxxx

# .env.production (Vercel 환경 변수로 등록)
VITE_CLAUDE_API_KEY=sk-ant-xxxxx
```

### 11.2 Vite 설정

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["lightweight-charts", "recharts"],
          engine: ["./src/engine/financialEngine", "./src/engine/schemaDetector"],
        },
      },
    },
  },
  assetsInclude: ["**/*.md"], // Skills.md raw import 허용
});
```

### 11.3 package.json 핵심 의존성

```json
{
  "name": "invest-dashboard",
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lightweight-charts": "^4.2.0",
    "recharts": "^2.12.0",
    "papaparse": "^5.4.1",
    "zustand": "^4.5.2",
    "tailwindcss": "^3.4.0",
    "@types/papaparse": "^5.3.14"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### 11.4 Vercel 배포 명령

```bash
# 1. GitHub 레포 생성 및 push
git init && git add . && git commit -m "init: invest dashboard"
gh repo create invest-dashboard --public --push

# 2. Vercel CLI 배포
npx vercel --prod

# 3. 환경 변수 등록
vercel env add VITE_CLAUDE_API_KEY production
```

---

## 12. 바이브 코딩 워크플로우

### 단계별 LLM 프롬프트 (실제 사용 프롬프트)

**Step 1 — 프로젝트 스캐폴딩**
```
Skills 폴더(skills/)에 다음 5개 MD 파일이 있습니다:
[skills/data-schema.md 내용 붙여넣기]
[skills/visualization.md 내용 붙여넣기]
[skills/indicators.md 내용 붙여넣기]
[skills/insight-generation.md 내용 붙여넣기]
[skills/dashboard-layout.md 내용 붙여넣기]

이 Skills.md 규칙들을 기반으로 React + Vite + TypeScript + Tailwind CSS로
금융 투자 대시보드를 구현해주세요.

기술 스택:
- 차트: lightweight-charts (캔들스틱), recharts (나머지)
- 데이터 파싱: papaparse
- 스타일: tailwindcss (다크 테마)

먼저 src/engine/schemaDetector.ts를 구현해주세요.
```

**Step 2 — 금융 엔진**
```
src/engine/financialEngine.ts를 구현해주세요.
skills/indicators.md의 모든 지표를 정확한 공식으로 구현해야 합니다.
TypeScript 타입을 엄격하게 적용하고, 
무위험 수익률은 3.5% (한국 기준금리)를 사용해주세요.
```

**Step 3 — 차트 컴포넌트**
```
skills/visualization.md의 차트 선택 기준에 따라
ChartFactory.tsx와 하위 차트 컴포넌트들을 구현해주세요.
skills/dashboard-layout.md의 색상 시스템을 그대로 적용해주세요.
```

**Step 4 — LLM 인사이트 연결**
```
skills/insight-generation.md를 시스템 프롬프트로 주입하여
Claude API를 호출하는 insightGenerator.ts를 구현해주세요.
API 키가 없을 때는 규칙 기반 폴백으로 동작해야 합니다.
```

**Step 5 — 전체 조립**
```
위에서 만든 모든 컴포넌트를 연결하는 App.tsx와 DashboardShell.tsx를
구현해주세요. skills/dashboard-layout.md의 F-Pattern 레이아웃을 따르고,
CSV 파일 업로드와 데모 모드를 모두 지원해야 합니다.
```

---

## 13. 구현 우선순위 & 타임라인

```
Day 1 (Foundation)                                    [완료]
  ✅ Skills.md 5종 작성 완성 ← 가장 중요
  ✅ 프로젝트 스캐폴딩 (Vite + React + TypeScript + Tailwind CSS v4)
  ✅ SchemaDetector + FinancialEngine 구현

Day 2 (Core UI)                                       [완료]
  ✅ 차트 컴포넌트 (캔들스틱/RSI/드로다운/수익률라인/바)
  ✅ KPICard + InsightPanel + UploadZone + DataTable
  ✅ DashboardShell + KPIBar 레이아웃

Day 3 (Integration)                                   [완료]
  ✅ Claude API 인사이트 연동 (VITE_CLAUDE_API_KEY 환경변수)
  ✅ CSV 업로드 + 스키마 자동 감지 (PapaParse)
  ✅ 더미 데이터 3종 (주가/포트폴리오/수익률, LCG 시드 고정)

Day 4 (Polish & Deploy)                               [완료]
  ✅ 포트폴리오 트리맵 + 수익률 누적 차트 + 낙폭 차트
  ✅ 반응형 레이아웃 (lg:grid-cols-5 분할)
  ✅ TypeScript strict 모드 통과 (tsc --noEmit / tsc -b: 0 오류)
  ✅ 규칙 기반 AI 폴백 인사이트 (API 키 없이도 동작)
```

### 점수 최적화 체크리스트

```
범용성 (25점)
  ✅ CSV 자동 스키마 감지 동작 확인 — COLUMN_PATTERNS 정규식 기반 5종 분류
  ✅ 주가/포트폴리오/수익률 3가지 데이터 타입 대응
  ✅ 데이터 없을 때 더미 데이터로 폴백 (demoStock/demoPortfolio/demoReturns)
  ✅ 잘못된 데이터에 대한 에러 처리 (confidence 점수 + warnings 표시)

Skills.md 설계 (25점)
  ✅ 5개 Skills.md 파일 완성 (data-schema / visualization / indicators / insight-generation / dashboard-layout)
  ✅ 각 파일에 조건-행동 형식 규칙 포함
  ✅ 계산 공식 명시 (샤프비율, RSI, MDD, Sortino, CAGR, Bollinger 등)
  ✅ 인사이트 생성 템플릿 포함 (STOCK/PORTFOLIO/RETURNS 3종)
  ✅ 예외 처리 규칙 포함

대시보드 자동 생성 (25점)
  ✅ 데이터 업로드 즉시 대시보드 렌더링 (PapaParse → detectSchema → DashboardShell)
  ✅ 6종 차트 구현 (CandlestickChart / RSIChart / DrawdownChart / ReturnsLineChart / PortfolioTreemap / PortfolioBarChart)
  ✅ KPI 카드 자동 계산 (totalReturn / CAGR / Sharpe / MDD / Volatility / RSI 등)
  ✅ AI 인사이트 자동 생성 (Claude API + 규칙 기반 폴백)

바이브코딩 활용 (15점)
  ✅ research.md에 프롬프트 전략 및 Skills.md 주입 워크플로우 문서화
  ✅ plan.md에 단계별 바이브 코딩 프롬프트 예시 포함
  ✅ Skills.md가 LLM 컨텍스트 주입 문서로서 코드 생성 지시

실용성·창의성 (10점)
  ✅ 한국어 인사이트 (Claude API + 규칙 기반 한국어 출력)
  ✅ 다크 테마 금융 UX (#0f1117 배경, #26a69a/#ef5350 상승/하락 색상)
  ✅ lightweight-charts v5 캔들스틱 + MA20/MA50 오버레이
```

---

*이 계획서는 `research.md`의 분석 결과를 바탕으로, LLM4Dash·Data-to-Dashboard 논문의 아키텍처 원리와 Anthropic 컨텍스트 엔지니어링 가이드라인을 반영하여 작성되었습니다.*
