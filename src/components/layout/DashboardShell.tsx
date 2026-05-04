import { useMemo } from 'react'
import { KPIBar } from './KPIBar'
import { InsightPanel } from '../widgets/InsightPanel'
import { DataTable } from '../widgets/DataTable'
import { CandlestickChart } from '../charts/CandlestickChart'
import { RSIChart } from '../charts/RSIChart'
import { ReturnsLineChart } from '../charts/ReturnsLineChart'
import { DrawdownChart } from '../charts/DrawdownChart'
import { PortfolioTreemap } from '../charts/PortfolioTreemap'
import { PortfolioBarChart } from '../charts/PortfolioBarChart'
import {
  calculateAllMetrics,
  calculateReturnsMetrics,
  calculatePortfolioMetrics,
} from '../../engine/financialEngine'
import type {
  DetectedSchema, OHLCVRow, PortfolioRow, ReturnsRow, InsightRequest,
} from '../../types/financial'

type DashboardProps =
  | { schema: DetectedSchema & { dataType: 'STOCK_OHLCV' }; rows: OHLCVRow[]; rawRows: Record<string, string | number | null>[] }
  | { schema: DetectedSchema & { dataType: 'PORTFOLIO' }; rows: PortfolioRow[]; rawRows: Record<string, string | number | null>[] }
  | { schema: DetectedSchema & { dataType: 'RETURNS' }; rows: ReturnsRow[]; rawRows: Record<string, string | number | null>[] }
  | { schema: DetectedSchema & { dataType: 'GENERIC' | 'FINANCIAL_STATEMENT' }; rows: Record<string, string | number | null>[]; rawRows: Record<string, string | number | null>[] }

interface ShellProps { data: DashboardProps; onReset: () => void }

const DATA_TYPE_LABEL: Record<string, string> = {
  STOCK_OHLCV: '주가 OHLCV',
  PORTFOLIO: '포트폴리오',
  RETURNS: '수익률 시계열',
  FINANCIAL_STATEMENT: '재무제표',
  GENERIC: '일반 데이터',
}

export function DashboardShell({ data, onReset }: ShellProps) {
  const { schema, rawRows } = data

  const stockMetrics = useMemo(() => {
    if (schema.dataType !== 'STOCK_OHLCV') return null
    return calculateAllMetrics(data.rows as OHLCVRow[])
  }, [schema.dataType, data.rows])

  const returnsMetrics = useMemo(() => {
    if (schema.dataType !== 'RETURNS') return null
    return calculateReturnsMetrics(data.rows as ReturnsRow[])
  }, [schema.dataType, data.rows])

  const portfolioMetrics = useMemo(() => {
    if (schema.dataType !== 'PORTFOLIO') return null
    return calculatePortfolioMetrics(data.rows as PortfolioRow[])
  }, [schema.dataType, data.rows])

  const insightRequest = useMemo((): InsightRequest => {
    if (stockMetrics) return {
      dataType: 'STOCK_OHLCV',
      metrics: {
        totalReturn: stockMetrics.totalReturn, cagr: stockMetrics.cagr,
        sharpeRatio: stockMetrics.sharpeRatio, sortinoRatio: stockMetrics.sortinoRatio,
        mdd: stockMetrics.mdd, volatility: stockMetrics.volatility,
        ma20: stockMetrics.ma20, ma50: stockMetrics.ma50, rsi14: stockMetrics.rsi14,
        bollingerUpper: stockMetrics.bollingerUpper, bollingerLower: stockMetrics.bollingerLower,
        bollingerMiddle: stockMetrics.bollingerMiddle,
      },
      summary: `${rawRows.length}개 거래일`,
    }
    if (returnsMetrics) return {
      dataType: 'RETURNS',
      metrics: {
        totalReturn: returnsMetrics.totalReturn, cagr: returnsMetrics.cagr,
        sharpeRatio: returnsMetrics.sharpeRatio, sortinoRatio: returnsMetrics.sortinoRatio,
        mdd: returnsMetrics.mdd, volatility: returnsMetrics.volatility,
      },
      summary: `${rawRows.length}개 수익률`,
    }
    if (portfolioMetrics) return {
      dataType: 'PORTFOLIO',
      metrics: {
        totalReturn: portfolioMetrics.totalReturn, sharpeRatio: portfolioMetrics.sharpeRatio,
        mdd: portfolioMetrics.mdd ?? undefined, topConcentration: portfolioMetrics.topConcentration,
        worstAsset: portfolioMetrics.worstAsset,
      },
      summary: `${portfolioMetrics.assetCount}개 종목`,
    }
    return { dataType: 'GENERIC', metrics: {}, summary: `${rawRows.length}행` }
  }, [stockMetrics, returnsMetrics, portfolioMetrics, rawRows.length])

  const stockRows = schema.dataType === 'STOCK_OHLCV' ? (data.rows as OHLCVRow[]) : null
  const lastRow = stockRows?.[stockRows.length - 1]
  const prevRow = stockRows?.[stockRows.length - 2]
  const priceChange = lastRow && prevRow ? ((lastRow.close - prevRow.close) / prevRow.close) * 100 : undefined
  const kpiMetrics = stockMetrics ?? returnsMetrics ?? portfolioMetrics
  const stockVolumes = useMemo(() => stockRows?.map((r) => r.volume), [stockRows])

  return (
    <div className="dashboard" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--c-bg)', color: 'var(--c-fg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--s-6)', height: '48px', borderBottom: '1px solid var(--c-line)', background: 'var(--c-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
          <button
            onClick={onReset}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--c-fg)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'opacity 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            INVESTDASH
          </button>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'var(--c-fg-muted)' }}>
            {DATA_TYPE_LABEL[schema.dataType] ?? schema.dataType}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'var(--c-line)' }}>
            {schema.rowCount.toLocaleString()}행
          </span>
        </div>
        <button
          onClick={onReset}
          style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: '0.75rem', color: 'var(--c-fg-muted)', background: 'none', border: '1px solid var(--c-line)', padding: '4px 12px', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'var(--c-fg-muted)'; el.style.color = 'var(--c-fg)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'var(--c-line)'; el.style.color = 'var(--c-fg-muted)' }}
        >
          ← 새 파일 업로드
        </button>
      </header>

      <KPIBar dataType={schema.dataType} metrics={kpiMetrics} currentPrice={lastRow?.close} priceChange={priceChange} />

      <main style={{ flex: 1, padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        {schema.dataType === 'STOCK_OHLCV' && stockMetrics && stockRows && (
          <StockLayout rows={stockRows} metrics={stockMetrics} insightRequest={insightRequest} volumes={stockVolumes} />
        )}
        {schema.dataType === 'PORTFOLIO' && (
          <PortfolioLayout rows={data.rows as PortfolioRow[]} insightRequest={insightRequest} />
        )}
        {schema.dataType === 'RETURNS' && returnsMetrics && (
          <ReturnsLayout rows={data.rows as ReturnsRow[]} metrics={returnsMetrics} insightRequest={insightRequest} />
        )}
        {(schema.dataType === 'GENERIC' || schema.dataType === 'FINANCIAL_STATEMENT') && (
          <GenericLayout insightRequest={insightRequest} />
        )}
        <DataTable headers={schema.columns.map((c) => c.name)} rows={rawRows} />
      </main>
    </div>
  )
}

function StockLayout({
  rows, metrics, insightRequest, volumes,
}: {
  rows: OHLCVRow[]
  metrics: ReturnType<typeof calculateAllMetrics>
  insightRequest: InsightRequest
  volumes?: number[]
}) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3">
          <CandlestickChart data={rows} metrics={metrics} height={360} />
        </div>
        <div className="lg:col-span-2">
          <InsightPanel request={insightRequest} volumes={volumes} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3">
          <RSIChart data={rows} rsiSeries={metrics.rsiSeries} height={200} />
        </div>
        <div className="lg:col-span-2">
          <ReturnsLineChart data={rows} cumulativeReturns={metrics.cumulativeReturns} height={200} />
        </div>
      </div>
      <DrawdownChart data={rows} drawdownSeries={metrics.drawdownSeries} height={180} />
    </>
  )
}

function PortfolioLayout({ rows, insightRequest }: { rows: PortfolioRow[]; insightRequest: InsightRequest }) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3">
          <PortfolioTreemap data={rows} height={300} />
        </div>
        <div className="lg:col-span-2">
          <InsightPanel request={insightRequest} />
        </div>
      </div>
      <PortfolioBarChart data={rows} height={260} />
    </>
  )
}

function ReturnsLayout({
  rows, metrics, insightRequest,
}: {
  rows: ReturnsRow[]
  metrics: ReturnType<typeof calculateReturnsMetrics>
  insightRequest: InsightRequest
}) {
  const syntheticRows: OHLCVRow[] = rows.map((r, i) => ({ date: r.date, open: i, high: i, low: i, close: i, volume: 0 }))
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3">
          <ReturnsLineChart data={syntheticRows} cumulativeReturns={metrics.cumulativeReturns} height={280} />
        </div>
        <div className="lg:col-span-2">
          <InsightPanel request={insightRequest} />
        </div>
      </div>
      <DrawdownChart data={syntheticRows} drawdownSeries={metrics.drawdownSeries} height={130} />
    </>
  )
}

function GenericLayout({ insightRequest }: { insightRequest: InsightRequest }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
      <div
        className="lg:col-span-3"
        style={{ background: 'var(--c-bg-muted)', border: '1px solid var(--c-line)', padding: 'var(--s-9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
      >
        <p style={{ fontWeight: 500, color: 'var(--c-fg)', marginBottom: 'var(--s-2)' }}>데이터가 로드되었습니다</p>
        <p style={{ fontSize: 'var(--t--1)', color: 'var(--c-fg-muted)' }}>STOCK_OHLCV, PORTFOLIO, RETURNS 형식을 업로드하면 전문 차트를 볼 수 있습니다.</p>
      </div>
      <div className="lg:col-span-2">
        <InsightPanel request={insightRequest} />
      </div>
    </div>
  )
}
