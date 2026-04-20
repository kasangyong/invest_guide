# Financial Indicators Calculation Rules v1.0

## 전제 조건
- 무위험 수익률 (Rf): 연 3.5% (한국 기준금리 기준)
  - 일간 환산: 0.035 / 252
- 연환산 기준: 252 거래일
- 최소 데이터 요건: 샤프/소르티노 = 최소 20일, CAGR = 최소 365일

## 수익률 지표

### 총 수익률 (Total Return)
공식: (마지막_종가 - 첫번째_종가) / 첫번째_종가 × 100
단위: %
표시: +12.54% (양수에 반드시 + 기호)
색상 코딩: 양수=#26a69a / 음수=#ef5350 / 0=#90caf9

### 일간 수익률 배열 (Daily Returns)
공식: (종가[i] - 종가[i-1]) / 종가[i-1]
용도: 샤프비율, 소르티노비율, 변동성 계산의 기반

### CAGR (연환산 복리 수익률)
공식: (종료값 / 시작값)^(1 / 연수) - 1
연수 계산: (마지막날짜 - 첫번째날짜).days / 365.25
조건: 기간 < 1년 → null 반환 (표시: "N/A")

### 알파 (Alpha)
공식: 포트폴리오_일간수익률_평균 - (베타 × 벤치마크_일간수익률_평균)
벤치마크: KOSPI 또는 S&P500 (기본값: KOSPI)

## 위험 조정 지표

### 샤프 비율 (Sharpe Ratio)
공식:
  daily_excess = 일간수익률_배열 - Rf_일간
  sharpe = mean(daily_excess) / std(daily_excess) × √252
조건: 데이터 < 20일 → null
해석 등급:
  sharpe < 0    → "위험 대비 수익 부족" (색상: #ef5350)
  0 ≤ sharpe < 1 → "보통" (색상: #ffa726)
  1 ≤ sharpe < 2 → "양호" (색상: #26a69a)
  sharpe ≥ 2    → "우수" (색상: #4caf50)

### 소르티노 비율 (Sortino Ratio)
공식:
  downside_returns = 일간수익률_배열 중 Rf_일간 미만인 값
  downside_std = std(downside_returns) × √252
  sortino = (연환산_수익률 - 연_Rf) / downside_std
조건: 하방수익률이 0개일 경우 → null

### 최대 낙폭 (MDD, Maximum Drawdown)
공식:
  누적최고점 = cummax(종가_배열)
  낙폭 = (누적최고점 - 현재종가) / 누적최고점
  MDD = max(낙폭)
표시: -25.3% (항상 음수로 표현)
시각화: 낙폭 구간에 반투명 빨간 음영

### 변동성 (Annualized Volatility)
공식: std(일간수익률_배열) × √252 × 100
단위: %
표시: 18.5%

## 기술적 지표

### 이동평균 (Simple Moving Average)
공식: MA_N[i] = mean(종가[i-N+1 .. i])
조건: i < N-1 → null
지원 기간: 20일, 50일, 200일

### RSI (Relative Strength Index)
기간: 14일
공식:
  변화량[i] = 종가[i] - 종가[i-1]
  평균상승 = 14일간 상승분의 EMA (초기: 단순평균)
  평균하락 = 14일간 하락분의 EMA (초기: 단순평균)
  RS = 평균상승 / 평균하락
  RSI = 100 - (100 / (1 + RS))
조건: i < 14 → null
해석:
  RSI > 70 → 과매수 (배경: 반투명 빨간색)
  RSI < 30 → 과매도 (배경: 반투명 초록색)
  30 ≤ RSI ≤ 70 → 중립

### 볼린저 밴드 (Bollinger Bands)
기간: 20일, 표준편차 배수: 2
공식:
  중심선 = MA20
  표준편차 = std(종가[i-19..i])
  상단 = MA20 + 2 × 표준편차
  하단 = MA20 - 2 × 표준편차
조건: i < 19 → null

### MACD
빠른 EMA: 12일, 느린 EMA: 26일, 시그널: 9일
공식:
  MACD = EMA12 - EMA26
  Signal = EMA9(MACD)
  Histogram = MACD - Signal
조건: i < 25 → null
