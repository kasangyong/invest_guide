# InvestDash

> CSV 한 장으로 전문 금융 대시보드를 즉시 생성하는 투자 분석 도구

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com/)

---

## 개요

InvestDash는 주가 OHLCV, 포트폴리오, 수익률 시계열 CSV 파일을 업로드하면 스키마를 자동 감지하고, 그에 맞는 차트·KPI·AI 인사이트를 즉시 생성해주는 웹 대시보드입니다.

별도 회원가입, 서버, 데이터베이스가 필요 없으며 모든 계산은 브라우저 안에서 실행됩니다. Claude API 키(선택)를 설정하면 AI가 한국어 투자 인사이트를 직접 생성합니다.

---

## 주요 기능

### 데이터 자동 감지
CSV를 업로드하면 컬럼명 패턴을 분석해 데이터 타입을 자동 분류합니다.

| 데이터 타입 | 감지 조건 | 예시 컬럼 |
|---|---|---|
| `STOCK_OHLCV` | date + open/high/low/close + volume | `date, open, high, low, close, volume` |
| `PORTFOLIO` | ticker/종목 + weight/비중 | `ticker, weight, returnRate, sector` |
| `RETURNS` | date + return/수익률 | `date, return` |
| `FINANCIAL_STATEMENT` | revenue/당기순이익 등 재무 키워드 | `revenue, net_income, eps` |
| `GENERIC` | 위 조건 미해당 시 | (범용 테이블) |

### 차트 시스템

**STOCK_OHLCV 모드**
- 캔들스틱 차트 (lightweight-charts v5) + 거래량 히스토그램
- MA20(amber) · MA50(indigo) 이동평균선 오버레이
- 볼린저 밴드(BB Upper/Middle/Lower, blue-dashed)
- RSI(14) 차트 — 70선(빨간) · 30선(teal) 기준선 색상 구분
- 누적 수익률 곡선 (recharts AreaChart)
- MDD 낙폭 차트 — 손실 구간 빨간 그라데이션

**PORTFOLIO 모드**
- 포트폴리오 트리맵 — 비중(크기) · 수익률(색상)
- 종목별 수익률 바 차트 (수평)

**RETURNS 모드**
- 누적 수익률 라인 차트
- MDD 낙폭 차트

### KPI 바

| 지표 | 설명 | 색상 기준 |
|---|---|---|
| 현재가 | 최신 종가 | 전일 대비 teal/red |
| 전체 수익률 | 기간 총 수익률 | +teal / -red |
| CAGR | 연평균 복리 수익률 | +teal / -red |
| 샤프 비율 | 위험조정 수익률 | ≥1 teal, <0 red |
| 소르티노 | 하방 위험 기준 수익률 | ≥1 teal, <0 red |
| 최대 낙폭(MDD) | 최대 고점 대비 하락 % | <-20% red |
| 변동성 | 연환산 표준편차 % | >30% red |
| RSI(14) | 상대강도지수 | >70 red, <30 teal |

### 금융 지표 계산 엔진 (`src/engine/financialEngine.ts`)

모든 계산은 클라이언트에서 직접 수행됩니다.

| 지표 | 계산 방식 |
|---|---|
| **이동평균** | SMA(단순이동평균) — MA20, MA50, MA200 |
| **RSI(14)** | Wilder's smoothing method (EMA 기반) |
| **볼린저 밴드** | 20일 SMA ± 2σ |
| **MDD** | `(현재가 - 구간고점) / 구간고점` 전체 최솟값 |
| **CAGR** | `(최종가 / 초기가)^(252/거래일수) - 1` |
| **샤프 비율** | `(평균수익률 - Rf) / 표준편차 × √252` (Rf=0%) |
| **소르티노** | `(평균수익률) / 하방편차 × √252` |
| **누적 수익률** | 일간 수익률 `(1 + r)` 곱산 |
| **낙폭 시계열** | 각 시점의 고점 대비 낙폭 |

### AI 인사이트 (`src/engine/insightGenerator.ts`)

**Claude API 연동 모드** (선택)
- `VITE_CLAUDE_API_KEY` 환경변수 설정 시 활성화
- Claude Sonnet 4.6 모델로 계산된 지표를 전송
- 한국어 2~3문장 인사이트 최대 5개 생성

**규칙 기반 폴백** (기본값 / API 키 없을 때)
- MA 골든크로스 / 데드크로스 감지 + 괴리율 계산
- RSI 6단계 구간 해석 (심한과매수 / 과매수 / 중립 / 과매도 / 심한과매도)
- 볼린저 밴드 스퀴즈 감지 (밴드폭 4% / 6% 임계값)
- 거래량 이상 탐지 (20일 평균 대비 +100%, -70% 기준)
- MDD + 변동성 등급 자동 분류 및 코멘트 생성

---

## 빠른 시작

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/invest-dashboard.git
cd invest-dashboard

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### Claude API 연동 (선택)

```bash
# 프로젝트 루트에 .env 파일 생성
echo "VITE_CLAUDE_API_KEY=sk-ant-api03-..." > .env
```

API 키가 없을 경우 자동으로 규칙 기반 인사이트가 표시됩니다.

---

## CSV 형식 가이드

### STOCK_OHLCV

캔들스틱 차트, RSI, 볼린저 밴드, MDD, CAGR 등 전체 분석을 지원합니다.

```csv
date,open,high,low,close,volume
2024-01-02,70000,71200,69500,70800,8500000
2024-01-03,70800,72100,70300,71500,7200000
2024-01-04,71500,71800,70100,70400,9100000
```

| 컬럼 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `date` | YYYY-MM-DD | ✅ | 거래일 |
| `open` | 숫자 | ✅ | 시가 |
| `high` | 숫자 | ✅ | 고가 |
| `low` | 숫자 | ✅ | 저가 |
| `close` | 숫자 | ✅ | 종가 |
| `volume` | 숫자 | ✅ | 거래량 |

최소 20행 이상 권장 (MA20 계산 기준). RSI는 14행, 볼린저 밴드는 20행부터 계산됩니다.

> 📎 테스트용 샘플 파일: `public/KAKAO_OHLCV_2024.csv` (120거래일, +12.2%)

---

### PORTFOLIO

```csv
ticker,name,weight,returnRate,sector
005930,삼성전자,25.0,12.5,반도체
000660,SK하이닉스,15.0,8.3,반도체
035420,NAVER,10.0,-3.2,IT
051910,LG화학,8.0,5.1,화학
```

| 컬럼 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `ticker` | 문자열 | ✅ | 종목코드 또는 이름 |
| `name` | 문자열 | ❌ | 종목명 |
| `weight` | 숫자 (0~100) | ✅ | 비중 % |
| `returnRate` | 숫자 | ❌ | 수익률 % |
| `sector` | 문자열 | ❌ | 섹터 |
| `currentValue` | 숫자 | ❌ | 현재 평가금액 |

트리맵 크기는 `weight`, 색상은 `returnRate`로 결정됩니다.

---

### RETURNS (수익률 시계열)

```csv
date,return
2024-01-02,0.0112
2024-01-03,-0.0058
2024-01-04,0.0203
2024-01-05,-0.0034
```

| 컬럼 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `date` | YYYY-MM-DD | ✅ | 날짜 |
| `return` | 소수 (0.01 = 1%) | ✅ | 일간 수익률 |
| `benchmark` | 소수 | ❌ | 벤치마크 수익률 |

---

## 프로젝트 구조

```
invest-dashboard/
├── public/
│   ├── KAKAO_OHLCV_2024.csv      # 테스트용 샘플 CSV (120거래일)
│   └── SAMSUNG_OHLCV_2023.csv    # 삼성전자 시뮬레이션 (252거래일)
│
├── skills/                        # Skills.md — 시스템 규칙 정의 파일
│   ├── data-schema.md             # 스키마 감지 규칙
│   ├── visualization.md           # 차트 선택 기준
│   ├── indicators.md              # 금융 지표 공식 정의
│   ├── insight-generation.md      # AI 인사이트 시스템 프롬프트
│   └── dashboard-layout.md        # 레이아웃 · 색상 시스템
│
├── src/
│   ├── App.tsx                    # 랜딩 페이지 + 라우팅
│   │
│   ├── engine/
│   │   ├── financialEngine.ts     # RSI, Bollinger, Sharpe, MDD, CAGR 계산
│   │   ├── insightGenerator.ts    # Claude API + 규칙 기반 인사이트
│   │   └── schemaDetector.ts      # CSV 컬럼명 자동 분류
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardShell.tsx # 대시보드 전체 레이아웃
│   │   │   └── KPIBar.tsx         # 상단 KPI 카드 바
│   │   │
│   │   ├── charts/
│   │   │   ├── CandlestickChart.tsx  # lightweight-charts 캔들 + BB + MA
│   │   │   ├── RSIChart.tsx          # RSI(14) 라인 차트
│   │   │   ├── DrawdownChart.tsx     # MDD 낙폭 영역 차트
│   │   │   ├── ReturnsLineChart.tsx  # 누적 수익률 차트
│   │   │   ├── PortfolioTreemap.tsx  # 포트폴리오 트리맵
│   │   │   └── PortfolioBarChart.tsx # 종목별 수익률 바 차트
│   │   │
│   │   └── widgets/
│   │       ├── InsightPanel.tsx   # AI 인사이트 패널
│   │       ├── KPICard.tsx        # KPI 카드 컴포넌트
│   │       ├── DataTable.tsx      # 원시 데이터 테이블
│   │       └── UploadZone.tsx     # 드래그&드롭 업로드 존
│   │
│   ├── data/
│   │   ├── demoStock.ts           # 삼성전자 데모 데이터
│   │   ├── demoPortfolio.ts       # KOSPI 포트폴리오 데모
│   │   └── demoReturns.ts         # 수익률 시계열 데모
│   │
│   └── types/
│       └── financial.ts           # 전체 TypeScript 타입 정의
```

---

## 기술 스택

| 분류 | 라이브러리 | 버전 | 용도 |
|---|---|---|---|
| UI 프레임워크 | React | 19 | 컴포넌트 기반 UI |
| 빌드 도구 | Vite | 8 | HMR, 번들링 |
| 언어 | TypeScript | 6.0 | 정적 타입 (strict 모드) |
| 스타일 | Tailwind CSS | v4 | 유틸리티 CSS |
| 캔들스틱 차트 | lightweight-charts | 5.1 | TradingView 오픈소스 |
| 기타 차트 | recharts | 3.8 | RSI, 수익률, 낙폭 |
| CSV 파싱 | PapaParse | 5.5 | 헤더 자동 감지, 동적 타이핑 |
| AI | Claude API | Sonnet 4.6 | 투자 인사이트 생성 |

---

## Skills.md 아키텍처

이 프로젝트는 `skills/` 디렉터리의 마크다운 파일들이 시스템 전체 동작 규칙을 정의하는 구조입니다.

```
skills/data-schema.md      →  schemaDetector.ts 의 감지 규칙
skills/indicators.md       →  financialEngine.ts 의 계산 공식
skills/visualization.md    →  DashboardShell.tsx 의 차트 선택 기준
skills/insight-generation.md → insightGenerator.ts 의 Claude 시스템 프롬프트
skills/dashboard-layout.md →  색상 시스템 · 레이아웃 원칙
```

코드를 수정하지 않고 Skills.md만 변경해도 시스템 동작을 바꿀 수 있습니다.

---

## 빌드 및 배포

```bash
# 타입 검사
npx tsc --noEmit

# 프로덕션 빌드
npm run build

# 빌드 결과 로컬 미리보기
npm run preview
```

빌드 결과는 `dist/` 디렉터리에 생성됩니다. Vercel, Netlify, GitHub Pages 등 정적 호스팅에 바로 배포 가능합니다.

### Vercel 배포 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경변수 설정 (선택)
vercel env add VITE_CLAUDE_API_KEY
```

---

## 색상 시스템

대시보드는 다크 테마 기반입니다.

| 역할 | 색상 | 용도 |
|---|---|---|
| 배경 | `#0a0a0a` | 전체 배경 |
| 카드 | `#111111` | 위젯 배경 |
| 테두리 | `#222222` | 카드 경계 |
| 상승 | `#26a69a` | 양수 수익, 과매도 RSI |
| 하락 | `#ef5350` | 음수 수익, 과매수 RSI |
| MA20 | `#f59e0b` | 이동평균 20일 |
| MA50 | `#818cf8` | 이동평균 50일 |
| BB | `rgba(96,165,250,0.7)` | 볼린저 밴드 |

---

## 라이선스

MIT License — 자유롭게 사용, 수정, 배포 가능합니다.
