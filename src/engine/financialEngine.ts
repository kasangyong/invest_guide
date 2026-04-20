// skills/indicators.md 를 코드로 구현
import type { OHLCVRow, FinancialMetrics, BollingerPoint, ReturnsRow, PortfolioRow, PortfolioMetrics } from '../types/financial'

const RF_ANNUAL = 0.035          // 연 3.5% 무위험 수익률
const RF_DAILY  = RF_ANNUAL / 252 // 일간 무위험 수익률
const TRADING_DAYS = 252

// ─── 기초 계산 ────────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const variance = arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

// ─── 이동평균 ─────────────────────────────────────────────────────────────

export function movingAverage(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null
    const slice = prices.slice(i - period + 1, i + 1)
    return mean(slice)
  })
}

// ─── EMA ─────────────────────────────────────────────────────────────────

export function ema(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(period - 1).fill(null)
  if (prices.length < period) return result

  const k = 2 / (period + 1)
  let prev = mean(prices.slice(0, period))
  result.push(prev)

  for (let i = period; i < prices.length; i++) {
    prev = prices[i] * k + prev * (1 - k)
    result.push(prev)
  }
  return result
}

// ─── RSI ─────────────────────────────────────────────────────────────────

export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(period).fill(null)
  if (closes.length <= period) return result

  const changes = closes.map((c, i) => (i === 0 ? 0 : c - closes[i - 1]))

  // 초기 평균 (단순평균)
  const firstChanges = changes.slice(1, period + 1)
  let avgGain = mean(firstChanges.filter((c) => c > 0).concat(firstChanges.filter((c) => c <= 0).map(() => 0)))
  let avgLoss = mean(firstChanges.filter((c) => c < 0).map((c) => Math.abs(c)).concat(firstChanges.filter((c) => c >= 0).map(() => 0)))

  avgGain = firstChanges.filter(c => c > 0).reduce((a, b) => a + b, 0) / period
  avgLoss = firstChanges.filter(c => c < 0).reduce((a, b) => a + Math.abs(b), 0) / period

  for (let i = period; i < closes.length; i++) {
    const change = changes[i]
    avgGain = (avgGain * (period - 1) + Math.max(0, change)) / period
    avgLoss = (avgLoss * (period - 1) + Math.abs(Math.min(0, change))) / period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    result.push(100 - 100 / (1 + rs))
  }
  return result
}

// ─── 볼린저 밴드 ──────────────────────────────────────────────────────────

export function bollingerBands(closes: number[], period = 20, multiplier = 2): BollingerPoint[] {
  const mas = movingAverage(closes, period)
  return closes.map((_, i) => {
    if (i < period - 1) return { upper: null, middle: null, lower: null }
    const slice = closes.slice(i - period + 1, i + 1)
    const middle = mas[i]!
    const std = stddev(slice)
    return {
      upper: middle + multiplier * std,
      middle,
      lower: middle - multiplier * std,
    }
  })
}

// ─── 일간 수익률 ──────────────────────────────────────────────────────────

export function dailyReturns(prices: number[]): number[] {
  return prices
    .slice(1)
    .map((p, i) => (p - prices[i]) / prices[i])
}

// ─── 샤프 비율 ────────────────────────────────────────────────────────────

export function sharpeRatio(returns: number[]): number | null {
  if (returns.length < 20) return null
  const excess = returns.map((r) => r - RF_DAILY)
  const m = mean(excess)
  const s = stddev(excess)
  if (s === 0) return null
  return (m / s) * Math.sqrt(TRADING_DAYS)
}

// ─── 소르티노 비율 ────────────────────────────────────────────────────────

export function sortinoRatio(returns: number[]): number | null {
  if (returns.length < 20) return null
  const m = mean(returns)
  const downside = returns.filter((r) => r < RF_DAILY)
  if (downside.length === 0) return null
  const downsideStd = Math.sqrt(
    downside.reduce((acc, r) => acc + (r - RF_DAILY) ** 2, 0) / downside.length,
  )
  if (downsideStd === 0) return null
  return ((m - RF_DAILY) / downsideStd) * Math.sqrt(TRADING_DAYS)
}

// ─── 최대 낙폭 ───────────────────────────────────────────────────────────

export function maxDrawdown(prices: number[]): number {
  let peak = prices[0]
  let mdd = 0
  for (const price of prices) {
    if (price > peak) peak = price
    const dd = (peak - price) / peak
    if (dd > mdd) mdd = dd
  }
  return -mdd * 100 // 음수 %
}

export function drawdownSeries(prices: number[]): number[] {
  let peak = prices[0]
  return prices.map((price) => {
    if (price > peak) peak = price
    return -((peak - price) / peak) * 100
  })
}

// ─── CAGR ─────────────────────────────────────────────────────────────────

export function calculateCAGR(
  startValue: number,
  endValue: number,
  tradingDays: number,
): number | null {
  const calendarDays = (tradingDays / 252) * 365.25
  if (calendarDays < 365) return null
  const years = calendarDays / 365.25
  return ((endValue / startValue) ** (1 / years) - 1) * 100
}

// ─── 누적 수익률 ─────────────────────────────────────────────────────────

export function cumulativeReturns(prices: number[]): number[] {
  const base = prices[0]
  return prices.map((p) => ((p - base) / base) * 100)
}

// ─── MACD ────────────────────────────────────────────────────────────────

export interface MACDPoint {
  macd: number | null
  signal: number | null
  histogram: number | null
}

export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDPoint[] {
  const ema12 = ema(closes, fastPeriod)
  const ema26 = ema(closes, slowPeriod)

  const macdLine: (number | null)[] = closes.map((_, i) => {
    const fast = ema12[i]
    const slow = ema26[i]
    if (fast == null || slow == null) return null
    return fast - slow
  })

  const macdValues = macdLine.filter((v): v is number => v !== null)
  const signalValues = ema(macdValues, signalPeriod)
  let signalIdx = 0

  return closes.map((_, i) => {
    const macd = macdLine[i]
    if (macd == null) return { macd: null, signal: null, histogram: null }
    const signal = signalValues[signalIdx] ?? null
    const histogram = signal != null ? macd - signal : null
    signalIdx++
    return { macd, signal, histogram }
  })
}

// ─── 변동성 ──────────────────────────────────────────────────────────────

export function annualizedVolatility(returns: number[]): number {
  return stddev(returns) * Math.sqrt(TRADING_DAYS) * 100
}

// ─── 종합 계산: OHLCV ────────────────────────────────────────────────────

export function calculateAllMetrics(data: OHLCVRow[]): FinancialMetrics {
  const closes = data.map((d) => d.close)
  const returns = dailyReturns(closes)

  const ma20Series = movingAverage(closes, 20)
  const ma50Series = movingAverage(closes, 50)
  const rsiSeries = calculateRSI(closes)
  const bollingerSeries = bollingerBands(closes)
  const cumRet = cumulativeReturns(closes)
  const ddSeries = drawdownSeries(closes)

  const last = closes.length - 1
  const first = closes[0]
  const lastClose = closes[last]

  return {
    totalReturn: ((lastClose - first) / first) * 100,
    cagr: calculateCAGR(first, lastClose, data.length),
    alpha: null, // 벤치마크 없을 때 null
    sharpeRatio: sharpeRatio(returns),
    sortinoRatio: sortinoRatio(returns),
    mdd: maxDrawdown(closes),
    volatility: annualizedVolatility(returns),
    ma20: ma20Series[last],
    ma50: ma50Series[last],
    ma200: movingAverage(closes, 200)[last],
    rsi14: rsiSeries[last],
    bollingerUpper: bollingerSeries[last].upper,
    bollingerLower: bollingerSeries[last].lower,
    bollingerMiddle: bollingerSeries[last].middle,
    ma20Series,
    ma50Series,
    rsiSeries,
    bollingerSeries,
    cumulativeReturns: cumRet,
    drawdownSeries: ddSeries,
  }
}

// ─── 종합 계산: 수익률 시계열 ────────────────────────────────────────────

export function calculateReturnsMetrics(data: ReturnsRow[]): FinancialMetrics {
  const returns = data.map((d) => d.return)
  const cumPrices = returns.reduce<number[]>((acc, r) => {
    const prev = acc[acc.length - 1] ?? 100
    acc.push(prev * (1 + r))
    return acc
  }, [])

  return {
    totalReturn: ((cumPrices[cumPrices.length - 1] - 100) / 100) * 100,
    cagr: calculateCAGR(100, cumPrices[cumPrices.length - 1], data.length),
    alpha: null,
    sharpeRatio: sharpeRatio(returns),
    sortinoRatio: sortinoRatio(returns),
    mdd: maxDrawdown(cumPrices),
    volatility: annualizedVolatility(returns),
    ma20: null,
    ma50: null,
    ma200: null,
    rsi14: null,
    bollingerUpper: null,
    bollingerLower: null,
    bollingerMiddle: null,
    ma20Series: [],
    ma50Series: [],
    rsiSeries: [],
    bollingerSeries: [],
    cumulativeReturns: cumulativeReturns(cumPrices),
    drawdownSeries: drawdownSeries(cumPrices),
  }
}

// ─── 포트폴리오 지표 ─────────────────────────────────────────────────────

export function calculatePortfolioMetrics(rows: PortfolioRow[]): PortfolioMetrics {
  if (rows.length === 0) {
    return {
      totalReturn: 0,
      sharpeRatio: null,
      sortinoRatio: null,
      mdd: 0,
      volatility: 0,
      assetCount: 0,
      topAsset: '-',
      worstAsset: '-',
      topConcentration: 0,
    }
  }

  const returnRates = rows.map((r) => r.returnRate ?? 0)
  const weights = rows.map((r) => r.weight / 100)
  const weightedReturn = returnRates.reduce((acc, r, i) => acc + r * (weights[i] ?? 0), 0)

  const sorted = [...rows].sort((a, b) => (b.returnRate ?? 0) - (a.returnRate ?? 0))
  const topAsset = sorted[0]?.ticker ?? '-'
  const worstAsset = sorted[sorted.length - 1]?.ticker ?? '-'

  const maxWeight = Math.max(...rows.map((r) => r.weight))

  return {
    totalReturn: weightedReturn,
    sharpeRatio: null,
    sortinoRatio: null,
    mdd: 0,
    volatility: 0,
    assetCount: rows.length,
    topAsset,
    worstAsset,
    topConcentration: maxWeight,
  }
}

// ─── 샤프비율 등급 ────────────────────────────────────────────────────────

export function sharpeGrade(sharpe: number): { label: string; color: string } {
  if (sharpe >= 2)   return { label: '매우 우수', color: '#4caf50' }
  if (sharpe >= 1)   return { label: '양호',     color: '#26a69a' }
  if (sharpe >= 0)   return { label: '보통',     color: '#ffa726' }
  return               { label: '위험 대비 수익 부족', color: '#ef5350' }
}

export function formatReturn(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}
