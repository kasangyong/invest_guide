// skills/visualization.md 규칙을 컴포넌트로 구현 — 데이터 타입별 차트 자동 선택
import type {
  DetectedSchema,
  OHLCVRow,
  PortfolioRow,
  ReturnsRow,
  FinancialMetrics,
} from '../../types/financial'
import { CandlestickChart } from './CandlestickChart'
import { PortfolioTreemap } from './PortfolioTreemap'
import { ReturnsLineChart } from './ReturnsLineChart'

interface BaseProps {
  schema: DetectedSchema
  height?: number
}

interface StockFactoryProps extends BaseProps {
  schema: DetectedSchema & { dataType: 'STOCK_OHLCV' }
  data: OHLCVRow[]
  metrics: FinancialMetrics
}

interface PortfolioFactoryProps extends BaseProps {
  schema: DetectedSchema & { dataType: 'PORTFOLIO' }
  data: PortfolioRow[]
  metrics?: undefined
}

interface ReturnsFactoryProps extends BaseProps {
  schema: DetectedSchema & { dataType: 'RETURNS' }
  data: ReturnsRow[]
  metrics: FinancialMetrics
}

interface GenericFactoryProps extends BaseProps {
  schema: DetectedSchema & { dataType: 'GENERIC' | 'FINANCIAL_STATEMENT' }
  data: Record<string, string | number | null>[]
  metrics?: undefined
}

type ChartFactoryProps =
  | StockFactoryProps
  | PortfolioFactoryProps
  | ReturnsFactoryProps
  | GenericFactoryProps

export function ChartFactory(props: ChartFactoryProps) {
  if (props.schema.dataType === 'STOCK_OHLCV') {
    const p = props as StockFactoryProps
    return (
      <CandlestickChart
        data={p.data}
        metrics={p.metrics}
        height={p.height}
      />
    )
  }

  if (props.schema.dataType === 'PORTFOLIO') {
    const p = props as PortfolioFactoryProps
    return <PortfolioTreemap data={p.data} height={p.height} />
  }

  if (props.schema.dataType === 'RETURNS') {
    const p = props as ReturnsFactoryProps
    const syntheticRows: OHLCVRow[] = p.data.map((r, i) => ({
      date: r.date,
      open: i,
      high: i,
      low: i,
      close: i,
      volume: 0,
    }))
    return (
      <ReturnsLineChart
        data={syntheticRows}
        cumulativeReturns={p.metrics.cumulativeReturns}
        height={p.height}
      />
    )
  }

  return (
    <div className="bg-[#1a1d27] border border-[#2d3142] rounded-xl p-8 flex flex-col items-center justify-center">
      <div className="text-4xl mb-3">📊</div>
      <p className="text-gray-300 text-sm">데이터가 로드되었습니다.</p>
      <p className="text-gray-500 text-xs mt-1">
        STOCK_OHLCV, PORTFOLIO, RETURNS 형식으로 업로드하면 전문 차트를 확인하실 수 있습니다.
      </p>
    </div>
  )
}
