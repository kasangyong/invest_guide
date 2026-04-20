import type { ReturnsRow, DetectedSchema } from '../types/financial'

function generateReturnsData(days: number, startDateStr: string, annualReturn = 0.12, annualVol = 0.18): ReturnsRow[] {
  const data: ReturnsRow[] = []
  const date = new Date(startDateStr)
  const dailyDrift = annualReturn / 252
  const dailySigma = annualVol / Math.sqrt(252)

  let seed = 77
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
    date.setDate(date.getDate() + 1)
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1)
    }

    const r = dailyDrift + dailySigma * randNormal()
    data.push({
      date: date.toISOString().split('T')[0]!,
      return: r,
    })
  }
  return data
}

export const DEMO_RETURNS_DATA: ReturnsRow[] = generateReturnsData(756, '2022-01-01')

export const DEMO_RETURNS_SCHEMA: DetectedSchema = {
  dataType: 'RETURNS',
  columns: [
    { name: 'date',   inferredType: 'date',   sample: ['2022-01-04'], nullRatio: 0 },
    { name: 'return', inferredType: 'number', sample: [0.0034],       nullRatio: 0 },
  ],
  primaryKey: 'date',
  dateColumn: 'date',
  valueColumns: ['return'],
  confidence: 0.90,
  warnings: [],
  rowCount: 756,
}
