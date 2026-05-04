# Data Schema Detection Rules

## 목적
업로드된 CSV/JSON 데이터의 컬럼을 분석하여 데이터 타입을 자동 분류한다.
이 규칙은 schemaDetector.ts의 동작 기준이 된다.

## 우선순위 감지 규칙 (높은 우선순위 먼저)

### STOCK_OHLCV (주가 OHLCV 데이터)
조건: 다음 컬럼 패턴이 모두 존재
- 날짜 컬럼: date | time | timestamp | 날짜 | 일자 | 거래일
- 가격 컬럼 (필수 4개): open + high + low + close (또는 한국어: 시가+고가+저가+종가)
- 거래량 (선택): volume | vol | 거래량

신뢰도:
- open+high+low+close+volume 모두 있을 때: 0.97
- open+high+low+close만 있을 때: 0.88

출력:
  dataType: "STOCK_OHLCV"
  primaryKey: date 컬럼명
  valueColumns: [open, high, low, close, volume]

### PORTFOLIO (포트폴리오 보유 현황)
조건 (중 하나 이상):
- ticker|symbol|종목코드 + weight|allocation|비중 존재
- asset|종목 + value|amount|평가액 존재

신뢰도: 0.92

출력:
  dataType: "PORTFOLIO"
  assetColumn: ticker/symbol/asset 컬럼명
  weightColumn: weight/allocation/비중 컬럼명

### RETURNS (수익률 시계열)
조건:
- date|날짜 컬럼 + return|returns|수익률|pnl|profit 컬럼 존재
- OHLCV 4개 컬럼은 없어야 함 (STOCK_OHLCV보다 낮은 우선순위)

신뢰도: 0.90

출력:
  dataType: "RETURNS"
  dateColumn: 날짜 컬럼명
  returnColumn: 수익률 컬럼명

### FINANCIAL_STATEMENT (재무제표)
조건:
- revenue|sales|매출|매출액|net_income|영업이익|eps 중 하나 이상

신뢰도: 0.85

출력:
  dataType: "FINANCIAL_STATEMENT"

### GENERIC (기본)
위 조건 중 해당 없음
신뢰도: 0.50
대시보드: 기본 통계 + 막대/선 차트

## 예외 처리 규칙
- 컬럼 수 < 2: ERROR "최소 2개 이상의 컬럼이 필요합니다"
- 숫자 데이터 비율 < 30%: WARNING "숫자 데이터 비율이 낮습니다"
- null 비율 > 50%: WARNING "[컬럼명] 컬럼의 결측치가 50%를 초과합니다"
- 행 수 < 10: WARNING "데이터가 부족합니다 (최소 10행 권장)"
- 행 수 > 100,000: INFO "대용량 데이터 — 자동 리샘플링 적용됩니다"
