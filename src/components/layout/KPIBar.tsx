import { KPICard } from '../widgets/KPICard'
import { formatReturn } from '../../engine/financialEngine'
import type { FinancialMetrics, PortfolioMetrics, DataType } from '../../types/financial'

interface Props {
  dataType: DataType
  metrics: FinancialMetrics | PortfolioMetrics | null
  currentPrice?: number
  priceChange?: number
}

function fmtNum(v: number | null, digits = 2): string {
  if (v == null) return 'N/A'
  return v.toFixed(digits)
}

// 샤프/소르티노: >=1 teal, >=0 neutral, <0 red
function ratioColor(v: number | null): 'positive' | 'negative' | 'neutral' {
  if (v == null) return 'neutral'
  if (v >= 1) return 'positive'
  if (v < 0) return 'negative'
  return 'neutral'
}

// RSI: >70 red (과매수), <30 teal (과매도), else neutral
function rsiColor(v: number | null): 'positive' | 'negative' | 'neutral' {
  if (v == null) return 'neutral'
  if (v > 70) return 'negative'
  if (v < 30) return 'positive'
  return 'neutral'
}

export function KPIBar({ dataType, metrics, currentPrice, priceChange }: Props) {
  if (!metrics) return null

  if (dataType === 'STOCK_OHLCV') {
    const m = metrics as FinancialMetrics
    return (
      <div className="flex gap-px overflow-x-auto border-b border-[#222222]">
        {currentPrice != null && (
          <KPICard
            label="현재가"
            value={`${currentPrice.toLocaleString()}`}
            change={priceChange}
          />
        )}
        <KPICard label="전체 수익률" value={formatReturn(m.totalReturn)} colorType="auto" />
        <KPICard label="CAGR" value={m.cagr != null ? formatReturn(m.cagr) : 'N/A'} colorType="auto" />
        <KPICard label="샤프 비율" value={fmtNum(m.sharpeRatio)} colorType={ratioColor(m.sharpeRatio)} />
        <KPICard label="소르티노" value={fmtNum(m.sortinoRatio)} colorType={ratioColor(m.sortinoRatio)} />
        <KPICard
          label="최대 낙폭"
          value={`${fmtNum(m.mdd)}%`}
          colorType={m.mdd != null && m.mdd < -20 ? 'negative' : 'neutral'}
        />
        <KPICard
          label="변동성"
          value={`${fmtNum(m.volatility)}%`}
          colorType={m.volatility != null && m.volatility > 30 ? 'negative' : 'neutral'}
        />
        {m.rsi14 != null && (
          <KPICard label="RSI (14)" value={fmtNum(m.rsi14, 1)} colorType={rsiColor(m.rsi14)} />
        )}
      </div>
    )
  }

  if (dataType === 'PORTFOLIO') {
    const m = metrics as PortfolioMetrics
    return (
      <div className="flex gap-px overflow-x-auto border-b border-[#222222]">
        <KPICard label="가중 수익률" value={formatReturn(m.totalReturn)} colorType="auto" />
        <KPICard label="보유 종목" value={String(m.assetCount)} unit="개" />
        <KPICard label="최대 비중" value={`${m.topConcentration.toFixed(1)}%`} />
        <KPICard label="최고 성과" value={m.topAsset} colorType="positive" />
        <KPICard label="최저 성과" value={m.worstAsset} colorType="negative" />
      </div>
    )
  }

  if (dataType === 'RETURNS') {
    const m = metrics as FinancialMetrics
    return (
      <div className="flex gap-px overflow-x-auto border-b border-[#222222]">
        <KPICard label="전체 수익률" value={formatReturn(m.totalReturn)} colorType="auto" />
        <KPICard label="CAGR" value={m.cagr != null ? formatReturn(m.cagr) : 'N/A'} colorType="auto" />
        <KPICard label="샤프 비율" value={fmtNum(m.sharpeRatio)} colorType={ratioColor(m.sharpeRatio)} />
        <KPICard label="소르티노" value={fmtNum(m.sortinoRatio)} colorType={ratioColor(m.sortinoRatio)} />
        <KPICard
          label="최대 낙폭"
          value={`${fmtNum(m.mdd)}%`}
          colorType={m.mdd != null && m.mdd < -20 ? 'negative' : 'neutral'}
        />
        <KPICard label="변동성" value={`${fmtNum(m.volatility)}%`} />
      </div>
    )
  }

  return null
}
