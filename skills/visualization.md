# Visualization Selection Rules v1.0

## 핵심 원칙
1. 단일 차트 = 단일 인사이트 (하나의 차트가 하나의 메시지만 전달)
2. 금융 표준 색상 시스템 (전역 고정, 절대 변경 금지):
   - 상승/수익: #26a69a (teal-green)
   - 하락/손실: #ef5350 (red)
   - 중립/보조: #90caf9 (light-blue)
   - 경고: #ffa726 (orange)
3. 모든 차트는 인터랙티브 (툴팁, 호버 하이라이트) 지원
4. 다크 테마 전용: 배경 #0f1117, 카드 #1a1d27

## 데이터 타입별 차트 선택 기준

### STOCK_OHLCV → CandlestickChart
PRIMARY 차트:
  - 라이브러리: lightweight-charts
  - x축: 날짜 (YYYY-MM-DD)
  - 바디: open/high/low/close (상승=#26a69a, 하락=#ef5350)
  - 오버레이 1: MA20 (파란선 #2196f3, lineWidth=1)
  - 오버레이 2: MA50 (주황선 #ff9800, lineWidth=1)
  - 오버레이 3: 볼린저 밴드 (점선, 반투명)
  - 하단 서브패널: 거래량 (바 차트, 상승/하락 색상 매칭)

SECONDARY 차트:
  - RSI(14) 라인 차트 — 70선/30선에 점선 표시
  - 누적 수익률 라인 차트

### PORTFOLIO → TreemapChart + DonutChart
PRIMARY 차트 (트리맵):
  - 라이브러리: recharts Treemap
  - 크기: weight/allocation 값
  - 색상: 수익률 기준 (수익>#26a69a, 손실>#ef5350)
  - 레이블: 종목명 + 비중%

SECONDARY 차트 (도넛):
  - 라이브러리: recharts PieChart
  - 섹터별 배분 또는 자산군 배분

TERTIARY 차트 (막대):
  - 종목별 수익률 비교 BarChart (수평 방향)

### RETURNS → ReturnsLineChart
PRIMARY 차트:
  - 누적 수익률 곡선 (라인 차트)
  - 기준선 (0% 수익률) 점선
  - 낙폭 구간 음영 (빨간색 반투명)
  - 벤치마크가 있을 경우: 비교선 (회색 점선)

SECONDARY 차트:
  - 월별/분기별 수익률 막대 차트 (상승/하락 색상)

### GENERIC → AutoChart
조건에 따라 자동 선택:
  - 숫자 컬럼 1개 + 날짜 컬럼: 라인 차트
  - 숫자 컬럼 여러 개: 바 차트
  - 카테고리 컬럼 + 숫자 1개: 수평 바 차트

## 공통 시각화 규칙

### 데이터 밀도 처리
- 데이터 포인트 > 1,000: 일간→주간 자동 리샘플링
- 데이터 포인트 > 5,000: 일간→월간 자동 리샘플링
- 리샘플링 시 사용자에게 안내 메시지 표시

### 반응형 규칙
- 모바일 (<768px): 차트 1열, 높이 250px
- 태블릿 (768~1024px): 차트 2열, 높이 300px
- 데스크탑 (≥1024px): 차트 2~3열, 높이 380px

### 축 포맷
- 가격: 원화=₩#,### / 달러=$#.## 
- 수익률: +12.5% (양수에 + 명시)
- 거래량: 1K/1M/1B 약어 사용
- 날짜: YYYY.MM.DD (한국 형식)
