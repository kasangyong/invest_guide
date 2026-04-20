# 투자 데이터 대시보드 해커톤 — 심층 리서치 문서

> 작성일: 2026-04-15  
> 목적: Skills.md 기반 투자 분석 대시보드 설계를 위한 최신 논문·기술 분석 및 전략적 인사이트 도출

---

## 목차

1. [해커톤 핵심 과제 분해](#1-해커톤-핵심-과제-분해)
2. [바이브 코딩(Vibe Coding) — 개념과 최신 동향](#2-바이브-코딩vibe-coding--개념과-최신-동향)
3. [컨텍스트 엔지니어링과 Skills.md 설계론](#3-컨텍스트-엔지니어링과-skillsmd-설계론)
4. [LLM 기반 자동 대시보드 생성 — 최신 논문 분석](#4-llm-기반-자동-대시보드-생성--최신-논문-분석)
5. [금융 AI 분석 기술 스택](#5-금융-ai-분석-기술-스택)
6. [투자 대시보드 설계 원칙 및 시각화 기준](#6-투자-대시보드-설계-원칙-및-시각화-기준)
7. [핵심 금융 지표(KPI) 체계](#7-핵심-금융-지표kpi-체계)
8. [RAG와 금융 데이터 분석](#8-rag와-금융-데이터-분석)
9. [감성 분석(Sentiment Analysis)과 시장 예측](#9-감성-분석sentiment-analysis과-시장-예측)
10. [경쟁 도구 벤치마크 분석](#10-경쟁-도구-벤치마크-분석)
11. [해커톤 전략 도출 — 평가항목별 공략법](#11-해커톤-전략-도출--평가항목별-공략법)
12. [참고 문헌](#12-참고-문헌)

---

## 1. 해커톤 핵심 과제 분해

이번 해커톤은 단순한 "대시보드 구현"이 아니라 세 개의 레이어가 유기적으로 맞물리는 시스템 설계 문제다.

```
[Layer 1] Skills.md — 분석 규칙/시각화 기준/인사이트 생성 규칙 정의
       ↓ (문서가 코드를 구동)
[Layer 2] 바이브 코딩 — LLM이 Skills.md를 읽고 대시보드 코드를 자동 생성
       ↓ (코드가 데이터를 시각화)
[Layer 3] 투자 대시보드 — 실사용 가능한 금융 분석 웹 서비스
```

핵심 인사이트: **Skills.md가 얼마나 잘 쓰여 있는가**가 전체 품질을 결정한다. 대시보드는 Skills.md의 "출력물"이며, 바이브 코딩은 그 변환 과정이다. 따라서 Skills.md 설계에 가장 많은 에너지를 투입해야 한다.

### 평가 가중치 재해석

| 평가항목 | 배점 | 실질적 의미 |
|---|---|---|
| 범용성 | 25 | 다양한 데이터 포맷(CSV, JSON, API)에 자동 적응 가능한가 |
| Skills.md 설계 | 25 | 규칙이 명확하고 AI가 이해하기 좋은 구조인가 |
| 대시보드 자동 생성 | 25 | 코드 자동 생성 후 실제로 동작하는 UI가 나오는가 |
| 바이브코딩 활용 | 15 | 수동 코딩 없이 LLM이 대부분을 생성했는가 |
| 실용성·창의성 | 10 | 실제 투자자가 쓸 만한가, 확장 가능한가 |

**결론**: Skills.md + 범용성 합산 50점 → 이 두 영역에서 압도해야 한다.

---

## 2. 바이브 코딩(Vibe Coding) — 개념과 최신 동향

### 2.1 정의와 철학

바이브 코딩은 2025년 Andrej Karpathy가 대중화한 개념으로, **개발자가 자연어 프롬프트로 LLM에 요구사항을 설명하면 LLM이 소스 코드를 자동 생성**하는 개발 방식이다. Karpathy의 2023년 명제 "가장 핫한 새 프로그래밍 언어는 영어"를 실천적으로 구현한 것이다.

**핵심 구별점**: Simon Willison(著名 개발자)의 정의에 따르면, "LLM이 모든 줄을 작성했더라도 개발자가 코드를 리뷰하고 테스트하고 이해했다면 바이브 코딩이 아니다 — 그건 LLM을 타이핑 보조도구로 쓴 것이다." 진정한 바이브 코딩은 결과 중심으로 동작하며 후속 프롬프트로 수정해 나가는 방식이다.

### 2.2 2025년 산업 현황

- **Y Combinator** 2025년 Winter 배치 스타트업의 **25%가 코드베이스의 95% 이상을 AI가 생성**
- 2025년 11월 Collins Dictionary 올해의 단어로 "vibe coding" 선정
- MIT Technology Review: "from vibe coding to **context engineering**"으로 패러다임 전환 진행 중

### 2.3 보안 및 품질 이슈 (알고 가야 할 것)

- Veracode (2025.10): LLM이 생성하는 코드의 기능적 품질은 3년간 극적으로 향상됐지만, **보안 품질은 개선되지 않음**
- CodeRabbit (2025.12): AI 공동 작성 PR은 인간 작성 코드보다 **"major" 이슈가 약 1.7배 많음**
- **해커톤 시사점**: Skills.md에 보안/입력 검증 규칙을 명시적으로 포함시키면 차별점이 될 수 있다

### 2.4 바이브 코딩 최적화 전략

컨텍스트 엔지니어링 관점에서 본 효과적인 바이브 코딩 프롬프트 구조:

```
Intent   → 무엇을 만들 것인지 (목적)
Context  → 어떤 데이터/환경인지 (배경)
Format   → 어떤 파일/구조로 출력할지 (형식)
Constraints → 제약사항 (기술 스택, 라이선스 등)
Examples → 입력-출력 예시 (최고 효과)
```

---

## 3. 컨텍스트 엔지니어링과 Skills.md 설계론

### 3.1 컨텍스트 엔지니어링이란

Anthropic 엔지니어링 팀 정의: "LLM 추론 시 최적의 토큰(정보) 집합을 선별·유지하는 전략들의 집합." 프롬프트 엔지니어링이 "올바른 단어 찾기"라면, 컨텍스트 엔지니어링은 "올바른 정보 구성 찾기"다.

**핵심 원칙**: *최소한의 고신호(high-signal) 토큰으로 원하는 결과의 확률을 최대화하라.*

### 3.2 Skills.md의 역할 — 컨텍스트 엔지니어링 관점

Skills.md는 본질적으로 **LLM에 대한 도메인 컨텍스트 주입 문서**다. 잘 설계된 Skills.md는:

1. **명시적 규칙** — "주가 데이터에는 캔들스틱 차트를 사용하라"처럼 조건-행동 쌍으로 작성
2. **예시 포함** — Few-shot 학습 효과: 입력-출력 예시를 넣으면 LLM 이해도가 크게 향상
3. **계층적 구조** — 전역 규칙 → 데이터 타입별 규칙 → 예외 처리 순으로 구성
4. **재사용 가능** — 데이터가 바뀌어도 동일한 Skills.md로 일관된 분석 가능

### 3.3 효과적인 Skills.md 구조 설계

Anthropic의 컨텍스트 엔지니어링 가이드라인에 따르면 시스템 프롬프트(=Skills.md)는 다음을 피해야 한다:
- 복잡하고 부서지기 쉬운 로직을 하드코딩
- 모호한 지시 ("좋은 차트를 만들어라" ❌ → "수익률 데이터가 있을 경우 선형 차트와 이동평균을 함께 표시하라" ✅)
- 과도하게 긴 문서 (신호 대 노이즈 비율이 낮아짐)

### 3.4 해커톤 Skills.md 설계 전략

복수 Skills.md 파일을 역할별로 분리하는 것이 효과적이다:

```
skills/
├── data-schema.md        # 데이터 구조 감지 및 전처리 규칙
├── visualization.md      # 차트 선택 기준 및 시각화 규칙
├── indicators.md         # 금융 지표 계산 공식 정의
├── insight-generation.md # 인사이트 생성 템플릿 및 규칙
└── dashboard-layout.md   # 대시보드 레이아웃 및 UI 규칙
```

---

## 4. LLM 기반 자동 대시보드 생성 — 최신 논문 분석

### 4.1 LLM4Dash (2025.08 — TechRxiv)

**논문**: "LLM4Dash: Interactive Dashboard for Automated Analysis Generation Using LLM"  
**게재**: TechRxiv, 2025년 8월 26일

**핵심 기여**: 자연어 쿼리와 데이터 입력만으로 완전한 분석 대시보드를 자동 생성하는 프레임워크. 데이터 프로파일링 → 통계 분석 → 인터랙티브 시각화의 전체 워크플로우를 자동화한다.

**성능 지표**:
- 시각화 적절성 정확도: **85%** (다양한 데이터셋 대상)
- 사용자 만족도: **92%** (24명 사용성 연구)
- 처리 용량: 10만 레코드 데이터셋, 평균 응답시간 **15초 미만**
- 기존 도구(LIDA, Chat2VIS) 대비 **멀티패널 대시보드 생성에서 우위**

**해커톤 시사점**: 단일 패널이 아닌 멀티패널 코디네이션이 핵심 차별화 포인트다.

### 4.2 Data-to-Dashboard (2025.05 — arXiv:2505.23695)

**논문**: "Data-to-Dashboard: Multi-Agent LLM Framework for Insightful Visualization in Enterprise Analytics"  
**저자**: Ran Zhang, Mohannad Elhamod (Boston University)  
**게재**: arXiv, 2025년 5월 29일

**핵심 아키텍처**: 단계적 에이전트 파이프라인
```
Stage 1: Data-to-Insight
  → Domain Detection Agent (도메인 감지)
  → Concept Extraction Agent (핵심 개념 추출)
  → Multi-Perspective Analysis Agent (다각도 분석)
  → Self-Reflection Agent (자기 검토 및 개선)

Stage 2: Insight-to-Chart
  → Chart Type Selection Agent (차트 유형 결정)
  → Code Generation Agent (시각화 코드 생성)
  → Layout Composition Agent (레이아웃 구성)
```

**핵심 차별점**: 기존 Chart QA 시스템과 달리, **비즈니스 애널리스트의 추론 과정을 시뮬레이션**. 사전 정의된 온톨로지나 질문 템플릿 없이 다양한 데이터셋에 적응한다.

**해커톤 시사점**: Skills.md를 "Domain Detection"과 "Multi-Perspective Analysis" 규칙으로 구성하면 이 논문의 접근법을 실용적으로 구현할 수 있다.

### 4.3 LLM-RAG 기반 금융 분석 시스템 (2025.03 — Preprints.org)

**논문**: "Intelligent Financial Data Analysis System Based on LLM-RAG"

**핵심 기술**: 금융 데이터 전처리 → 벡터 기반 저장/검색 → RAG 강화 쿼리 처리

**성과**: 기준 시스템 대비 **정확도 23% 향상, 규정 준수 18% 향상** (복잡한 해석 쿼리에서 특히 두드러짐)

---

## 5. 금융 AI 분석 기술 스택

### 5.1 LLM의 금융 시장 적용 분야 (최신 연구 종합)

84개 논문(2022~2025.초) 메타 분석에 따른 LLM 금융 적용 분류:

**응용 영역**:
- 주가 예측 (Stock Price Forecasting)
- 감성 분석 (Sentiment Analysis)
- 포트폴리오 관리 (Portfolio Management)
- 알고리즘 트레이딩 (Algorithmic Trading)
- 이상 탐지 (Anomaly Detection)

**기술 방법론**:
- 프롬프팅 (Prompting)
- 파인튜닝 (Fine-tuning)
- 멀티에이전트 프레임워크
- 강화학습 (Reinforcement Learning)
- 커스텀 아키텍처

### 5.2 주요 오픈소스 금융 AI 모델

| 모델 | 특징 | 활용 가능성 |
|---|---|---|
| **FinBERT** | 금융 텍스트 감성 분석 특화 BERT | 뉴스/공시 감성 분류 |
| **FinGPT** | 금융 도메인 파인튜닝 LLM | 시장 감성 분석, 주가 방향 예측 |
| **MarketSenseAI** | RAG + 다양한 금융 데이터셋 통합 | 포트폴리오 최적화 |

**FinGPT 성과** (arXiv:2412.10823): 뉴스 보급 패턴과 컨텍스트를 고려한 감성 기반 주가 예측에서 베이스라인 대비 유의미한 개선.

### 5.3 멀티에이전트 금융 시스템

Park(2024)의 LLM 기반 멀티에이전트 이상 탐지 프레임워크: 금융 시장의 이상 탐지를 자동화하여 수동 경보 검증 부담 경감. 에이전트들이 협력하여 탐지 → 검증 → 설명 생성의 파이프라인을 구성한다.

**MARAG-Fin (2025)**: Agentic RAG를 활용한 투자 의사결정 프레임워크
- S&P 500 전략: **19.85% 수익률, 28.32% CAGR** (백테스트)
- NASDAQ-100 전략: **57.19% 수익률** (고변동성 조건)

---

## 6. 투자 대시보드 설계 원칙 및 시각화 기준

### 6.1 핵심 설계 원칙 (2025년 UX 연구 종합)

**1. 정보 계층화 (Information Hierarchy)**
- 가장 중요한 인사이트를 최상단에 배치
- 상세 데이터는 스크롤 또는 드릴다운으로 접근
- "단일 핵심 메시지" 원칙: 차트 하나당 하나의 인사이트

**2. 단순성 (Simplicity)**
- 불필요한 레이블, 격자선, 장식 제거
- 설명이 필요한 차트는 너무 복잡한 것 → 단순화 필요
- 데이터 잉크 비율 극대화 (Tufte 원칙)

**3. 일관성 (Consistency)**
- 색상 시스템: 수익/성장=녹색, 손실/위험=빨간색, 중립=파란색 (전역 고정)
- 명명 규칙, 수치 포맷, 날짜 형식 통일
- 동일 데이터 유형에는 동일 차트 유형 사용

**4. 실시간 성능 (Real-time Performance)**
- 로딩 지연은 의사결정을 늦추고 사용자를 이탈시킴
- 대규모 데이터에는 집계/샘플링 전략 적용
- 점진적 로딩(Progressive Loading) 구현

**5. 인터랙티비티 (Interactivity)**
- 줌, 필터, 드릴다운으로 탐색적 분석 지원
- 툴팁으로 세부 수치 표시
- 기간 선택기로 시간 범위 조절

### 6.2 데이터 유형별 차트 선택 기준

| 데이터 유형 | 분석 목적 | 권장 차트 | 비권장 차트 |
|---|---|---|---|
| 주가 시계열 | 가격 추세 파악 | 캔들스틱 + 이동평균 | 파이 차트 |
| 포트폴리오 구성 | 자산 배분 비중 | 트리맵, 도넛 차트 | 3D 파이 |
| 수익률 비교 | 종목/지수 간 비교 | 바 차트, 레이더 차트 | 선 차트 |
| 변동성/리스크 | 리스크 분포 | 박스플롯, 히스토그램 | 선 차트 |
| 상관관계 | 종목 간 관계 | 히트맵, 산점도 | 바 차트 |
| 거래량 | 거래 활동 | 바 차트 (하단 오버레이) | 파이 차트 |
| 재무지표 | KPI 달성률 | 불릿 차트, 게이지 | 선 차트 |
| 섹터 분석 | 섹터별 노출도 | 히트맵, 트리맵 | 단순 바 |

### 6.3 대시보드 레이아웃 패턴

**F-Pattern 레이아웃** (금융 대시보드에 최적):
```
┌─────────────────────────────────────────┐
│  [헤더 KPI 요약 — 최고 중요 지표 3-5개]  │
├──────────────┬──────────────────────────┤
│              │                          │
│  [주요 차트] │   [보조 차트/분석]        │
│  (60% 폭)   │   (40% 폭)               │
│              │                          │
├──────────────┴──────────────────────────┤
│  [테이블/상세 데이터]                    │
└─────────────────────────────────────────┘
```

---

## 7. 핵심 금융 지표(KPI) 체계

### 7.1 수익률 지표

| 지표 | 계산식 | 의미 | 시각화 |
|---|---|---|---|
| **총 수익률** | (현재가 - 매입가) / 매입가 × 100 | 절대 수익 | 숫자 카드 |
| **연환산 수익률(CAGR)** | (종료값/시작값)^(1/연수) - 1 | 연간 복리 성장률 | 숫자 카드 |
| **알파(α)** | 포트폴리오 수익 - (β × 벤치마크 수익) | 초과 수익 | 숫자 카드 |
| **벤치마크 대비 수익** | 포트폴리오 수익 - 지수 수익 | 상대 성과 | 선 차트 비교 |

### 7.2 위험 조정 지표

| 지표 | 계산식 | 의미 | 좋은 값 |
|---|---|---|---|
| **샤프 비율(Sharpe)** | (Rp - Rf) / σp | 단위 리스크당 초과 수익 | > 1.0 양호, > 2.0 우수 |
| **소르티노 비율(Sortino)** | (Rp - Rf) / σ_downside | 하방 리스크 기준 | Sharpe보다 보수적 평가 |
| **정보 비율(IR)** | (Rp - Rb) / TE | 벤치마크 대비 효율 | > 0.5 양호 |
| **최대 낙폭(MDD)** | max(peak - trough) / peak | 최대 손실 구간 | 낮을수록 좋음 |

### 7.3 위험 지표

| 지표 | 설명 | 시각화 |
|---|---|---|
| **베타(β)** | 시장 민감도 (1 = 시장과 동일 변동) | 숫자 + 색상 코딩 |
| **변동성(σ)** | 수익률 표준편차 (연환산) | 히스토그램 |
| **VaR(95%)** | 95% 확률로 하루 최대 손실 금액 | 바 차트 |
| **CVaR** | VaR 초과 시 기대 손실 | 숫자 카드 |

### 7.4 기술적 지표 (Technical Indicators)

| 지표 | 유형 | 활용 |
|---|---|---|
| **이동평균(MA 20/50/200)** | 추세 | 추세 방향 판단 |
| **RSI(14)** | 모멘텀 | 과매수(>70)/과매도(<30) |
| **MACD** | 모멘텀 | 매매 신호 |
| **볼린저 밴드** | 변동성 | 가격 채널 판단 |
| **거래량 이동평균** | 거래 | 거래 활동 수준 |

### 7.5 포트폴리오 분석 지표

| 지표 | 설명 |
|---|---|
| **자산 배분** | 주식/채권/현금/대안투자 비중 |
| **섹터 노출도** | 11개 GICS 섹터별 비중 |
| **지역 분산** | 국내/해외/신흥국 비중 |
| **상관관계 행렬** | 종목 간 상관계수 히트맵 |
| **효율적 프런티어** | 위험-수익 최적 포트폴리오 곡선 |

---

## 8. RAG와 금융 데이터 분석

### 8.1 시장 현황

- RAG 글로벌 시장: 2024년 **12억 달러** → 2030년 **110억 달러** (CAGR 49.1%)
- 북미 2024년 시장 점유율: **36.4%**

### 8.2 금융 RAG의 작동 원리

```
[금융 데이터 소스]
├── 실시간 주가 데이터 (API)
├── 재무제표 (SEC/DART 공시)
├── 뉴스/리포트 (텍스트)
└── 거시경제 지표

        ↓ 전처리 + 청킹

[벡터 데이터베이스]
  임베딩 저장 (financial-specific embedding)

        ↓ 쿼리 시 검색

[LLM + 검색된 컨텍스트]
  → 정확하고 최신 인사이트 생성
```

### 8.3 금융 RAG의 장점

- 환각(hallucination) 감소: 실제 데이터에 기반한 답변
- 최신성: 학습 데이터 컷오프 이후 데이터도 활용 가능
- 투명성: 인사이트의 근거 데이터 추적 가능
- 정확도 23% 향상, 규정 준수 18% 향상 (실험 결과)

### 8.4 해커톤 적용 방안

Skills.md의 인사이트 생성 규칙에 RAG 개념을 적용:
- 데이터에서 주요 통계를 먼저 추출 (Retrieval)
- 통계를 기반으로 텍스트 인사이트 생성 (Generation)
- 인사이트는 항상 데이터 근거를 함께 표시

---

## 9. 감성 분석(Sentiment Analysis)과 시장 예측

### 9.1 최신 연구 결과

**Emerald Publishing (2025)**: 트랜스포머 모델과 소셜 미디어 신호를 결합한 주가 예측
- 소셜 미디어 감성이 기술·금융 섹터 단기 주가 변동의 그랜저 인과관계 확인
- 하이브리드 모델: **방향 예측 정확도 68.5%, ARIMA 대비 오류 22% 감소**

**FinGPT (arXiv:2412.10823)**: 뉴스 보급 패턴(dissemination-aware) + 컨텍스트 풍부화
- 단순 감성 분류를 넘어 뉴스가 "언제, 어디서, 얼마나 퍼지는지"까지 고려

**FinBERT + GPT-4 하이브리드**: 금융 특화 BERT로 감성 분류 → GPT-4로 설명 생성
- 로지스틱 회귀 베이스라인 대비 유의미한 성능 개선

### 9.2 대시보드 통합 전략

감성 점수를 시각화 레이어에 통합:
```
[뉴스 피드] → [FinBERT 감성 분류] → [감성 게이지/히트맵]
                                    → [주가 차트 오버레이]
                                    → [텍스트 인사이트]
```

---

## 10. 경쟁 도구 벤치마크 분석

### 10.1 주요 금융 대시보드 플랫폼

| 플랫폼 | 강점 | 약점 | 해커톤 학습 포인트 |
|---|---|---|---|
| **Koyfin** | 포괄적 금융 데이터, 깔끔한 UI | 커스터마이징 제한 | 레이아웃 참고 |
| **Portfolio Visualizer** | 백테스팅, 몬테카를로 시뮬레이션 | 실시간 데이터 없음 | 분석 깊이 참고 |
| **Tableau Finance** | 강력한 시각화, 템플릿 | 고가, 복잡 | 차트 다양성 참고 |
| **Power BI** | MS 에코시스템 통합 | 금융 특화 부족 | 대시보드 구조 참고 |
| **Zoho Analytics** | Gartner MQ 2025 선정 | 금융 도메인 특화 부족 | UX 패턴 참고 |

### 10.2 LLM 대시보드 도구 비교

| 도구 | 특징 | 한계 |
|---|---|---|
| **LIDA** (Microsoft) | 자연어 → 시각화 | 단일 차트, 멀티패널 약함 |
| **Chat2VIS** | 자연어 → 코드 → 차트 | 금융 도메인 특화 없음 |
| **LLM4Dash** | 멀티패널, 85% 정확도 | 연구 단계 |
| **Data-to-Dashboard** | 멀티에이전트, 자기반성 | 엔터프라이즈 대상 |

**차별화 기회**: 기존 도구들은 금융 도메인 특화 규칙(샤프 비율 해석, 기술적 분석 규칙 등)이 없다. Skills.md로 이를 채우는 것이 핵심 차별점이다.

---

## 11. 해커톤 전략 도출 — 평가항목별 공략법

### 11.1 범용성 (25점) — 전략

**목표**: 어떤 투자 데이터가 들어와도 자동으로 분석하는 시스템

**구현 방법**:
1. **자동 스키마 감지**: 업로드된 CSV/JSON에서 컬럼명을 분석해 데이터 유형 자동 분류
   - `date`, `time`, `timestamp` 포함 → 시계열 데이터
   - `price`, `close`, `open`, `high`, `low` 포함 → 주가 데이터
   - `portfolio`, `weight`, `allocation` 포함 → 포트폴리오 데이터
2. **데이터 유형 분기**: 감지된 유형에 따라 다른 분석 플로우 실행
3. **더미 데이터 자동 생성**: 데이터 없이도 동작하는 데모 모드

### 11.2 Skills.md 설계 (25점) — 전략

**목표**: AI가 읽고 즉시 실행 가능한, 명확하고 구조적인 분석 규칙 문서

**고점 요소**:
- 조건-행동(if-then) 형식의 명확한 규칙
- 실제 계산식 포함 (샤프 비율 = (Rp-Rf)/σ)
- 예시 데이터와 예시 출력 포함 (few-shot)
- 인사이트 생성 템플릿 ("수익률이 X%일 때 → Y라고 표현")
- 예외 처리 규칙 (데이터 없음, 계산 불가 상황)

### 11.3 대시보드 자동 생성 (25점) — 전략

**목표**: Skills.md만 있으면 LLM이 대시보드 코드를 자동 생성하는 구조

**핵심 구현**:
- Skills.md를 LLM 시스템 프롬프트로 주입
- 데이터 스키마를 LLM에 전달
- LLM이 React/D3.js/Chart.js 코드를 자동 생성
- 생성된 코드를 동적으로 렌더링

### 11.4 바이브코딩 활용 (15점) — 전략

**목표**: 코드의 대부분을 LLM이 생성했음을 증명

**증명 방법**:
- README에 프롬프트 로그/스크린샷 포함
- 생성 과정 GIF/영상 제작
- "이 프로젝트의 X%는 LLM이 생성했다" 명시

### 11.5 실용성·창의성 (10점) — 전략

**차별화 아이디어**:
- 자연어 쿼리: "이 포트폴리오의 샤프 비율은?" → 자동 계산 + 설명
- 포트폴리오 비교 기능
- 리스크 시나리오 시뮬레이션
- PDF 리포트 자동 생성
- 한국어 인사이트 자동 생성

---

## 12. 참고 문헌

### 논문

1. **LLM4Dash** — "Interactive Dashboard for Automated Analysis Generation Using LLM", TechRxiv, 2025.08  
   https://www.techrxiv.org/doi/full/10.36227/techrxiv.175616710.06941982/v1

2. **Data-to-Dashboard** — "Multi-Agent LLM Framework for Insightful Visualization in Enterprise Analytics", arXiv:2505.23695, 2025.05  
   https://arxiv.org/abs/2505.23695

3. **LLM-RAG 금융 분석** — "Intelligent Financial Data Analysis System Based on LLM-RAG", Preprints.org, 2025.03  
   https://www.preprints.org/manuscript/202503.1532

4. **LLM in Equity Markets** — "Large Language Models in equity markets: applications, techniques, and insights", Frontiers in AI, 2025  
   https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2025.1608365/full

5. **Financial Statement Analysis with LLMs** — arXiv:2407.17866, 2024  
   https://arxiv.org/abs/2407.17866

6. **FinGPT** — "Enhancing Sentiment-Based Stock Movement Prediction", arXiv:2412.10823, 2024  
   https://arxiv.org/html/2412.10823v2

7. **MARAG-Fin** — Agentic RAG for Investment Decision-Making, AETiC, 2025  
   https://arxiv.org/pdf/2510.27537

### 기술 문서 및 아티클

8. **Anthropic Context Engineering** — "Effective context engineering for AI agents"  
   https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

9. **Vibe Coding Wikipedia** — 개념 정의 및 역사  
   https://en.wikipedia.org/wiki/Vibe_coding

10. **Financial Data Visualization Techniques 2025** — Chartswatcher  
    https://chartswatcher.com/pages/blog/top-financial-data-visualization-techniques-for-2025

11. **9 Principles of Data Visualization in Finance 2025** — Julius AI  
    https://julius.ai/articles/data-visualization-finance-industry

12. **Dashboard Design Principles 2025** — UXPin  
    https://www.uxpin.com/studio/blog/dashboard-design-principles/

13. **RAG for Financial Services** — HatchWorks AI  
    https://hatchworks.com/blog/gen-ai/rag-for-financial-services/

14. **RAG Market Report 2030** — Grand View Research  
    https://www.grandviewresearch.com/industry-analysis/retrieval-augmented-generation-rag-market-report

15. **AI in Financial Market Prediction** — Frontiers in AI, 2025  
    https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2025.1696423/full

---

*이 문서는 해커톤 준비를 위한 내부 리서치 자료이며, Skills.md 설계 및 대시보드 구현 과정에서 지속적으로 업데이트될 예정입니다.*
