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
        totalReturn: stockMetrics.totalReturn,
        cagr: stockMetrics.cagr,
        sharpeRatio: stockMetrics.sharpeRatio,
        sortinoRatio: stockMetrics.sortinoRatio,
        mdd: stockMetrics.mdd,
        volatility: stockMetrics.volatility,
        ma20: stockMetrics.ma20,
        ma50: stockMetrics.ma50,
        rsi14: stockMetrics.rsi14,
        bollingerUpper: stockMetrics.bollingerUpper,
        bollingerLower: stockMetrics.bollingerLower,
        bollingerMiddle: stockMetrics.bollingerMiddle,
      },
      summary: `${rawRows.length}개 거래일`,
    }
    if (returnsMetrics) return {
      dataType: 'RETURNS',
      metrics: {
        totalReturn: returnsMetrics.totalReturn,
        cagr: returnsMetrics.cagr,
        sharpeRatio: returnsMetrics.sharpeRatio,
        sortinoRatio: returnsMetrics.sortinoRatio,
        mdd: returnsMetrics.mdd,
        volatility: returnsMetrics.volatility,
      },
      summary: `${rawRows.length}개 수익률`,
    }
    if (portfolioMetrics) return {
      dataType: 'PORTFOLIO',
      metrics: {
        totalReturn: portfolioMetrics.totalReturn,
        sharpeRatio: portfolioMetrics.sharpeRatio,
        mdd: portfolioMetrics.mdd,
        topConcentration: portfolioMetrics.topConcentration,
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
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e] bg-[#0a0a0a] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onReset}
            className="text-sm font-semibold tracking-widest uppercase text-white hover:text-[#aaaaaa] transition-colors cursor-pointer"
          >InvestDash</button>
          <span className="text-xs text-[#555555]">{DATA_TYPE_LABEL[schema.dataType] ?? schema.dataType}</span>
          <span className="text-xs text-[#444444]">{schema.rowCount.toLocaleString()}행</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-[#888888] hover:text-white transition-colors px-3 py-1.5 border border-[#222222] hover:border-[#444444] rounded"
        >
          ← 새 파일 업로드
        </button>
      </header>

      <KPIBar dataType={schema.dataType} metrics={kpiMetrics} currentPrice={lastRow?.close} priceChange={priceChange} />

      <main className="flex-1 p-4 space-y-3">
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
      <div className="lg:col-span-3 bg-[#111111] border border-[#222222] p-10 flex flex-col items-center justify-center text-center">
        <p className="text-white font-medium mb-2">데이터가 로드되었습니다</p>
        <p className="text-[#555555] text-sm">STOCK_OHLCV, PORTFOLIO, RETURNS 형식을 업로드하면 전문 차트를 볼 수 있습니다.</p>
      </div>
      <div className="lg:col-span-2">
        <InsightPanel request={insightRequest} />
      </div>
    </div>
  )
}
