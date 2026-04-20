"""
InvestDash 기획서 PDF 생성 스크립트
--------------------------------------
실행 방법 (Windows 터미널):
  pip install reportlab
  python generate_pdf.py

결과: InvestDash_기획서.pdf 가 현재 폴더에 생성됩니다.
"""

import os, sys

# ── 폰트 경로 (Windows 우선, macOS 대체) ───────────────────────────────────
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\malgun.ttf",          # Windows Malgun Gothic Regular
    r"C:\Windows\Fonts\malgunbd.ttf",        # Windows Malgun Gothic Bold
    "/System/Library/Fonts/AppleGothic.ttf", # macOS
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",  # Linux (installed)
]

font_regular = next((p for p in FONT_CANDIDATES[::2] if os.path.exists(p)), None)
font_bold    = next((p for p in FONT_CANDIDATES[1::2] if os.path.exists(p)), None) or font_regular

if not font_regular:
    print("ERROR: 한글 폰트를 찾을 수 없습니다.")
    print("C:\\Windows\\Fonts\\malgun.ttf 가 있는지 확인하세요.")
    sys.exit(1)

print(f"폰트 로드: {font_regular}")

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont('KR',   font_regular))
pdfmetrics.registerFont(TTFont('KR-B', font_bold))

W, H = A4
ML, MR, MT, MB = 22*mm, 22*mm, 24*mm, 22*mm

BLACK   = colors.HexColor('#0a0a0a')
DARK    = colors.HexColor('#1a1a1a')
MID     = colors.HexColor('#555555')
LIGHT   = colors.HexColor('#999999')
RULE    = colors.HexColor('#cccccc')
BG_CELL = colors.HexColor('#f5f5f5')
WHITE   = colors.white

def S(name, **kw):
    defaults = dict(fontName='KR', textColor=BLACK, spaceAfter=0, spaceBefore=0)
    defaults.update(kw)
    defaults.setdefault('leading', defaults.get('fontSize', 10) * 1.6)
    return ParagraphStyle(name, **defaults)

sTitle    = S('Title',   fontSize=26, leading=34, spaceAfter=2*mm)
sSubtitle = S('Sub',     fontSize=11, textColor=MID)
sCoverMeta= S('CMeta',   fontSize=9,  textColor=LIGHT, leading=14)
sH1       = S('H1',      fontSize=15, leading=21, fontName='KR-B', spaceBefore=6*mm, spaceAfter=2*mm)
sH2       = S('H2',      fontSize=11, leading=17, fontName='KR-B', spaceBefore=4*mm, spaceAfter=1.5*mm)
sH3       = S('H3',      fontSize=9.5,leading=15, fontName='KR-B', spaceBefore=3*mm, spaceAfter=1*mm)
sBody     = S('Body',    fontSize=9,  leading=16, spaceAfter=1.5*mm)
sBodySm   = S('BodySm',  fontSize=8.5,leading=14, textColor=MID,  spaceAfter=1*mm)
sCaption  = S('Caption', fontSize=7.5,leading=12, textColor=LIGHT)
sBullet   = S('Bullet',  fontSize=9,  leading=15, leftIndent=10,  spaceAfter=1*mm)
sHdr      = S('Hdr',     fontSize=8,  leading=12, fontName='KR-B', textColor=WHITE)
sCell     = S('Cell',    fontSize=8,  leading=13)

def HR(t=0.4, c=RULE): return HRFlowable(width='100%', thickness=t, color=c, spaceAfter=3*mm, spaceBefore=1*mm)
def SP(h=3):            return Spacer(1, h*mm)
def P(txt, st=sBody):   return Paragraph(txt, st)
def B(txt):             return Paragraph('- ' + txt, sBullet)

def tbl(data, cw, hdr=True):
    t = Table(data, colWidths=cw)
    cmds = [
        ('FONTNAME',        (0,0),(-1,-1),'KR'),
        ('FONTSIZE',        (0,0),(-1,-1), 8),
        ('LEADING',         (0,0),(-1,-1), 13),
        ('TOPPADDING',      (0,0),(-1,-1), 4),
        ('BOTTOMPADDING',   (0,0),(-1,-1), 4),
        ('LEFTPADDING',     (0,0),(-1,-1), 6),
        ('RIGHTPADDING',    (0,0),(-1,-1), 6),
        ('GRID',            (0,0),(-1,-1), 0.4, RULE),
        ('ROWBACKGROUNDS',  (0,1),(-1,-1),[WHITE, BG_CELL]),
        ('VALIGN',          (0,0),(-1,-1),'MIDDLE'),
        ('TEXTCOLOR',       (0,0),(-1,-1), DARK),
    ]
    if hdr:
        cmds += [
            ('BACKGROUND',  (0,0),(-1,0), DARK),
            ('TEXTCOLOR',   (0,0),(-1,0), WHITE),
            ('FONTNAME',    (0,0),(-1,0),'KR-B'),
        ]
    t.setStyle(TableStyle(cmds))
    return t

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('KR', 7.5)
    canvas.setFillColor(LIGHT)
    if doc.page > 1:
        canvas.drawCentredString(W/2, MB*0.6, str(doc.page))
        canvas.drawString(ML, MB*0.6, 'InvestDash — 프로젝트 기획서')
        canvas.drawRightString(W-MR, MB*0.6, '2025')
    canvas.restoreState()

story = []

# ══ 표지 ══════════════════════════════════════════════════════════════════════
story += [
    SP(30),
    HRFlowable(width='100%', thickness=2, color=BLACK, spaceAfter=8*mm),
    P('InvestDash', sTitle),
    P('투자 데이터 분석 대시보드 프로젝트 기획서', sSubtitle),
    SP(4),
    HR(0.4),
    SP(3),
    P('버전    1.0', sCoverMeta),
    P('작성일  2025년', sCoverMeta),
    P('분류    웹 프론트엔드 / 금융 데이터 시각화', sCoverMeta),
    SP(50),
    HR(0.4),
    P('본 문서는 InvestDash 프로젝트의 기획, 설계, 기술 명세를 포함하는 공식 기획서입니다.', sCaption),
    PageBreak(),
]

# ══ 목차 ══════════════════════════════════════════════════════════════════════
story += [P('목차', sH1), HR()]
toc = [
    ['번호', '항목', '페이지'],
    ['1','프로젝트 개요','3'],
    ['2','기획 배경 및 목적','3'],
    ['3','타겟 사용자 및 사용자 시나리오','4'],
    ['4','핵심 기능 명세','4'],
    ['5','데이터 처리 아키텍처','6'],
    ['6','금융 지표 계산 명세','7'],
    ['7','AI 인사이트 시스템','9'],
    ['8','UI/UX 설계 원칙','10'],
    ['9','기술 스택','11'],
    ['10','프로젝트 파일 구조','12'],
    ['11','Skills.md 아키텍처','13'],
    ['12','CSV 데이터 형식 명세','13'],
    ['13','향후 개발 계획','14'],
]
t = Table(toc, colWidths=[12*mm, 125*mm, 20*mm])
t.setStyle(TableStyle([
    ('FONTNAME',      (0,0),(-1,-1),'KR'),
    ('FONTNAME',      (0,0),(-1,0), 'KR-B'),
    ('FONTSIZE',      (0,0),(-1,-1), 8.5),
    ('LEADING',       (0,0),(-1,-1), 14),
    ('TOPPADDING',    (0,0),(-1,-1), 4),
    ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ('LEFTPADDING',   (0,0),(-1,-1), 4),
    ('RIGHTPADDING',  (0,0),(-1,-1), 4),
    ('ALIGN',         (2,0),(-1,-1),'CENTER'),
    ('LINEBELOW',     (0,0),(-1,0), 0.6, DARK),
    ('LINEBELOW',     (0,1),(-1,-1),0.3, RULE),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[WHITE, BG_CELL]),
    ('TEXTCOLOR',     (0,1),(-1,-1), DARK),
]))
story += [t, PageBreak()]

# ══ 1. 프로젝트 개요 ══════════════════════════════════════════════════════════
story += [
    P('1. 프로젝트 개요', sH1), HR(),
    P('InvestDash는 주가 OHLCV, 포트폴리오, 수익률 시계열 등 금융 데이터가 담긴 CSV 파일을 업로드하면 '
      '데이터 타입을 자동으로 감지하고, 해당 데이터에 최적화된 차트와 KPI 지표, AI 기반 투자 인사이트를 '
      '즉시 생성해주는 웹 기반 금융 분석 대시보드입니다.'),
    P('별도의 서버 설치, 데이터베이스 연결, 회원가입이 불필요하며 모든 데이터 처리는 사용자의 브라우저 '
      '안에서 완결됩니다. CSV 파일 하나로 전문적인 퀀트 수준의 분석 결과를 확인할 수 있다는 점이 '
      '이 프로젝트의 핵심 가치입니다.'),
    SP(2),
    tbl([
        ['항목','내용'],
        ['프로젝트명','InvestDash'],
        ['분류','금융 데이터 시각화 / 투자 분석 웹 도구'],
        ['플랫폼','웹 브라우저 (SPA, 서버리스)'],
        ['주요 기술','React 19, TypeScript 6, Vite 8, Tailwind CSS v4'],
        ['차트 라이브러리','lightweight-charts v5 (캔들스틱), recharts v3 (기타)'],
        ['AI 연동','Claude API (Anthropic Sonnet 4.6) — 선택적 사용'],
        ['데이터 처리','완전 클라이언트 사이드 (서버 불필요)'],
        ['배포 방식','정적 호스팅 (Vercel, Netlify, GitHub Pages)'],
    ], [50*mm, 110*mm]),
    SP(2),
]

# ══ 2. 기획 배경 및 목적 ══════════════════════════════════════════════════════
story += [
    P('2. 기획 배경 및 목적', sH1), HR(),
    P('2.1 배경', sH2),
    P('개인 투자자와 금융 데이터 분석을 학습하는 학생들이 직면하는 공통적인 어려움은 '
      '데이터를 확보하더라도 이를 시각화하고 지표로 해석하는 과정이 기술적으로 복잡하다는 점입니다. '
      'Python, R 같은 언어를 사용하지 않으면 RSI, 샤프 비율, 최대 낙폭 같은 지표를 계산하기 어렵고, '
      '전문 트레이딩 플랫폼은 학습 목적의 사용자에게 진입 장벽이 높습니다.'),
    P('또한 기존 분석 도구들은 특정 증권사 API나 유료 데이터 피드에 의존하는 경우가 많아 '
      '자체 보유 CSV 데이터를 빠르게 분석하고 싶은 사용자에게는 적합하지 않습니다.'),
    SP(1),
    P('2.2 목적', sH2),
    B('진입 장벽 제거: 코딩 지식 없이 CSV 업로드만으로 전문 금융 분석 결과 제공'),
    B('즉시성: 파일 업로드 후 3초 이내에 차트, KPI, 인사이트를 모두 렌더링'),
    B('정확성: 퀀트 분야 표준 공식(Wilder RSI, 연환산 샤프 비율 등)을 코드로 구현'),
    B('확장성: Skills.md 기반 아키텍처로 규칙 파일만 수정해도 시스템 동작 변경 가능'),
    B('AI 해석: 계산된 수치를 한국어 자연어 인사이트로 변환하여 의사결정 지원'),
    SP(2),
]

# ══ 3. 타겟 사용자 ════════════════════════════════════════════════════════════
story += [
    P('3. 타겟 사용자 및 사용자 시나리오', sH1), HR(),
    P('3.1 타겟 사용자', sH2),
    tbl([
        ['사용자 유형','특징','주요 니즈'],
        ['개인 투자자','CSV로 거래 내역 보유, 비기술직','차트·지표 자동 생성, 한국어 해석'],
        ['금융 학습자','대학생·취업 준비생','샤프 비율·MDD 등 지표 계산 실습'],
        ['퀀트 입문자','Python 초급, 데이터 보유','빠른 프로토타이핑, 지표 검증'],
        ['소형 운용사 실무자','엑셀 CSV 작업 익숙','포트폴리오 집중도·리스크 분석'],
    ], [42*mm, 55*mm, 63*mm]),
    SP(3),
    P('3.2 핵심 사용자 시나리오', sH2),
    P('시나리오 A — 주가 분석', sH3),
    P('사용자가 증권사 HTS에서 2년치 일봉 데이터를 CSV로 내려받아 InvestDash에 업로드합니다. '
      '시스템은 date, open, high, low, close, volume 컬럼을 감지해 STOCK_OHLCV로 분류하고, '
      '캔들스틱 차트에 MA20·MA50·볼린저 밴드를 즉시 오버레이합니다. '
      'KPI 바에는 전체 수익률, CAGR, 샤프 비율, RSI가 표시되며, '
      'AI 인사이트 패널에는 골든크로스 여부와 변동성 등급이 한국어로 해석되어 나타납니다.'),
    SP(1),
    P('시나리오 B — 포트폴리오 점검', sH3),
    P('10개 종목으로 구성된 포트폴리오를 ticker, weight, returnRate, sector 컬럼으로 정리한 CSV를 '
      '업로드합니다. 비중 트리맵과 수익률 바 차트가 렌더링되고, 최대 단일 종목 비중과 가중 수익률이 '
      '계산됩니다. 인사이트 패널은 집중도 위험을 경고하고, 최저 성과 종목 재검토를 제안합니다.'),
    PageBreak(),
]

# ══ 4. 핵심 기능 명세 ═════════════════════════════════════════════════════════
story += [
    P('4. 핵심 기능 명세', sH1), HR(),
    P('4.1 스키마 자동 감지', sH2),
    P('CSV 업로드 즉시 헤더 컬럼명을 패턴 매칭하여 데이터 타입을 분류합니다. '
      '컬럼명의 소문자 변환, 공백·언더스코어 정규화, 한영 동의어 매핑을 거쳐 신뢰도 점수(0~1)를 산출합니다.'),
    tbl([
        ['데이터 타입','필수 컬럼 조건','선택 컬럼','신뢰도 기준'],
        ['STOCK_OHLCV','date + open/high/low/close + volume','adj_close, turnover','≥ 0.85'],
        ['PORTFOLIO','ticker/종목 + weight/비중','returnRate, sector, name','≥ 0.80'],
        ['RETURNS','date + return/수익률','benchmark, cumulative','≥ 0.80'],
        ['FINANCIAL_STATEMENT','revenue/매출 또는 net_income','eps, roe, roa','≥ 0.75'],
        ['GENERIC','위 조건 미해당','—','< 0.75'],
    ], [38*mm, 50*mm, 42*mm, 28*mm]),
    SP(2),
    P('4.2 차트 시스템', sH2),
    tbl([
        ['차트','라이브러리','설명'],
        ['캔들스틱','lightweight-charts v5','시가·고가·저가·종가 + 거래량 히스토그램. 상승=teal, 하락=red'],
        ['MA 오버레이','lightweight-charts v5','MA20(amber), MA50(indigo) 이동평균선 오버레이'],
        ['볼린저 밴드','lightweight-charts v5','20일 SMA ± 2σ. Upper/Middle/Lower 파란 점선'],
        ['RSI(14)','recharts LineChart','70선(빨간)·30선(초록) 기준선. 현재값 헤더 색상 표시'],
        ['누적 수익률','recharts AreaChart','일간 수익률 복리 누산 곡선'],
        ['MDD 낙폭','recharts AreaChart','고점 대비 하락 시계열. 손실 구간 빨간 그라데이션'],
        ['포트폴리오 트리맵','recharts Treemap','비중=셀 크기, 수익률=색상 농도'],
        ['수익률 바 차트','recharts BarChart','종목별 수익률 수평 막대. 양수/음수 자동 색상'],
    ], [33*mm, 37*mm, 90*mm]),
    SP(2),
    P('4.3 KPI 바', sH2),
    tbl([
        ['KPI 지표','계산 방식','색상 기준'],
        ['현재가','마지막 행의 close 값','전일 대비 등락: teal / red'],
        ['전체 수익률','(종가 / 시가 - 1) × 100','양수=teal, 음수=red'],
        ['CAGR','(종가/시가)^(252/거래일수) - 1','양수=teal, 음수=red'],
        ['샤프 비율','연환산 평균수익률 / 변동성','≥1=teal, <0=red, else=white'],
        ['소르티노 비율','평균수익률 / 하방 표준편차 (연환산)','≥1=teal, <0=red, else=white'],
        ['최대 낙폭(MDD)','전체 기간 최대 고점 대비 하락%','< -20%이면 red'],
        ['변동성','일간 수익률 표준편차 × √252','> 30%이면 red'],
        ['RSI(14)','Wilder EMA 기반 상대강도지수','> 70=red, < 30=teal'],
    ], [35*mm, 65*mm, 60*mm]),
    PageBreak(),
]

# ══ 5. 데이터 처리 아키텍처 ═══════════════════════════════════════════════════
story += [
    P('5. 데이터 처리 아키텍처', sH1), HR(),
    P('5.1 전체 데이터 흐름', sH2),
    P('InvestDash의 데이터 처리는 완전히 클라이언트 사이드에서 실행됩니다. '
      '사용자의 파일이 서버로 전송되지 않으며, 브라우저 메모리에서 파싱과 계산이 이루어집니다.'),
    SP(1),
    tbl([
        ['단계','모듈','처리 내용'],
        ['1. 파일 입력','UploadZone.tsx','드래그&드롭 또는 클릭으로 CSV 파일 선택. .csv 확장자 제한'],
        ['2. CSV 파싱','PapaParse','헤더 자동 감지, 동적 타이핑(문자→숫자 자동 변환), 빈 행 제거'],
        ['3. 스키마 감지','schemaDetector.ts','컬럼명 패턴 매칭으로 데이터 타입 분류. 신뢰도 점수 산출'],
        ['4. 행 변환','schemaDetector.ts','감지된 타입에 따라 OHLCVRow / PortfolioRow / ReturnsRow 변환'],
        ['5. 지표 계산','financialEngine.ts','RSI, BB, Sharpe, Sortino, MDD, CAGR 등 전체 지표 계산'],
        ['6. 인사이트 생성','insightGenerator.ts','Claude API 또는 규칙 기반으로 한국어 인사이트 생성'],
        ['7. 렌더링','DashboardShell.tsx','KPI바, 차트 레이아웃, 인사이트 패널을 데이터 타입에 맞게 배치'],
    ], [18*mm, 38*mm, 104*mm]),
    SP(3),
    P('5.2 상태 관리', sH2),
    tbl([
        ['상태값','화면','전환 조건'],
        ['landing','랜딩 페이지 (히어로, 섹션, 업로드 존)','초기 진입 또는 "새 파일 업로드" 클릭'],
        ['loading','분석 중 화면','CSV 파일 선택 직후'],
        ['dashboard','대시보드 (차트, KPI, 인사이트)','스키마 감지 및 지표 계산 완료 후'],
    ], [22*mm, 65*mm, 73*mm]),
    SP(3),
    P('5.3 컴포넌트 데이터 흐름', sH2),
    tbl([
        ['컴포넌트','수신 props','역할'],
        ['App.tsx','—','파일 파싱, 상태 관리, 화면 전환 제어'],
        ['DashboardShell','schema, rows, rawRows','지표 계산(useMemo), 레이아웃 선택, 자식 조율'],
        ['KPIBar','metrics, dataType, currentPrice','데이터 타입별 KPI 카드 렌더링'],
        ['CandlestickChart','data(OHLCVRow[]), metrics','lightweight-charts 인스턴스 + 시리즈 추가'],
        ['RSIChart','rsiSeries, data','RSI 라인 차트 및 70/30 기준선 렌더링'],
        ['InsightPanel','request(InsightRequest), volumes','generateInsights() 호출 및 결과 렌더링'],
    ], [38*mm, 48*mm, 74*mm]),
    PageBreak(),
]

# ══ 6. 금융 지표 계산 명세 ════════════════════════════════════════════════════
story += [
    P('6. 금융 지표 계산 명세', sH1), HR(),
    P('모든 지표는 src/engine/financialEngine.ts에 구현되어 있으며, 클라이언트 브라우저에서 '
      '순수 TypeScript로 계산됩니다. 외부 금융 API 의존성이 없습니다.'),
    SP(1),
    P('6.1 이동평균 (Moving Average)', sH2),
    tbl([
        ['지표','기간','공식','용도'],
        ['MA20','20거래일','sum(close[i-19..i]) / 20','단기 추세, 볼린저 밴드 중심선'],
        ['MA50','50거래일','sum(close[i-49..i]) / 50','중기 추세, 골든/데드크로스 기준'],
        ['MA200','200거래일','sum(close[i-199..i]) / 200','장기 추세 (계산만, 차트 미표시)'],
    ], [18*mm, 20*mm, 62*mm, 60*mm]),
    SP(2),
    P('6.2 볼린저 밴드 (20일, 2σ)', sH2),
    tbl([
        ['구성요소','공식'],
        ['Middle Band','MA20(i)'],
        ['Upper Band','MA20(i) + 2 x stddev(close[i-19..i])'],
        ['Lower Band','MA20(i) - 2 x stddev(close[i-19..i])'],
        ['Band Width','(Upper - Lower) / Middle — 스퀴즈 탐지 기준 (4% 극심, 6% 진행)'],
        ['%B (위치)','(close - Lower) / (Upper - Lower) — 0=하단, 1=상단'],
    ], [42*mm, 118*mm]),
    SP(2),
    P('6.3 RSI (Relative Strength Index, 14일)', sH2),
    P('Wilder의 지수이동평균(EMA) 방식을 사용합니다. 단순 평균 기반 RSI와 달리 '
      '초기 14개 평균 이후부터 EMA 스무딩을 적용하여 더 안정적인 값을 산출합니다.'),
    tbl([
        ['단계','계산'],
        ['1. 일간 변화','delta[i] = close[i] - close[i-1]'],
        ['2. 상승/하락 분리','gain[i] = max(delta[i], 0),  loss[i] = max(-delta[i], 0)'],
        ['3. 초기 평균','avgGain = mean(gain[1..14]),  avgLoss = mean(loss[1..14])'],
        ['4. Wilder EMA','avgGain[i] = (avgGain[i-1] x 13 + gain[i]) / 14'],
        ['5. RS 계산','RS = avgGain / avgLoss'],
        ['6. RSI','RSI = 100 - (100 / (1 + RS))'],
    ], [30*mm, 130*mm]),
    SP(2),
    P('6.4 수익률 및 위험 지표', sH2),
    tbl([
        ['지표','공식','비고'],
        ['일간 수익률','(close[i] / close[i-1]) - 1','소수 형태 (0.01 = 1%)'],
        ['전체 수익률','(close[-1] / close[0]) - 1','% 단위로 표시'],
        ['CAGR','(close[-1] / close[0])^(252/N) - 1','N = 총 거래일수'],
        ['변동성 (연환산)','std(daily_returns) x sqrt(252)','% 단위. 252 = 연간 거래일'],
        ['MDD (최대 낙폭)','min((close[i] - max(close[0..i])) / max(close[0..i]))','음수 % 반환'],
        ['샤프 비율','mean(daily_returns) x 252 / (std(daily_returns) x sqrt(252))','Rf=0% 가정'],
        ['소르티노 비율','mean(daily_returns) x 252 / (std(음수수익률) x sqrt(252))','하방 편차 기준'],
    ], [30*mm, 80*mm, 50*mm]),
    P('샤프/소르티노의 무위험 수익률(Rf)은 계산 단순화를 위해 0%로 가정합니다. '
      '향후 국고채 수익률 입력 기능을 추가할 예정입니다.', sBodySm),
    PageBreak(),
]

# ══ 7. AI 인사이트 시스템 ══════════════════════════════════════════════════════
story += [
    P('7. AI 인사이트 시스템', sH1), HR(),
    P('7.1 이중 인사이트 구조', sH2),
    P('인사이트 생성은 두 가지 경로를 가집니다. 환경변수 VITE_CLAUDE_API_KEY가 설정된 경우 '
      'Claude API를 호출하고, 미설정이거나 호출 실패 시 규칙 기반 폴백으로 자동 전환됩니다.'),
    tbl([
        ['구분','Claude API 모드','규칙 기반 폴백 모드'],
        ['활성 조건','VITE_CLAUDE_API_KEY 환경변수 존재','API 키 없음 또는 호출 실패'],
        ['모델','claude-sonnet-4-6','—'],
        ['max_tokens','2048','—'],
        ['응답 형식','JSON { insights: string[], disclaimer }','동일 형식으로 반환'],
        ['토큰 비용','약 $0.003~0.005 / 파일당','무료'],
        ['인사이트 수','최대 4개','최대 5개'],
    ], [35*mm, 72*mm, 53*mm]),
    SP(2),
    P('7.2 규칙 기반 인사이트 신호 목록', sH2),
    tbl([
        ['신호 유형','감지 조건','출력 예시'],
        ['MA 골든크로스','MA20 > MA50','MA20(82,235)이 MA50(78,194) 위에 위치 (괴리율 +5.2%)'],
        ['MA 데드크로스','MA20 < MA50','MA20이 MA50 아래로 이탈, 단기 약세 압력'],
        ['RSI 과매수','RSI > 70','RSI(74.3) 과매수 구간. 차익 실현 압력 존재'],
        ['RSI 과매도','RSI < 30','RSI(24.1) 과매도 구간. 기술적 반등 가능성'],
        ['볼린저 스퀴즈','밴드폭 < 6%','밴드폭 4.8% — 변동성 압축, 방향성 돌파 임박'],
        ['볼린저 상단 근접','%B > 0.9','현재가가 상단밴드 90% 이상 위치. 과열 확인'],
        ['거래량 급증','최근 > 평균 × 1.5','거래량 20일 평균 대비 68% 급증'],
        ['거래량 급감','최근 < 평균 × 0.5','거래량이 평균의 43% 수준으로 감소'],
        ['MDD + 변동성','항상 포함','변동성 21.0%(고변동성), MDD -23.0%(높은 낙폭)'],
        ['샤프 + 소르티노','항상 포함','샤프 0.95(보통), 소르티노 0.99(하방 변동성 낮음)'],
    ], [30*mm, 42*mm, 88*mm]),
    PageBreak(),
]

# ══ 8. UI/UX 설계 원칙 ════════════════════════════════════════════════════════
story += [
    P('8. UI/UX 설계 원칙', sH1), HR(),
    P('8.1 정보 계층 구조 (F-Pattern)', sH2),
    P('사용자의 시선은 왼쪽 상단에서 시작하여 F자 패턴으로 이동합니다. '
      'KPI 바를 최상단에 배치하고, 가장 중요한 캔들스틱 차트를 좌측(3/5 비중), AI 인사이트를 우측(2/5 비중)에 배치합니다.'),
    tbl([
        ['영역','배치','내용'],
        ['1행 전체','상단 고정','KPI 바 — 핵심 수치 8개 항목'],
        ['2행 좌측 3/5','메인 패널','캔들스틱 차트 (MA, BB 포함)'],
        ['2행 우측 2/5','서브 패널','AI 인사이트 (4~5개 항목)'],
        ['3행 좌측 3/5','서브 차트','RSI(14) 라인 차트'],
        ['3행 우측 2/5','서브 차트','누적 수익률 곡선'],
        ['4행 전체','하단 차트','MDD 낙폭 영역 차트'],
        ['5행 전체','데이터 테이블','원시 데이터 — 기본 접힘 상태'],
    ], [28*mm, 30*mm, 102*mm]),
    SP(2),
    P('8.2 다크 테마 색상 시스템', sH2),
    tbl([
        ['역할','색상 코드','적용 위치'],
        ['주 배경','#0a0a0a','대시보드 전체 배경'],
        ['카드 배경','#111111','KPI 카드, 인사이트 패널, 차트 컨테이너'],
        ['구분선','#222222','카드 경계, 섹션 구분'],
        ['상승 / 긍정','#26a69a (teal)','양수 수익률, 과매도 RSI, 샤프 ≥1'],
        ['하락 / 위험','#ef5350 (red)','음수 수익률, 과매수 RSI, MDD, 샤프 <0'],
        ['MA20','#f59e0b (amber)','20일 이동평균선'],
        ['MA50','#818cf8 (indigo)','50일 이동평균선'],
        ['볼린저 밴드','rgba(96,165,250,0.7)','볼린저 상단·하단·중심선'],
    ], [32*mm, 40*mm, 88*mm]),
    PageBreak(),
]

# ══ 9. 기술 스택 ══════════════════════════════════════════════════════════════
story += [
    P('9. 기술 스택', sH1), HR(),
    tbl([
        ['분류','라이브러리','버전','선택 이유'],
        ['UI 프레임워크','React','19','컴포넌트 기반 UI, Concurrent 기능, 성숙한 생태계'],
        ['빌드 도구','Vite','8','HMR 속도, rolldown 기반 빌드, ESM 네이티브'],
        ['언어','TypeScript','6.0','strict 모드. 금융 계산 타입 안전성 보장'],
        ['스타일','Tailwind CSS','v4','유틸리티 CSS. CSS-in-JS 없이 컴포넌트 스타일링'],
        ['캔들스틱 차트','lightweight-charts','5.1','TradingView 오픈소스. 고성능 금융 차트'],
        ['일반 차트','recharts','3.8','React 기반 선언적 차트. RSI, 수익률, 낙폭'],
        ['CSV 파싱','PapaParse','5.5','헤더 자동 감지, 동적 타이핑'],
        ['상태 관리','Zustand','5.0','최소 보일러플레이트, 선택적 구독'],
        ['AI','Claude API','Sonnet 4.6','Anthropic 최신 모델. 한국어 품질 우수'],
    ], [25*mm, 35*mm, 15*mm, 85*mm]),
    PageBreak(),
]

# ══ 10. 파일 구조 ═════════════════════════════════════════════════════════════
story += [
    P('10. 프로젝트 파일 구조', sH1), HR(),
    tbl([
        ['경로','역할 및 설명'],
        ['src/App.tsx','앱 진입점. 파일 파싱, AppState 관리, 화면 전환'],
        ['src/engine/financialEngine.ts','RSI, 볼린저 밴드, Sharpe, Sortino, MDD, CAGR, MA 계산 엔진'],
        ['src/engine/insightGenerator.ts','Claude API 연동 + 규칙 기반 폴백 인사이트 생성기'],
        ['src/engine/schemaDetector.ts','CSV 컬럼명 패턴 매칭으로 데이터 타입 자동 분류'],
        ['src/components/layout/DashboardShell.tsx','대시보드 전체 레이아웃. 지표 계산, 데이터 타입별 서브레이아웃'],
        ['src/components/layout/KPIBar.tsx','데이터 타입별 KPI 카드 바. colorType 기반 색상 자동화'],
        ['src/components/charts/CandlestickChart.tsx','lightweight-charts v5 캔들스틱 + MA + 볼린저 밴드'],
        ['src/components/charts/RSIChart.tsx','recharts RSI 라인 차트. 70(red)/30(teal) 기준선'],
        ['src/components/charts/DrawdownChart.tsx','recharts MDD 낙폭 차트. 빨간 그라데이션'],
        ['src/components/charts/ReturnsLineChart.tsx','누적 수익률 AreaChart'],
        ['src/components/charts/PortfolioTreemap.tsx','포트폴리오 비중 트리맵'],
        ['src/components/charts/PortfolioBarChart.tsx','종목별 수익률 수평 바 차트'],
        ['src/components/widgets/InsightPanel.tsx','AI 인사이트 패널. 카테고리/핵심문장/상세 3계층 렌더링'],
        ['src/components/widgets/KPICard.tsx','KPI 카드. colorType에 따른 teal/red/white 자동 색상'],
        ['src/components/widgets/UploadZone.tsx','드래그&드롭 + 클릭 업로드 존. 지원 형식 태그'],
        ['src/types/financial.ts','전체 TypeScript 타입 정의'],
        ['skills/data-schema.md','스키마 감지 규칙 (코드와 동기화 유지)'],
        ['skills/indicators.md','금융 지표 계산 공식 명세'],
        ['skills/visualization.md','데이터 타입별 차트 선택 기준'],
        ['skills/insight-generation.md','Claude API 시스템 프롬프트 원본'],
        ['skills/dashboard-layout.md','레이아웃 원칙, 색상 시스템, 반응형 그리드'],
        ['public/KAKAO_OHLCV_2024.csv','테스트용 샘플 CSV (120거래일, 수익률 +12.2%)'],
        ['public/SAMSUNG_OHLCV_2023.csv','삼성전자 시뮬레이션 샘플 (252거래일, +23.7%)'],
    ], [68*mm, 92*mm]),
    PageBreak(),
]

# ══ 11. Skills.md 아키텍처 ════════════════════════════════════════════════════
story += [
    P('11. Skills.md 아키텍처', sH1), HR(),
    P('코드와 규칙의 분리가 핵심 설계 철학입니다. skills/ 디렉터리의 마크다운 파일들이 시스템 동작을 정의하며, '
      '코드는 이 규칙을 실행하는 인터프리터 역할을 합니다.'),
    SP(1),
    tbl([
        ['파일','역할','연결 모듈'],
        ['data-schema.md','컬럼명 패턴 매핑 규칙, 신뢰도 계산 기준, 데이터 타입 정의','schemaDetector.ts'],
        ['indicators.md','RSI, BB, Sharpe, MDD, CAGR 공식 및 해석 기준','financialEngine.ts'],
        ['visualization.md','데이터 타입별 차트 조합 규칙, 색상 코드','DashboardShell.tsx'],
        ['insight-generation.md','Claude 시스템 프롬프트, 인사이트 형식, 금지 표현','insightGenerator.ts'],
        ['dashboard-layout.md','F-Pattern 배치 원칙, KPI 카드 스펙, 반응형 그리드','KPIBar.tsx 등'],
    ], [40*mm, 80*mm, 40*mm]),
    SP(3),
]

# ══ 12. CSV 형식 명세 ═════════════════════════════════════════════════════════
story += [
    P('12. CSV 데이터 형식 명세', sH1), HR(),
    P('12.1 STOCK_OHLCV', sH2),
    tbl([
        ['컬럼명','타입','필수','허용 대체명','설명'],
        ['date','문자 (YYYY-MM-DD)','Y','Date, 날짜, 일자','거래일. ISO 8601 형식 권장'],
        ['open','숫자','Y','Open, 시가','시가'],
        ['high','숫자','Y','High, 고가','고가'],
        ['low','숫자','Y','Low, 저가','저가'],
        ['close','숫자','Y','Close, 종가','종가'],
        ['volume','숫자','Y','Volume, 거래량','거래량'],
    ], [22*mm, 28*mm, 12*mm, 36*mm, 62*mm]),
    SP(2),
    P('12.2 PORTFOLIO', sH2),
    tbl([
        ['컬럼명','타입','필수','설명'],
        ['ticker','문자','Y','종목코드 또는 종목명. 트리맵 레이블로 사용'],
        ['weight','숫자 (0~100)','Y','비중 %. 트리맵 크기 결정'],
        ['returnRate','숫자','N','수익률 %. 트리맵 색상 및 바 차트에 사용'],
        ['sector','문자','N','섹터명'],
    ], [28*mm, 22*mm, 12*mm, 98*mm]),
    SP(2),
    P('12.3 RETURNS', sH2),
    tbl([
        ['컬럼명','타입','필수','설명'],
        ['date','문자 (YYYY-MM-DD)','Y','날짜'],
        ['return','숫자 (소수)','Y','일간 수익률. 소수 형태 (1% = 0.01)'],
        ['benchmark','숫자 (소수)','N','벤치마크 수익률'],
    ], [28*mm, 35*mm, 12*mm, 85*mm]),
    PageBreak(),
]

# ══ 13. 향후 개발 계획 ════════════════════════════════════════════════════════
story += [
    P('13. 향후 개발 계획', sH1), HR(),
    P('13.1 단기 개선 항목 (1~2개월)', sH2),
    tbl([
        ['항목','내용','우선순위'],
        ['CSV 컬럼 수동 매핑','자동 감지 실패 시 사용자가 컬럼 역할을 수동 지정','상'],
        ['차트 기간 필터','1M / 3M / 6M / 1Y / ALL 기간 선택 버튼 추가','중'],
        ['국고채 수익률 입력','Rf 값 커스텀 입력 필드. 샤프/소르티노 재계산','중'],
        ['MA200 차트 표시','현재 계산만 되는 MA200을 차트에 옵션으로 추가','하'],
        ['벤치마크 비교 차트','RETURNS 모드에서 KOSPI 수익률 오버레이','중'],
    ], [42*mm, 90*mm, 17*mm]),
    SP(2),
    P('13.2 중기 개발 항목 (3~6개월)', sH2),
    tbl([
        ['항목','내용'],
        ['다중 파일 비교','여러 CSV를 동시 업로드하여 포트폴리오 비교 분석'],
        ['MACD 지표 추가','MACD Line, Signal Line, Histogram 차트 추가'],
        ['PDF 리포트 내보내기','현재 대시보드 상태를 PDF로 저장'],
        ['모바일 반응형 개선','현재 lg 브레이크포인트 기준 레이아웃을 모바일 최적화'],
        ['재무제표 분석','FINANCIAL_STATEMENT 타입 전용 차트 (ROE, PER, 부채비율 등)'],
    ], [45*mm, 115*mm]),
    SP(2),
    P('13.3 장기 고도화 방향', sH2),
    B('실시간 데이터 연동: 공개 API(한국거래소, Yahoo Finance)를 통한 실시간 주가 조회 기능'),
    B('백테스팅 엔진: 이동평균 교차, RSI 기반 단순 전략의 과거 수익률 시뮬레이션'),
    B('포트폴리오 최적화: 마코위츠 효율적 프론티어 계산 및 최적 비중 제안'),
    B('알림 시스템: RSI 과매수/과매도, 볼린저 스퀴즈 발생 시 브라우저 알림'),
    B('LLM 멀티턴 분석: 차트를 보며 사용자가 질문하면 Claude가 답변하는 대화형 분석 모드'),
    SP(4),
    HR(1.5, BLACK),
    SP(2),
    P('본 기획서는 InvestDash v1.0 기준으로 작성되었습니다. 이후 버전에서 내용이 변경될 수 있습니다.', sCaption),
    P('작성: InvestDash 개발팀  |  최종 수정: 2025', sCaption),
]

# ══ PDF 빌드 ══════════════════════════════════════════════════════════════════
out = os.path.join(os.path.dirname(__file__), 'InvestDash_기획서.pdf')
doc = SimpleDocTemplate(
    out, pagesize=A4,
    leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB,
    title='InvestDash 프로젝트 기획서',
    author='InvestDash 개발팀',
)
doc.build(story, onLaterPages=footer, onFirstPage=footer)
print(f"\nPDF 생성 완료: {out}")
