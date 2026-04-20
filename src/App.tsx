import { useState, useCallback, useEffect, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import Papa from 'papaparse'
import { DashboardShell } from './components/layout/DashboardShell'
import { UploadZone } from './components/widgets/UploadZone'
import {
  detectSchema,
  toOHLCVRows,
  toPortfolioRows,
  toReturnsRows,
} from './engine/schemaDetector'
import { DEMO_STOCK_DATA, DEMO_STOCK_SCHEMA } from './data/demoStock'
import { DEMO_PORTFOLIO_DATA, DEMO_PORTFOLIO_SCHEMA } from './data/demoPortfolio'
import { DEMO_RETURNS_DATA, DEMO_RETURNS_SCHEMA } from './data/demoReturns'
import type {
  AppState, DetectedSchema, OHLCVRow, PortfolioRow, ReturnsRow,
} from './types/financial'

type DashboardPayload =
  | { schema: DetectedSchema & { dataType: 'STOCK_OHLCV' }; rows: OHLCVRow[]; rawRows: Record<string, string | number | null>[] }
  | { schema: DetectedSchema & { dataType: 'PORTFOLIO' }; rows: PortfolioRow[]; rawRows: Record<string, string | number | null>[] }
  | { schema: DetectedSchema & { dataType: 'RETURNS' }; rows: ReturnsRow[]; rawRows: Record<string, string | number | null>[] }
  | { schema: DetectedSchema & { dataType: 'GENERIC' | 'FINANCIAL_STATEMENT' }; rows: Record<string, string | number | null>[]; rawRows: Record<string, string | number | null>[] }

function buildPayload(schema: DetectedSchema, rawRows: Record<string, string | number | null>[]): DashboardPayload {
  if (schema.dataType === 'STOCK_OHLCV') return { schema: schema as DetectedSchema & { dataType: 'STOCK_OHLCV' }, rows: toOHLCVRows(rawRows, schema), rawRows }
  if (schema.dataType === 'PORTFOLIO') return { schema: schema as DetectedSchema & { dataType: 'PORTFOLIO' }, rows: toPortfolioRows(rawRows, schema), rawRows }
  if (schema.dataType === 'RETURNS') return { schema: schema as DetectedSchema & { dataType: 'RETURNS' }, rows: toReturnsRows(rawRows, schema), rawRows }
  return { schema: schema as DetectedSchema & { dataType: 'GENERIC' | 'FINANCIAL_STATEMENT' }, rows: rawRows, rawRows }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing')
  const [payload, setPayload] = useState<DashboardPayload | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    setParseError(null)
    setAppState('loading')
    Papa.parse<Record<string, string>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? []
        const rawRows = result.data as Record<string, string | number | null>[]
        if (rawRows.length === 0) { setParseError('파일에 데이터가 없습니다.'); setAppState('landing'); return }
        const schema = detectSchema(headers, rawRows)
        setPayload(buildPayload(schema, rawRows))
        setAppState('dashboard')
      },
      error: (err) => { setParseError('파싱 오류: ' + err.message); setAppState('landing') },
    })
  }, [])

  const loadDemo = useCallback((type: 'stock' | 'portfolio' | 'returns') => {
    if (type === 'stock') {
      setPayload({ schema: DEMO_STOCK_SCHEMA as DetectedSchema & { dataType: 'STOCK_OHLCV' }, rows: DEMO_STOCK_DATA, rawRows: DEMO_STOCK_DATA as unknown as Record<string, string | number | null>[] })
    } else if (type === 'portfolio') {
      setPayload({ schema: DEMO_PORTFOLIO_SCHEMA as DetectedSchema & { dataType: 'PORTFOLIO' }, rows: DEMO_PORTFOLIO_DATA, rawRows: DEMO_PORTFOLIO_DATA as unknown as Record<string, string | number | null>[] })
    } else {
      setPayload({ schema: DEMO_RETURNS_SCHEMA as DetectedSchema & { dataType: 'RETURNS' }, rows: DEMO_RETURNS_DATA, rawRows: DEMO_RETURNS_DATA as unknown as Record<string, string | number | null>[] })
    }
    setAppState('dashboard')
  }, [])

  const handleReset = useCallback(() => { setAppState('landing'); setPayload(null); setParseError(null) }, [])

  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffffff', backgroundImage: 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)', backgroundSize: '28px 28px' }}>
        <p className="text-[#aaaaaa] text-sm tracking-widest uppercase">분석 중</p>
      </div>
    )
  }

  if (appState === 'dashboard' && payload) {
    return <DashboardShell data={payload} onReset={handleReset} />
  }

  return <LandingPage onFile={handleFile} onDemo={loadDemo} parseError={parseError} />
}

// ─── Navbar ────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'How it Works', id: 'how-it-works' },
  { label: 'Charts',       id: 'charts'       },
  { label: 'Skills',       id: 'skills'       },
  { label: 'Demo',         id: 'demo'         },
]

function Navbar({ onTryNow }: { onTryNow: () => void }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={
        scrolled
          ? {
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
            }
          : { background: 'transparent' }
      }
    >
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-sm font-semibold tracking-widest uppercase text-[#0a0a0a] select-none bg-transparent border-none cursor-pointer hover:opacity-60 transition-opacity duration-200"
        >
          InvestDash
        </button>

        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, id }) => (
            <li key={id}>
              <button
                onClick={() => scrollTo(id)}
                className="text-sm text-[#666666] hover:text-[#0a0a0a] transition-colors duration-200 bg-transparent border-none cursor-pointer"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={onTryNow}
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 700,
            fontSize: '0.8125rem',
            letterSpacing: '0.01em',
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            background: '#ffffff',
            color: '#0a0a0a',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.transform = 'translateY(-1px)'
            el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.transform = 'translateY(0)'
            el.style.boxShadow = 'none'
          }}
        >
          시작하기
        </button>
      </div>
    </nav>
  )
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={'py-16 px-8 ' + className} style={{ background: 'inherit' }}>
      <div className="max-w-5xl mx-auto">
        {children}
      </div>
    </section>
  )
}

// 섹션 헤더(라벨+제목+설명)를 흰 배경 블록으로 감싸 가독성 확보
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e8e8e8',
      padding: '2rem 2.25rem 2rem',
      marginBottom: '0',
      display: 'inline-block',
      maxWidth: '38rem',
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: '#aaaaaa' }}>{children}</p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl font-semibold mb-3 leading-snug" style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, letterSpacing: '-0.01em', color: '#0a0a0a' }}>{children}</h2>
  )
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed" style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 400, color: '#555555' }}>{children}</p>
  )
}

// ─── How it Works ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    num: '01',
    title: 'CSV 업로드',
    desc: '주가 OHLCV, 포트폴리오, 수익률 등 어떤 형식이든 드래그해서 올립니다.',
  },
  {
    num: '02',
    title: '스키마 자동 감지',
    desc: 'Skills.md 규칙에 따라 컬럼명을 분석해 데이터 타입을 자동으로 분류합니다.',
  },
  {
    num: '03',
    title: '차트 + 인사이트 생성',
    desc: '데이터 타입에 맞는 차트를 렌더링하고 AI가 핵심 인사이트를 한국어로 생성합니다.',
  },
]

function HowItWorksSection() {
  return (
    <Section id="how-it-works">
      <SectionHeader>
        <SectionLabel>Process</SectionLabel>
        <SectionTitle>3단계로 끝납니다</SectionTitle>
        <SectionDesc>
          복잡한 설정 없이 파일 하나로 전문 금융 대시보드를 즉시 확인할 수 있습니다.
        </SectionDesc>
      </SectionHeader>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#d8d8d8]">
        {HOW_STEPS.map((step) => (
          <div key={step.num} className="bg-white p-8" style={{ backdropFilter: 'blur(0px)' }}>
            <span className="text-5xl block mb-6 leading-none" style={{ fontFamily: "'Inter', monospace", color: 'rgba(0,0,0,0.15)', fontWeight: 300 }}>{step.num}</span>
            <h3 style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, color: '#0a0a0a', marginBottom: '0.625rem' }}>{step.title}</h3>
            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 300, fontSize: '0.9rem', lineHeight: 1.8, color: '#666666' }}>{step.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── Charts ───────────────────────────────────────────────────────────────────

const CHART_ITEMS = [
  {
    type: 'STOCK_OHLCV',
    title: '주가 캔들스틱',
    desc: 'lightweight-charts v5 기반의 캔들스틱 차트. MA20/MA50 오버레이, 거래량 서브패널 포함.',
    tags: ['Candlestick', 'MA20', 'MA50', 'Volume'],
  },
  {
    type: 'PORTFOLIO',
    title: '포트폴리오 트리맵',
    desc: '종목별 비중을 크기로, 수익률을 밝기로 표현. 한눈에 포트폴리오 구성을 파악.',
    tags: ['Treemap', 'Weight', 'Return Rate'],
  },
  {
    type: 'RETURNS',
    title: '누적 수익률',
    desc: '일간 수익률 데이터로 누적 수익 곡선과 낙폭(Drawdown) 차트를 자동 생성.',
    tags: ['Cumulative', 'Drawdown', 'Area Chart'],
  },
  {
    type: 'INDICATORS',
    title: '기술 지표',
    desc: 'RSI(14), Bollinger Bands, Sharpe Ratio, Sortino, MDD, CAGR을 자동 계산.',
    tags: ['RSI', 'Bollinger', 'Sharpe', 'MDD'],
  },
]

function ChartsSection() {
  return (
    <Section id="charts">
      <SectionHeader>
        <SectionLabel>Visualization</SectionLabel>
        <SectionTitle>데이터 타입에 맞는 차트를 자동 선택</SectionTitle>
        <SectionDesc>
          업로드한 데이터가 무엇인지 감지해 최적의 차트 조합을 렌더링합니다.
          별도 설정 없이 즉시 전문 금융 시각화를 확인할 수 있습니다.
        </SectionDesc>
      </SectionHeader>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-px bg-[#d8d8d8]">
        {CHART_ITEMS.map((item) => (
          <div key={item.type} className="bg-white p-8 group">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs uppercase tracking-widest" style={{ color: '#aaaaaa', fontFamily: "'Inter', monospace" }}>{item.type}</span>
            </div>
            <h3 style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#0a0a0a', marginBottom: '0.625rem' }}>{item.title}</h3>
            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 300, fontSize: '0.875rem', lineHeight: 1.8, color: '#666666', marginBottom: '1.25rem' }}>{item.desc}</p>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1" style={{ color: '#888888', border: '1px solid #e0e0e0' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── Skills ───────────────────────────────────────────────────────────────────

const SKILL_FILES = [
  {
    file: 'data-schema.md',
    title: '데이터 스키마 감지',
    desc: '컬럼명 패턴 매칭으로 OHLCV / 포트폴리오 / 수익률 등 5종 데이터 타입을 자동 분류하는 규칙 정의.',
  },
  {
    file: 'visualization.md',
    title: '시각화 선택 기준',
    desc: '데이터 타입별로 어떤 차트를 렌더링할지 결정하는 조건-행동 규칙과 색상 시스템 명세.',
  },
  {
    file: 'indicators.md',
    title: '금융 지표 계산',
    desc: 'RSI, 볼린저 밴드, 샤프 비율, MDD, CAGR 등 모든 지표의 정확한 공식과 해석 기준 정의.',
  },
  {
    file: 'insight-generation.md',
    title: 'AI 인사이트 생성',
    desc: 'Claude API 시스템 프롬프트로 주입되는 인사이트 템플릿. API 미사용 시 규칙 기반 폴백.',
  },
  {
    file: 'dashboard-layout.md',
    title: '대시보드 레이아웃',
    desc: 'F-Pattern 배치 원칙, KPI 카드 스펙, 반응형 그리드 규칙, 다크 테마 색상 시스템 정의.',
  },
]

function SkillsSection() {
  return (
    <Section id="skills">
      <SectionHeader>
        <SectionLabel>Architecture</SectionLabel>
        <SectionTitle>Skills.md가 코드의 행동을 결정합니다</SectionTitle>
        <SectionDesc>
          5개의 Skills.md 파일이 시스템 전체의 규칙을 정의합니다. 코드는 Skills.md를 읽고 실행하는
          인터프리터입니다. LLM 프롬프트 주입부터 차트 선택, 레이아웃까지 모두 Skills.md로 제어됩니다.
        </SectionDesc>
      </SectionHeader>

      <div className="mt-8 space-y-px bg-[#d8d8d8]">
        {SKILL_FILES.map((skill, i) => (
          <div key={skill.file} className="bg-white px-8 py-6 flex items-start gap-8">
            <span className="text-2xl w-8 shrink-0 mt-0.5" style={{ fontFamily: "'Inter', monospace", color: 'rgba(0,0,0,0.2)', fontWeight: 300 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-xs font-mono" style={{ color: '#aaaaaa' }}>{skill.file}</code>
              </div>
              <h3 style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500, color: '#0a0a0a', marginBottom: '0.375rem' }}>{skill.title}</h3>
              <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 300, fontSize: '0.875rem', lineHeight: 1.8, color: '#666666' }}>{skill.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 border border-[#e0e0e0] bg-white">
        <p className="text-xs leading-relaxed font-mono" style={{ color: '#888888', fontFamily: "'Inter', monospace" }}>
          {'// Skills.md → 시스템 프롬프트 주입 예시'}<br />
          {'const systemPrompt = fs.readFileSync("skills/insight-generation.md")'}<br />
          {'// Claude API 호출 시 규칙을 컨텍스트로 주입'}<br />
          {'generateInsights({ systemPrompt, metrics, dataType })'}
        </p>
      </div>
    </Section>
  )
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

interface DemoSectionProps {
  onDemo: (type: 'stock' | 'portfolio' | 'returns') => void
  onFile: (file: File) => void
}

const DEMOS: Array<{
  type: 'stock' | 'portfolio' | 'returns'
  title: string
  subtitle: string
  meta: string
}> = [
  {
    type: 'stock',
    title: '주가 OHLCV',
    subtitle: '삼성전자 2년치 시뮬레이션',
    meta: '504 거래일 · GBM 모델 · MA20/50 · RSI · Bollinger',
  },
  {
    type: 'portfolio',
    title: '포트폴리오',
    subtitle: 'KOSPI 상위 12개 종목',
    meta: '트리맵 · 수익률 바 차트 · 가중 수익률 · 집중도',
  },
  {
    type: 'returns',
    title: '수익률 시계열',
    subtitle: '3년 일간 수익률 데이터',
    meta: '756일 · 누적 수익률 · MDD · Sharpe · Sortino',
  },
]

function DemoSection({ onDemo, onFile }: DemoSectionProps) {
  return (
    <Section id="demo">
      <SectionHeader>
        <SectionLabel>Try it</SectionLabel>
        <SectionTitle>바로 체험해보세요</SectionTitle>
        <SectionDesc>
          별도 회원가입 없이 데모 데이터로 즉시 시작하거나, 직접 CSV를 업로드해 분석할 수 있습니다.
        </SectionDesc>
      </SectionHeader>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEMOS.map((demo) => (
          <button
            key={demo.type}
            onClick={() => onDemo(demo.type)}
            className="bg-white text-left group transition-all duration-200"
            style={{
              border: '1.5px solid #e0e0e0',
              padding: '1.75rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.border = '1.5px solid #0a0a0a'
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.border = '1.5px solid #e0e0e0'
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
          >
            {/* 클릭 유도 화살표 */}
            <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', opacity: 0.2, transition: 'opacity 0.2s, transform 0.2s' }}
              className="group-hover:!opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 12L12 2M12 2H5M12 2v7" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* 타입 배지 */}
            <span style={{
              fontFamily: "'Inter', monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#aaaaaa',
              display: 'block',
              marginBottom: '0.875rem',
            }}>
              {demo.type === 'stock' ? 'STOCK_OHLCV' : demo.type === 'portfolio' ? 'PORTFOLIO' : 'RETURNS'}
            </span>

            <h3 style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#0a0a0a', marginBottom: '0.4rem' }}>
              {demo.title}
            </h3>
            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 400, fontSize: '0.8rem', color: '#888888', marginBottom: '1.25rem' }}>
              {demo.subtitle}
            </p>

            {/* 구분선 */}
            <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '1rem' }} />

            {/* 메타 태그들 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {demo.meta.split(' · ').map((tag) => (
                <span key={tag} style={{
                  fontFamily: "'Inter', monospace",
                  fontSize: '0.65rem',
                  color: '#999999',
                  background: '#f7f7f7',
                  padding: '0.2rem 0.5rem',
                  border: '1px solid #eeeeee',
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* 하단 CTA */}
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: '#0a0a0a' }}>
                데모 보기
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1.5 6h9M7 2.5l3.5 3.5L7 9.5" stroke="#0a0a0a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <UploadZone onFile={onFile} />
      </div>
    </Section>
  )
}




// ─── Shared demo price data ────────────────────────────────────────────────────
const MINI_PRICES = [
  { d: 'Jan', p: 71200 }, { d: 'Jan', p: 72500 }, { d: 'Jan', p: 70800 },
  { d: 'Feb', p: 73400 }, { d: 'Feb', p: 74100 }, { d: 'Feb', p: 75600 },
  { d: 'Feb', p: 74800 }, { d: 'Mar', p: 76200 }, { d: 'Mar', p: 77900 },
  { d: 'Mar', p: 76500 }, { d: 'Apr', p: 78300 }, { d: 'Apr', p: 79800 },
  { d: 'Apr', p: 78900 }, { d: 'May', p: 80100 }, { d: 'May', p: 81500 },
  { d: 'May', p: 80700 }, { d: 'Jun', p: 79400 }, { d: 'Jun', p: 78100 },
  { d: 'Jun', p: 79800 }, { d: 'Jul', p: 81200 }, { d: 'Jul', p: 82700 },
  { d: 'Jul', p: 81900 }, { d: 'Aug', p: 83400 }, { d: 'Aug', p: 84900 },
  { d: 'Aug', p: 83600 }, { d: 'Sep', p: 85200 }, { d: 'Sep', p: 84100 },
  { d: 'Sep', p: 86300 }, { d: 'Oct', p: 87500 }, { d: 'Oct', p: 86200 },
]

// ─── Hero Demo Preview (오른쪽 하단 인라인 애니메이션) ─────────────────────────

function HeroDemoPreview() {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visibleData, setVisibleData] = useState(0)
  const [kpiVisible, setKpiVisible] = useState(false)
  const [insightVisible, setInsightVisible] = useState(false)

  const DURATIONS = [2800, 1800, 1200, 5800]

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase(p => {
        const next = (p + 1) % 4
        if (next === 0) {
          setProgress(0); setVisibleData(0)
          setKpiVisible(false); setInsightVisible(false)
        }
        return next
      })
    }, DURATIONS[phase])
    return () => clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 1) return
    setProgress(0)
    const iv = setInterval(() => setProgress(p => p >= 100 ? 100 : p + 5), 55)
    return () => clearInterval(iv)
  }, [phase])

  useEffect(() => {
    if (phase !== 3) return
    setVisibleData(0); setKpiVisible(false); setInsightVisible(false)
    const t1 = setTimeout(() => setKpiVisible(true), 250)
    const t2 = setTimeout(() => setVisibleData(MINI_PRICES.length), 500)
    const t3 = setTimeout(() => setInsightVisible(true), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [phase])

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '2rem', paddingTop: '2rem' }}>
      {/* 브라우저 목업 */}
      <div style={{ width: '100%', maxWidth: '480px', border: '1px solid #e0e0e0', borderRadius: '0.75rem', overflow: 'hidden', background: '#ffffff', boxShadow: '0 24px 64px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06)' }}>

        {/* 브라우저 크롬 */}
        <div style={{ background: '#f5f5f5', borderBottom: '1px solid #e8e8e8', padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {['#ffbdbd','#ffd8a8','#c3f0ca'].map((c,i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, background: '#ececec', borderRadius: '0.25rem', padding: '0.2rem 0.625rem', marginLeft: '0.25rem' }}>
            <span style={{ fontFamily: "'Inter', monospace", fontSize: '0.65rem', color: '#999999' }}>investdash.vercel.app</span>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div style={{ height: '340px', position: 'relative', overflow: 'hidden', background: '#fafafa' }}>

          {/* Phase 0: Upload */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transition: 'opacity 0.4s', opacity: phase === 0 ? 1 : 0, pointerEvents: 'none', padding: '1.5rem' }}>
            <div style={{ border: '2px dashed #dddddd', borderRadius: '0.5rem', padding: '2rem 3rem', textAlign: 'center', width: '100%' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto 0.875rem', display: 'block' }}>
                <path d="M16 6v14M10 12l6-6 6 6" stroke="#bbbbbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 24h20" stroke="#bbbbbb" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: '0.8rem', fontWeight: 400, color: '#888888', marginBottom: '0.375rem' }}>
                투자 데이터를 드래그하세요
              </p>
              <p style={{ fontFamily: "'Inter', monospace", fontSize: '0.65rem', color: '#bbbbbb' }}>CSV 지원</p>
              <div style={{ marginTop: '1.25rem', padding: '0.4rem 0.875rem', background: '#f0f0f0', border: '1px solid #e0e0e0', borderRadius: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="0.5" y="0.5" width="11" height="11" rx="1" stroke="#cccccc"/><path d="M2 4h8M2 6h6M2 8h4" stroke="#cccccc" strokeLinecap="round"/></svg>
                <span style={{ fontFamily: "'Inter', monospace", fontSize: '0.65rem', color: '#aaaaaa' }}>SAMSUNG_OHLCV_2024.csv</span>
              </div>
            </div>
          </div>

          {/* Phase 1: Loading */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.25rem', transition: 'opacity 0.4s', opacity: phase === 1 ? 1 : 0, pointerEvents: 'none' }}>
            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 300, fontSize: '0.8rem', color: '#888888' }}>Skills.md 규칙으로 스키마 분석 중...</p>
            <div style={{ width: '200px', height: '2px', background: '#eeeeee', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#0a0a0a', borderRadius: '1px', width: progress + '%', transition: 'width 0.055s linear' }} />
            </div>
            <p style={{ fontFamily: "'Inter', monospace", fontSize: '0.65rem', color: '#cccccc' }}>{progress}%</p>
          </div>

          {/* Phase 2: Schema Detected */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.875rem', transition: 'opacity 0.4s', opacity: phase === 2 ? 1 : 0, pointerEvents: 'none' }}>
            <div style={{ padding: '1.25rem 2rem', border: '1px solid #e8e8e8', borderRadius: '0.5rem', textAlign: 'center', background: '#ffffff' }}>
              <p style={{ fontFamily: "'Inter', monospace", fontSize: '0.65rem', color: '#aaaaaa', marginBottom: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>스키마 감지 완료</p>
              <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, fontSize: '1.35rem', color: '#0a0a0a', marginBottom: '0.375rem' }}>STOCK_OHLCV</p>
              <p style={{ fontFamily: "'Inter', monospace", fontSize: '0.65rem', color: '#bbbbbb' }}>504 rows · date, open, high, low, close, volume</p>
            </div>
            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 300, fontSize: '0.75rem', color: '#bbbbbb' }}>대시보드 생성 중...</p>
          </div>

          {/* Phase 3: Dashboard */}
          <div style={{ position: 'absolute', inset: 0, transition: 'opacity 0.5s', opacity: phase === 3 ? 1 : 0, pointerEvents: 'none', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

            {/* KPI 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.375rem', transition: 'opacity 0.4s, transform 0.4s', opacity: kpiVisible ? 1 : 0, transform: kpiVisible ? 'translateY(0)' : 'translateY(6px)' }}>
              {[
                { label: '현재가', value: '86,300' },
                { label: 'RSI(14)', value: '58.3' },
                { label: 'Sharpe', value: '1.24' },
                { label: 'MDD', value: '-12.4%' },
              ].map(k => (
                <div key={k.label} style={{ background: '#ffffff', border: '1px solid #eeeeee', borderRadius: '0.35rem', padding: '0.4rem 0.5rem' }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', color: '#bbbbbb', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', fontWeight: 600, color: '#0a0a0a' }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* 차트 + 인사이트 */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.375rem', minHeight: 0 }}>
              <div style={{ background: '#ffffff', border: '1px solid #eeeeee', borderRadius: '0.35rem', padding: '0.5rem 0.375rem 0.25rem', transition: 'opacity 0.5s', opacity: visibleData > 0 ? 1 : 0 }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', color: '#cccccc', marginBottom: '0.35rem', paddingLeft: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Close Price</p>
                <ResponsiveContainer width="100%" height="88%">
                  <AreaChart data={MINI_PRICES.slice(0, visibleData)} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="d" tick={{ fontSize: 8, fill: '#cccccc' }} axisLine={false} tickLine={false} interval={5} />
                    <YAxis domain={['auto','auto']} tick={{ fontSize: 8, fill: '#cccccc' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => (v/1000).toFixed(0)+'k'} />
                    <Area type="monotone" dataKey="p" stroke="#0a0a0a" strokeWidth={1.5} fill="url(#heroGrad)" dot={false} animationDuration={700} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #eeeeee', borderRadius: '0.35rem', padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'opacity 0.5s, transform 0.5s', opacity: insightVisible ? 1 : 0, transform: insightVisible ? 'translateX(0)' : 'translateX(6px)' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', color: '#cccccc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Insight</p>
                <div style={{ width: '1.25rem', height: '1px', background: '#eeeeee' }} />
                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 300, fontSize: '0.65rem', color: '#555555', lineHeight: 1.7 }}>
                  RSI 58.3 중립 구간. 52주 고점 대비 5.4% 하단 저항.
                </p>
                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 300, fontSize: '0.65rem', color: '#aaaaaa', lineHeight: 1.7, marginTop: 'auto' }}>
                  Sharpe 1.24 — 시장 대비 우수한 위험 조정 수익률.
                </p>
              </div>
            </div>
          </div>

          {/* 페이즈 인디케이터 */}
          <div style={{ position: 'absolute', bottom: '0.625rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.3rem' }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: i === phase ? 14 : 5, height: 3, borderRadius: '2px', background: i === phase ? '#0a0a0a' : '#dddddd', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

interface LandingProps {
  onFile: (file: File) => void
  onDemo: (type: 'stock' | 'portfolio' | 'returns') => void
  parseError: string | null
}

function LandingPage({ onFile, onDemo, parseError }: LandingProps) {
  const heroRef = useRef<HTMLDivElement>(null)

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

    return (
    <div style={{
      background: '#ffffff',
      backgroundImage: 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      color: '#0a0a0a',
    }}>

      {/* ── Hero: 좌측 카피 + 우측 하단 데모 ── */}
      <div
        ref={heroRef}
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}
      >

        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar onTryNow={scrollToDemo} />

          {/* split layout */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '72rem', margin: '0 auto', width: '100%', padding: '0 2rem', alignItems: 'center' }}>

            {/* 왼쪽: 카피 */}
            <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
              {/* 뱃지 */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: '9999px', background: '#f0f0f0', border: '1px solid #e0e0e0', marginBottom: '2rem' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#0a0a0a', opacity: 0.35, display: 'inline-block' }} />
                <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: '0.7rem', fontWeight: 400, color: '#888888', letterSpacing: '0.05em' }}>
                  월간 해커톤 · Skills 기반 대시보드
                </span>
              </div>

              {/* 헤드라인 */}
              <h1 style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', lineHeight: 1.15, letterSpacing: '-0.02em', color: '#0a0a0a', margin: '0 0 1.25rem', wordBreak: 'keep-all' }}>
                Skills.md가<br />
                대시보드를<br />
                설계합니다.
              </h1>

              {/* 서브 카피 */}
              <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: '1rem', fontWeight: 300, lineHeight: 1.85, color: '#666666', maxWidth: '22rem', margin: '0 0 2.5rem', wordBreak: 'keep-all' }}>
                5개의 규칙 파일이 스키마 감지, 차트 선택,
                AI 인사이트 생성을 전부 결정합니다.
              </p>

              {/* CTA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={scrollToDemo}
                  style={{ background: '#0a0a0a', color: '#ffffff', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, fontSize: '0.9rem', padding: '0.875rem 2rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.15s ease, box-shadow 0.2s ease' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.18)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
                >
                  데모 체험하기
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path d="M1.5 6.5h10M8 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ background: 'transparent', color: '#666666', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 400, fontSize: '0.9rem', padding: '0.875rem 1.75rem', borderRadius: '9999px', border: '1px solid #dddddd', cursor: 'pointer', transition: 'color 0.15s ease, border-color 0.15s ease' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#0a0a0a'; el.style.borderColor = '#999999' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#666666'; el.style.borderColor = '#dddddd' }}
                >
                  아키텍처 보기
                </button>
              </div>
            </div>

            {/* 오른쪽 하단: 인라인 데모 애니메이션 */}
            <HeroDemoPreview />
          </div>
        </div>
      </div>

      {/* ── 섹션들 ── */}
      <HowItWorksSection />
      <ChartsSection />
      <SkillsSection />
      <DemoSection onDemo={onDemo} onFile={onFile} />

      {parseError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#111111] border border-[#333333] px-5 py-3 text-sm text-[#888888] z-50">
          {parseError}
        </div>
      )}

      <footer className="border-t border-[#d8d8d8] px-8 py-6 flex items-center justify-between">
        <span className="text-xs text-[#0a0a0a] font-semibold tracking-widest uppercase">InvestDash</span>
        <p className="text-xs text-[#999999]">모든 분석은 과거 데이터 기반이며 투자 권유가 아닙니다.</p>
      </footer>

    </div>
  )
}
