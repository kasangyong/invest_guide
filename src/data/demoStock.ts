import type { OHLCVRow, DetectedSchema } from '../types/financial'

// GBM(Geometric Brownian Motion) 기반 주가 시뮬레이션
function generateStockData(
  startPrice: number,
  days: number,
  startDateStr: string,
  drift = 0.0003,
  sigma = 0.016,
): OHLCVRow[] {
  const data: OHLCVRow[] = []
  let price = startPrice
  const date = new Date(startDateStr)

  // 시드 기반 재현 가능한 난수 (단순 LCG)
  let seed = 42
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const randNormal = () => {
    const u1 = rand()
    const u2 = rand()
    return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2)
  }

  for (let i = 0; i < days; i++) {
    // 다음 거래일 (주말 제외)
    date.setDate(date.getDate() + 1)
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1)
    }

    const z = randNormal()
    const change = price * (drift + sigma * z)
    price = Math.max(price + change, price * 0.7)

    const range = price * 0.025
    const high = price + rand() * range
    const low  = price - rand() * range
    const open = low + rand() * (high - low)
    const volume = Math.floor(10_000_000 + rand() * 25_000_000)

    data.push({
      date: date.toISOString().split('T')[0]!,
      open: Math.round(open),
      high: Math.round(high),
      low:  Math.round(low),
      close: Math.round(price),
      volume,
    })
  }
  return data
}

export const DEMO_STOCK_DATA: OHLCVRow[] = generateStockData(70_000, 504, '2024-01-01')

export const DEMO_STOCK_SCHEMA: DetectedSchema = {
  dataType: 'STOCK_OHLCV',
  columns: [
    { name: 'date',   inferredType: 'date',   sample: ['2024-01-02'], nullRatio: 0 },
    { name: 'open',   inferredType: 'number', sample: [70000],        nullRatio: 0 },
    { name: 'high',   inferredType: 'number', sample: [71500],        nullRatio: 0 },
    { name: 'low',    inferredType: 'number', sample: [69200],        nullRatio: 0 },
    { name: 'close',  inferredType: 'number', sample: [70800],        nullRatio: 0 },
    { name: 'volume', inferredType: 'number', sample: [18500000],     nullRatio: 0 },
  ],
  primaryKey: 'date',
  dateColumn: 'date',
  valueColumns: ['open', 'high', 'low', 'close', 'volume'],
  confidence: 0.97,
  warnings: [],
  rowCount: 504,
}
