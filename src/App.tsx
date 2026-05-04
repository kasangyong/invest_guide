import { useState, useCallback, useEffect, useRef } from 'react'
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'
import Papa from 'papaparse'
import { DashboardShell } from './components/layout/DashboardShell'
import { UploadZone } from './components/widgets/UploadZone'
import { detectSchema, toOHLCVRows, toPortfolioRows, toReturnsRows } from './engine/schemaDetector'
import { DEMO_STOCK_DATA, DEMO_STOCK_SCHEMA } from './data/demoStock'
import { DEMO_PORTFOLIO_DATA, DEMO_PORTFOLIO_SCHEMA } from './data/demoPortfolio'
import { DEMO_RETURNS_DATA, DEMO_RETURNS_SCHEMA } from './data/demoReturns'
import { calculateAllMetrics } from './engine/financialEngine'
import { CandlestickChart } from './components/charts/CandlestickChart'
import { RSIChart } from './components/charts/RSIChart'
import type { AppState, DetectedSchema, OHLCVRow, PortfolioRow, ReturnsRow } from './types/financial'
import CountUp from './components/effects/CountUp'
import SpotlightCard from './components/effects/SpotlightCard'

// ── Types ─────────────────────────────────────────────────────────────────────
type DashboardPayload =
  | { schema: DetectedSchema & { dataType: 'STOCK_OHLCV' }; rows: OHLCVRow[]; rawRows: Record<string, string | number | null>[] }
  | { schema: DetectedSchema & { dataType: 'PORTFOLIO' }; rows: PortfolioRow[]; rawRows: Record<string, string | number | null>[] }
  | { schema: DetectedSchema & { dataType: 'RETURNS' }; rows: ReturnsRow[]; rawRows: Record<string, string | number | null>[] }
  | { schema: DetectedSchema & { dataType: 'GENERIC' | 'FINANCIAL_STATEMENT' }; rows: Record<string, string | number | null>[]; rawRows: Record<string, string | number | null>[] }

function buildPayload(schema: DetectedSchema, rawRows: Record<string, string | number | null>[]): DashboardPayload {
  if (schema.dataType === 'STOCK_OHLCV') return { schema: schema as DetectedSchema & { dataType: 'STOCK_OHLCV' }, rows: toOHLCVRows(rawRows, schema), rawRows }
  if (schema.dataType === 'PORTFOLIO')   return { schema: schema as DetectedSchema & { dataType: 'PORTFOLIO' }, rows: toPortfolioRows(rawRows, schema), rawRows }
  if (schema.dataType === 'RETURNS')     return { schema: schema as DetectedSchema & { dataType: 'RETURNS' }, rows: toReturnsRows(rawRows, schema), rawRows }
  return { schema: schema as DetectedSchema & { dataType: 'GENERIC' | 'FINANCIAL_STATEMENT' }, rows: rawRows, rawRows }
}

// ── Design tokens — aligned to references/identity.yaml ──────────────────────
const P = {
  bg:        '#FAFAF9',   // identity.yaml surface
  surface:   '#F0EEE8',   // identity.yaml surface_muted
  surfaceHi: '#E7E3D8',
  border:    '#DDD9CE',   // identity.yaml line
  borderHi:  '#C9C4B8',
  fg:        '#1A1A1A',   // identity.yaml fg
  fgSub:     '#5C5C57',   // identity.yaml fg_muted
  fgDim:     '#EBE7DC',
  // Single accent — navy blue per identity.yaml
  accent:    '#1B4FCC',   // identity.yaml accent_color
  accentLo:  'rgba(27,79,204,0.08)',
  // Metric highlights only — not a second accent
  gold:      '#9A6F1A',
  pos:       '#0A7A45',
  neg:       '#C42B35',
}
const SANS = "'Inter', 'Noto Sans KR', system-ui, sans-serif"
const MONO = "'JetBrains Mono', monospace"

// ── Pre-computed ──────────────────────────────────────────────────────────────
const DEMO_METRICS = calculateAllMetrics(DEMO_STOCK_DATA)
const MINI_DATA    = DEMO_STOCK_DATA.slice(-120).map((r, i) => ({ i, p: r.close }))
const SHOW = {
  sharpe:  Math.abs(DEMO_METRICS.sharpeRatio ?? 1.24).toFixed(2),
  mdd:     Math.abs(DEMO_METRICS.mdd ?? 12.4).toFixed(1),
  vol:     (DEMO_METRICS.volatility ?? 18.3).toFixed(1),
  rsi:     (DEMO_METRICS.rsi14 ?? 58).toFixed(0),
  sortino: Math.abs(DEMO_METRICS.sortinoRatio ?? 1.87).toFixed(2),
  latest:  DEMO_STOCK_DATA[DEMO_STOCK_DATA.length - 1]?.close.toLocaleString('ko-KR') ?? '–',
}

// ── Ticker ────────────────────────────────────────────────────────────────────
const TICKERS = [
  { n: 'KOSPI',   v: '2,847.34', d: '+1.24%', up: true  },
  { n: 'USD/KRW', v: '1,342.50', d: '−0.08%', up: false },
  { n: 'NASDAQ',  v: '18,234',   d: '+0.83%', up: true  },
  { n: 'S&P 500', v: '5,892',    d: '+0.61%', up: true  },
  { n: 'GOLD',    v: '2,044.30', d: '−0.22%', up: false },
  { n: 'WTI',     v: '78.14',    d: '+0.44%', up: true  },
  { n: 'BTC',     v: '67,420',   d: '+2.14%', up: true  },
  { n: 'ETH',     v: '3,521',    d: '+1.58%', up: true  },
]

function TickerBar() {
  const items = [...TICKERS, ...TICKERS]
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '28px', background: 'rgba(250,250,249,0.98)',
      borderBottom: `1px solid ${P.border}`,
      display: 'flex', overflow: 'hidden', alignItems: 'center',
    }}>
      <div className="ticker-track" style={{ display: 'flex', flexShrink: 0 }}>
        {items.map((t, i) => (
          <div key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0 22px', borderRight: `1px solid ${P.border}`,
            height: '28px', flexShrink: 0,
          }}>
            <span style={{ fontFamily: MONO, fontSize: '0.52rem', color: P.fgSub, letterSpacing: '0.06em' }}>{t.n}</span>
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: P.fg, fontWeight: 500 }}>{t.v}</span>
            <span style={{ fontFamily: MONO, fontSize: '0.56rem', color: t.up ? P.pos : P.neg, fontWeight: 600 }}>{t.d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ onUpload }: { onUpload: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav style={{
      position: 'fixed', top: '28px', left: 0, right: 0, zIndex: 99,
      height: '56px', display: 'flex', alignItems: 'center',
      background: scrolled ? 'rgba(250,250,249,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: `1px solid ${scrolled ? P.border : 'transparent'}`,
      transition: 'all 0.3s',
    }}>
      <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto', padding: '0 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', background: P.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontFamily: MONO, fontWeight: 700, color: '#fff',
          }}>ID</div>
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.18em', color: P.fg }}>INVESTDASH</span>
        </div>
        <div style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>
          {[['차트', 'live-charts'], ['사용 방법', 'how'], ['데모', 'demo']].map(([label, id]) => (
            <button key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontFamily: SANS, fontSize: '0.82rem', fontWeight: 400, color: P.fgSub, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = P.fg }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = P.fgSub }}
            >{label}</button>
          ))}
          <button onClick={onUpload} style={{
            fontFamily: SANS, fontSize: '0.82rem', fontWeight: 600,
            color: '#fff', background: P.accent,
            border: 'none', padding: '9px 22px',
            cursor: 'pointer', transition: 'background 0.2s',
            borderRadius: '6px',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = P.accent }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = P.accent }}
          >CSV 업로드</button>
        </div>
      </div>
    </nav>
  )
}

// ── Hero — centered headline + bento product grid ────────────────────────────
function HeroSection({ onScrollToDemo }: { onScrollToDemo: () => void }) {
  const BENTO_METRICS = [
    { l: 'SHARPE RATIO', v: SHOW.sharpe,     c: P.accent },
    { l: 'MDD',          v: `−${SHOW.mdd}%`, c: P.neg    },
    { l: 'RSI (14)',     v: SHOW.rsi,         c: P.fg     },
    { l: 'VOLATILITY',  v: `${SHOW.vol}%`,   c: P.fgSub  },
  ]
  return (
    <section style={{
      background: P.bg,
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      paddingTop: '84px', position: 'relative', overflow: 'hidden',
    }}>
      {/* chart-grid background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(27,79,204,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,204,0.05) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
      {/* top-left accent glow — anchors the headline */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '720px', height: '500px', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at top left, rgba(27,79,204,0.08) 0%, transparent 65%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '36px 48px 64px' }}>

        {/* ── left-flush top text ── */}
        <div style={{ marginBottom: '36px' }}>
          {/* eyebrow badge */}
          <div style={{
            display: 'flex', width: 'fit-content', alignItems: 'center', gap: '8px',
            border: `1px solid rgba(0,0,0,0.1)`,
            borderRadius: '4px', padding: '5px 14px',
            marginBottom: '24px', background: 'rgba(0,0,0,0.02)',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: P.pos }} />
            <span style={{ fontFamily: MONO, fontSize: '0.62rem', color: P.fgSub, letterSpacing: '0.06em' }}>
              무료 오픈 베타 · OHLCV · 포트폴리오 · 수익률 분석
            </span>
          </div>

          {/* headline — 2-line stack, left-flush */}
          <h1 style={{
            fontFamily: SANS, fontWeight: 900,
            fontSize: 'clamp(3rem, 5.6vw, 6rem)',
            color: P.fg, lineHeight: 1.0,
            letterSpacing: '-0.055em', margin: '0 0 20px',
            wordBreak: 'keep-all', maxWidth: '14ch',
          }}>
            주가 분석,<br />
            <span style={{ color: P.accent }}>지금 시작하세요.</span>
          </h1>

          {/* sub */}
          <p style={{
            fontFamily: SANS, fontSize: '1.08rem', fontWeight: 400,
            color: P.fgSub, lineHeight: 1.5,
            margin: '0 0 32px', maxWidth: '52ch',
          }}>
            OHLCV CSV 업로드 하나로 캔들스틱 · RSI · MDD · Sharpe Ratio를 즉시 확인하세요.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={onScrollToDemo} style={{
              fontFamily: SANS, fontWeight: 600, fontSize: '0.95rem',
              padding: '13px 32px', background: P.accent, color: '#fff',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.82' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            >지금 분석하기</button>
            <button onClick={() => document.getElementById('live-charts')?.scrollIntoView({ behavior: 'smooth' })} style={{
              fontFamily: SANS, fontWeight: 400, fontSize: '0.95rem',
              padding: '13px 22px', background: 'rgba(0,0,0,0.03)',
              color: P.fgSub, border: `1px solid rgba(0,0,0,0.12)`,
              borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = P.fg; el.style.borderColor = 'rgba(0,0,0,0.3)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = P.fgSub; el.style.borderColor = 'rgba(0,0,0,0.12)' }}
            >차트 미리보기 →</button>
          </div>
        </div>

        {/* ── bento grid ── */}
        <div style={{ position: 'relative' }}>
        {/* scroll-invite fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: `linear-gradient(to bottom, transparent 0%, ${P.bg} 100%)`, zIndex: 2, pointerEvents: 'none' }} />
        {/* scroll indicator */}
        <div style={{ position: 'absolute', bottom: '-32px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontFamily: MONO, fontSize: '0.44rem', color: P.fgSub, letterSpacing: '0.1em' }}>SCROLL</span>
          <div className="scroll-bounce" style={{ width: '1px', height: '20px', background: `linear-gradient(to bottom, ${P.fgSub}, transparent)` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr auto', gap: '12px', height: '400px' }}>

          {/* CELL A — main chart preview (spans 2 rows) */}
          <div style={{
            gridRow: '1 / 3',
            background: '#FFFFFF', border: `1px solid ${P.border}`,
            borderRadius: '10px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* browser chrome */}
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: '8px', background: P.surface }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                {['#FF5F57','#FFBD2E','#28C840'].map(c => <div key={c} style={{ width: '9px', height: '9px', borderRadius: '50%', background: c, opacity: 0.75 }} />)}
              </div>
              <div style={{ flex: 1, height: '20px', background: P.border, borderRadius: '3px', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '6px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: P.pos }} />
                <span style={{ fontFamily: MONO, fontSize: '0.48rem', color: P.fgSub }}>investdash.app/dashboard</span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: '0.44rem', color: P.fgSub }}>삼성전자 · 504 rows</span>
            </div>
            {/* chart content */}
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: '0.44rem', color: P.fgSub, letterSpacing: '0.1em', marginBottom: '4px' }}>CLOSE PRICE</div>
                  <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: '1.8rem', color: P.fg, letterSpacing: '-0.03em', lineHeight: 1 }}>{SHOW.latest}<span style={{ fontSize: '0.85rem', color: P.fgSub, fontWeight: 400 }}> ₩</span></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15,184,106,0.1)', border: '1px solid rgba(15,184,106,0.2)', padding: '6px 12px', borderRadius: '4px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: P.pos }} />
                  <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: '0.6rem', color: P.pos }}>+1.24% 오늘</span>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: '120px', marginBottom: '14px', background: P.fgDim, borderRadius: '6px', overflow: 'hidden' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MINI_DATA} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bentoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={P.accent} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={P.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={['auto','auto']} hide />
                    <Area type="monotone" dataKey="p" stroke={P.accent} strokeWidth={2} fill="url(#bentoGrad)" dot={false} animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                {BENTO_METRICS.map(m => (
                  <div key={m.l} style={{ background: P.fgDim, borderRadius: '6px', padding: '11px 10px', border: `1px solid ${P.border}` }}>
                    <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: '1rem', color: m.c, lineHeight: 1 }}>{m.v}</div>
                    <div style={{ fontFamily: MONO, fontSize: '0.4rem', color: P.fgSub, letterSpacing: '0.08em', marginTop: '5px' }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CELL B — upload CTA */}
          <div style={{
            background: P.accent, borderRadius: '10px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            overflow: 'hidden', position: 'relative',
          }}>
            {/* subtle inner glow top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', background: 'radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ padding: '28px 28px 0', position: 'relative', zIndex: 1 }}>
              {/* upload icon */}
              <div style={{ marginBottom: '16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ fontFamily: MONO, fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', marginBottom: '10px' }}>UPLOAD CSV</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: '1.45rem', color: '#fff', lineHeight: 1.2, letterSpacing: '-0.025em' }}>드래그하면<br />바로 분석</div>
            </div>
            <div style={{ padding: '0 28px 28px', position: 'relative', zIndex: 1 }}>
              <button onClick={onScrollToDemo} style={{
                fontFamily: SANS, fontWeight: 600, fontSize: '0.88rem',
                padding: '11px 0', background: 'rgba(0,0,0,0.25)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer', width: '100%',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.25)' }}
              >시작하기 →</button>
            </div>
          </div>

          {/* CELL C — stats */}
          <div style={{
            background: P.surface, border: `1px solid ${P.border}`,
            borderRadius: '10px', padding: '20px 24px',
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: '0', alignItems: 'center',
          }}>
            {[
              { val: '504', unit: '일', label: '거래 데이터' },
              { val: '7',   unit: '+',  label: '자동 지표' },
              { val: '무료', unit: '',  label: '완전 무료' },
            ].map((s, i) => (
              <div key={s.label} style={{ textAlign: 'center', borderRight: i < 2 ? `1px solid ${P.border}` : 'none', padding: '0 8px' }}>
                <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: '1.5rem', color: P.fg, lineHeight: 1, letterSpacing: '-0.04em' }}>
                  {s.val}<span style={{ fontSize: '0.9rem', color: P.fgSub, fontWeight: 400 }}>{s.unit}</span>
                </div>
                <div style={{ fontFamily: SANS, fontSize: '0.7rem', color: P.fgSub, marginTop: '6px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}

// ── Live Charts ───────────────────────────────────────────────────────────────
function LiveChartsSection() {
  return (
    <section id="live-charts" style={{ background: P.bg, borderTop: `1px solid ${P.border}` }}>
      <div style={{ borderBottom: `1px solid ${P.border}` }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '16px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '2px', height: '14px', background: P.accent }} />
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: P.fg, letterSpacing: '0.1em', fontWeight: 600 }}>LIVE PREVIEW</span>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: P.pos }} className="gold-pulse" />
            <span style={{ fontFamily: MONO, fontSize: '0.56rem', color: P.fgSub }}>실제 컴포넌트 · 데모 데이터</span>
          </div>
          <span style={{ fontFamily: MONO, fontSize: '0.54rem', color: P.fgSub }}>삼성전자 GBM 시뮬레이션 · 504 rows</span>
        </div>
      </div>
      <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 56px' }}>
        <div style={{ borderBottom: `1px solid ${P.border}`, paddingTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontFamily: MONO, fontSize: '0.52rem', color: P.fgSub, letterSpacing: '0.1em' }}>CANDLESTICK</span>
            <div style={{ height: '1px', flex: 1, background: P.border }} />
            <span style={{ fontFamily: MONO, fontSize: '0.52rem', color: P.fgSub }}>MA20 · MA50 · BOLLINGER</span>
          </div>
          <CandlestickChart data={DEMO_STOCK_DATA} metrics={DEMO_METRICS} height={300} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', borderBottom: `1px solid ${P.border}` }}>
          <div style={{ borderRight: `1px solid ${P.border}`, paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontFamily: MONO, fontSize: '0.52rem', color: P.fgSub, letterSpacing: '0.1em' }}>RSI(14)</span>
              <div style={{ height: '1px', flex: 1, background: P.border }} />
              <span style={{ fontFamily: MONO, fontSize: '0.52rem', color: P.fgSub }}>과매수 70 · 과매도 30</span>
            </div>
            <RSIChart data={DEMO_STOCK_DATA} rsiSeries={DEMO_METRICS.rsiSeries} height={160} />
          </div>
          <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: '0.52rem', color: P.fgSub, letterSpacing: '0.12em', marginBottom: '20px', textTransform: 'uppercase' }}>자동 계산 지표</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px' }}>
              {[
                { l: 'SHARPE',     v: SHOW.sharpe,   c: P.accent },
                { l: 'SORTINO',    v: SHOW.sortino,  c: P.accent },
                { l: 'MDD',        v: `−${SHOW.mdd}%`, c: P.neg    },
                { l: 'VOLATILITY', v: `${SHOW.vol}%`, c: P.fgSub   },
                { l: 'RSI(14)',    v: SHOW.rsi,       c: P.fg       },
                { l: 'MA20',       v: (DEMO_METRICS.ma20 ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 }), c: P.fg },
              ].map(m => (
                <div key={m.l}>
                  <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: '1.2rem', color: m.c, lineHeight: 1 }}>{m.v}</div>
                  <div style={{ fontFamily: MONO, fontSize: '0.46rem', color: P.fgSub, letterSpacing: '0.12em', marginTop: '4px', textTransform: 'uppercase' }}>{m.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowSection() {
  const STEPS = [
    {
      n: '01', tag: 'UPLOAD', t: 'CSV 업로드',
      d: '주가 OHLCV, 포트폴리오, 수익률 — 어떤 형식이든 드래그합니다.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 16V8M8 12l4-5 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" strokeOpacity={0.4} />
        </svg>
      ),
    },
    {
      n: '02', tag: 'DETECT', t: '스키마 자동 감지',
      d: '컬럼명을 분석해 데이터 타입을 자동으로 분류합니다.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" strokeOpacity={0.4} />
        </svg>
      ),
    },
    {
      n: '03', tag: 'RENDER', t: '대시보드 즉시 생성',
      d: '캔들스틱, RSI, 낙폭 차트와 인사이트가 즉시 렌더링됩니다.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 17l5-6 3 3 3-4 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" strokeOpacity={0.4} />
        </svg>
      ),
    },
  ]

  return (
    <section id="how" style={{ background: P.surface, borderTop: `1px solid ${P.border}`, overflow: 'hidden', position: 'relative' }}>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '100px 56px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '72px', borderBottom: `1px solid ${P.border}`, paddingBottom: '28px' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: '0.52rem', color: P.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>How it works</div>
            <h2 style={{ fontFamily: SANS, fontWeight: 900, fontSize: 'clamp(2.2rem, 3.8vw, 3.6rem)', color: P.fg, lineHeight: 1, margin: 0, letterSpacing: '-0.04em', wordBreak: 'keep-all' }}>
              세 단계.<br />
              <span style={{ color: P.accent }}>그게 전부입니다.</span>
            </h2>
          </div>
          <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: '0.9rem', color: P.fgSub, lineHeight: 1.9, margin: 0, maxWidth: '26ch', textAlign: 'right', wordBreak: 'keep-all' }}>
            설정 없음. API 키 없음.<br />CSV 업로드 하나면 충분합니다.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '1px', background: P.border, borderRadius: '12px', overflow: 'hidden' }}>
          {STEPS.map((s, i) => (
            <div key={s.n}
              style={{ background: P.surface, padding: '48px 40px', position: 'relative', overflow: 'hidden', transition: 'background 0.2s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = P.surfaceHi }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = P.surface }}
            >
              <div style={{ position: 'absolute', bottom: '-10px', right: '16px', fontFamily: MONO, fontWeight: 900, fontSize: '5.5rem', color: P.border, lineHeight: 1, letterSpacing: '-0.06em', userSelect: 'none' }}>{s.n}</div>
              <div style={{ color: P.accent, marginBottom: '24px' }}>{s.icon}</div>
              <div style={{ fontFamily: MONO, fontSize: '0.46rem', color: P.fgSub, letterSpacing: '0.18em', marginBottom: '14px' }}>{s.tag}</div>
              <h3 style={{ fontFamily: SANS, fontWeight: 800, fontSize: '1.2rem', color: P.fg, margin: '0 0 12px', letterSpacing: '-0.02em' }}>{s.t}</h3>
              <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: '0.88rem', color: P.fgSub, lineHeight: 1.9, margin: 0 }}>{s.d}</p>
              {i < 2 && (
                <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', fontFamily: MONO, fontSize: '0.8rem', color: P.borderHi, zIndex: 2 }}>›</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Architecture ──────────────────────────────────────────────────────────────
function ArchSection() {
  const SKILLS = [
    { idx: '01', file: 'data-schema.md',       title: '스키마 감지',  desc: '컬럼 패턴 → 5종 데이터 타입 자동 분류' },
    { idx: '02', file: 'visualization.md',      title: '시각화 선택',  desc: '타입별 차트 렌더링 조건-행동 규칙' },
    { idx: '03', file: 'indicators.md',         title: '지표 계산',    desc: 'RSI · Sharpe · MDD · CAGR 공식 정의' },
    { idx: '04', file: 'insight-generation.md', title: 'AI 인사이트',  desc: 'Claude 시스템 프롬프트 + 규칙 기반 폴백' },
    { idx: '05', file: 'dashboard-layout.md',   title: '레이아웃',     desc: 'F-Pattern · KPI · 반응형 그리드 명세' },
  ]
  return (
    <section id="arch" style={{ background: P.bg, borderTop: `1px solid ${P.border}` }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '100px 56px' }}>
        <div style={{ fontFamily: MONO, fontSize: '0.52rem', color: P.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '44px' }}>Architecture</div>
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${P.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '44px 220px 160px 1fr', padding: '10px 20px', background: P.surfaceHi, borderBottom: `1px solid ${P.border}` }}>
            {['#', 'FILE', 'MODULE', 'DESCRIPTION'].map(h => (
              <span key={h} style={{ fontFamily: MONO, fontSize: '0.48rem', color: P.fgSub, letterSpacing: '0.1em' }}>{h}</span>
            ))}
          </div>
          {SKILLS.map((s, i) => (
            <div key={s.file}
              style={{ display: 'grid', gridTemplateColumns: '44px 220px 160px 1fr', padding: '18px 20px', borderBottom: i < SKILLS.length - 1 ? `1px solid ${P.border}` : 'none', background: P.bg, transition: 'background 0.15s', borderLeft: '2px solid transparent', cursor: 'default' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = P.surface; el.style.borderLeftColor = P.accent }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = P.bg; el.style.borderLeftColor = 'transparent' }}
            >
              <span style={{ fontFamily: MONO, fontSize: '0.58rem', color: P.fgSub }}>{s.idx}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: P.pos }}>{s.file}</span>
              <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: '0.84rem', color: P.fg }}>{s.title}</span>
              <span style={{ fontFamily: SANS, fontWeight: 300, fontSize: '0.84rem', color: P.fgSub, lineHeight: 1.6 }}>{s.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginTop: '24px' }}>
          {[
            { to: 504, label: 'TRADING DAYS', sub: '2년치 주가 데이터' },
            { to: 7,   label: 'INDICATORS',   sub: 'RSI · Sharpe · MDD · CAGR ...' },
            { to: 3,   label: 'DATA TYPES',   sub: 'OHLCV · Portfolio · Returns' },
          ].map(s => (
            <div key={s.label} style={{
              background: P.surface, padding: '28px',
              borderRadius: '10px', border: `1px solid ${P.border}`,
              borderTop: `2px solid ${P.accent}`,
            }}>
              <div style={{ fontFamily: MONO, fontWeight: 900, fontSize: '2.8rem', color: P.fg, lineHeight: 1, letterSpacing: '-0.04em' }}>
                <CountUp to={s.to} duration={2} delay={0.4} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: '0.5rem', color: P.accent, letterSpacing: '0.14em', marginTop: '10px', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontFamily: MONO, fontSize: '0.46rem', color: P.fgSub, marginTop: '4px' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Demo section ──────────────────────────────────────────────────────────────
function DemoSection({ onDemo, onFile }: { onDemo: (t: 'stock' | 'portfolio' | 'returns') => void; onFile: (f: File) => void }) {
  const DEMOS = [
    { type: 'stock' as const,     label: 'STOCK_OHLCV', title: '주가 OHLCV',     sub: '삼성전자 2년 GBM 시뮬레이션', meta: 'Candlestick · MA20/50 · Bollinger · RSI · MDD', stat: '504 rows' },
    { type: 'portfolio' as const, label: 'PORTFOLIO',   title: '포트폴리오',      sub: 'KOSPI 상위 12개 종목',        meta: 'Treemap · 가중 수익률 · 종목별 수익률 Bar',      stat: '12 assets' },
    { type: 'returns' as const,   label: 'RETURNS',     title: '수익률 시계열',   sub: '3년 일간 수익률 데이터',       meta: 'Cumulative Return · Drawdown · Sharpe',          stat: '756 rows' },
  ]
  return (
    <section id="demo" style={{ background: P.surface, borderTop: `1px solid ${P.border}` }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '100px 56px' }}>
        <div style={{ fontFamily: MONO, fontSize: '0.52rem', color: P.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '44px' }}>Try it now</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '16px' }}>
          {DEMOS.map(d => (
            <SpotlightCard key={d.type} spotlightColor="rgba(59,110,232,0.06)" style={{ background: P.bg, borderRadius: '12px', border: `1px solid ${P.border}` }}>
              <button onClick={() => onDemo(d.type)} style={{
                width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                padding: '32px 28px', display: 'flex', flexDirection: 'column',
                borderTop: `2px solid transparent`, borderRadius: '12px',
                transition: 'border-top-color 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderTopColor = P.accent }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderTopColor = 'transparent' }}
              >
                <div style={{ fontFamily: MONO, fontSize: '0.5rem', color: P.fgSub, letterSpacing: '0.14em', marginBottom: '16px' }}>{d.label}</div>
                <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: '1.3rem', color: P.fg, letterSpacing: '-0.025em', marginBottom: '8px' }}>{d.title}</div>
                <div style={{ fontFamily: SANS, fontWeight: 300, fontSize: '0.85rem', color: P.fgSub, marginBottom: '20px' }}>{d.sub}</div>
                <div style={{ height: '1px', background: P.border, marginBottom: '20px' }} />
                <div style={{ fontFamily: MONO, fontSize: '0.52rem', color: P.fgSub, lineHeight: 2, flexGrow: 1 }}>{d.meta}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '28px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '0.54rem', color: P.fgSub }}>{d.stat}</span>
                  <span style={{ fontFamily: MONO, fontSize: '0.62rem', color: P.accent, fontWeight: 600 }}>→</span>
                </div>
              </button>
            </SpotlightCard>
          ))}
        </div>
        <div style={{ background: P.bg, padding: '48px', border: `1px solid ${P.border}`, textAlign: 'center', borderRadius: '12px' }}>
          <div style={{ fontFamily: MONO, fontSize: '0.56rem', color: P.fgSub, letterSpacing: '0.12em', marginBottom: '24px', textTransform: 'uppercase' }}>직접 데이터 업로드</div>
          <UploadZone onFile={onFile} />
        </div>
      </div>
    </section>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useState<AppState>('landing')
  const [payload,  setPayload]  = useState<DashboardPayload | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const uploadRef = useRef<HTMLElement>(null)

  const handleFile = useCallback((file: File) => {
    setParseError(null); setAppState('loading')
    Papa.parse<Record<string, string>>(file, {
      header: true, dynamicTyping: true, skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? []
        const rawRows = result.data as Record<string, string | number | null>[]
        if (!rawRows.length) { setParseError('파일에 데이터가 없습니다.'); setAppState('landing'); return }
        setPayload(buildPayload(detectSchema(headers, rawRows), rawRows))
        setAppState('dashboard')
      },
      error: (err) => { setParseError('파싱 오류: ' + err.message); setAppState('landing') },
    })
  }, [])

  const loadDemo = useCallback((type: 'stock' | 'portfolio' | 'returns') => {
    if (type === 'stock')
      setPayload({ schema: DEMO_STOCK_SCHEMA as DetectedSchema & { dataType: 'STOCK_OHLCV' }, rows: DEMO_STOCK_DATA, rawRows: DEMO_STOCK_DATA as unknown as Record<string, string | number | null>[] })
    else if (type === 'portfolio')
      setPayload({ schema: DEMO_PORTFOLIO_SCHEMA as DetectedSchema & { dataType: 'PORTFOLIO' }, rows: DEMO_PORTFOLIO_DATA, rawRows: DEMO_PORTFOLIO_DATA as unknown as Record<string, string | number | null>[] })
    else
      setPayload({ schema: DEMO_RETURNS_SCHEMA as DetectedSchema & { dataType: 'RETURNS' }, rows: DEMO_RETURNS_DATA, rawRows: DEMO_RETURNS_DATA as unknown as Record<string, string | number | null>[] })
    setAppState('dashboard')
  }, [])

  const handleReset    = useCallback(() => { setAppState('landing'); setPayload(null); setParseError(null) }, [])
  const scrollToDemo   = useCallback(() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }), [])
  const scrollToUpload = useCallback(() => uploadRef.current?.scrollIntoView({ behavior: 'smooth' }), [])

  if (appState === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: '0.6rem', color: P.accent, letterSpacing: '0.12em', marginBottom: '14px' }}>
          분석 중<span className="blink-cursor" style={{ color: P.accent }}>▋</span>
        </div>
        <div style={{ width: '160px', height: '2px', background: P.border, margin: '0 auto', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: P.accent, width: '60%', borderRadius: '2px' }} />
        </div>
      </div>
    </div>
  )

  if (appState === 'dashboard' && payload) return <DashboardShell data={payload} onReset={handleReset} />

  return (
    <div className="dashboard" style={{ background: P.bg }}>
      <TickerBar />
      <Navbar onUpload={scrollToUpload} />
      <HeroSection onScrollToDemo={scrollToDemo} />
      <LiveChartsSection />
      <HowSection />
      <ArchSection />
      <section ref={uploadRef} style={{ display: 'contents' }}>
        <DemoSection onDemo={loadDemo} onFile={handleFile} />
      </section>
      {parseError && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: P.neg, color: '#fff', padding: '10px 24px', fontFamily: MONO, fontSize: '0.6rem', zIndex: 999, borderRadius: '6px' }}>
          {parseError}
        </div>
      )}
      <footer style={{ background: P.bg, borderTop: `1px solid ${P.border}` }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '22px', height: '22px', background: P.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.48rem', fontFamily: MONO, fontWeight: 700, color: '#fff', borderRadius: '4px' }}>ID</div>
            <span style={{ fontFamily: MONO, fontSize: '0.68rem', color: P.fg, fontWeight: 700, letterSpacing: '0.16em' }}>INVESTDASH</span>
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 300, fontSize: '0.78rem', color: P.fgSub }}>모든 분석은 과거 데이터 기반이며 투자 권유가 아닙니다.</span>
        </div>
      </footer>
    </div>
  )
}
