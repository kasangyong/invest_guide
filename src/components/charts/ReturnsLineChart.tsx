import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import type { OHLCVRow } from '../../types/financial'

interface Props { data: OHLCVRow[]; cumulativeReturns: number[]; height?: number }
interface TPayload { value: number; name: string }
interface TProps { active?: boolean; label?: string; payload?: TPayload[] }

function Tip({ active, label, payload }: TProps) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div style={{ background: '#fff', border: '1px solid #DDD9CE', padding: '8px 12px', fontSize: '0.75rem' }}>
      <p style={{ color: '#5C5C57', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: val >= 0 ? '#0A7A45' : '#C42B35' }}>{val >= 0 ? '+' : ''}{val.toFixed(2)}%</p>
    </div>
  )
}

export function ReturnsLineChart({ data, cumulativeReturns, height = 240 }: Props) {
  const step = Math.max(1, Math.floor(data.length / 200))
  const chartData = data
    .filter((_, i) => i % step === 0)
    .map((d, i) => ({ date: d.date, cumReturn: cumulativeReturns[i * step] ?? 0 }))
  const maxVal = Math.max(...chartData.map(d => d.cumReturn))
  const minVal = Math.min(...chartData.map(d => d.cumReturn))
  const lastVal = chartData[chartData.length - 1]?.cumReturn ?? 0

  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #DDD9CE', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #DDD9CE', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.75rem', color: '#5C5C57', textTransform: 'uppercase', letterSpacing: '0.05em' }}>누적 수익률</span>
        <span style={{ fontSize: '0.75rem', color: lastVal >= 0 ? '#0A7A45' : '#C42B35' }}>{lastVal >= 0 ? '+' : ''}{lastVal.toFixed(2)}%</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1B4FCC" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#1B4FCC" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EBE7DC" />
          <XAxis dataKey="date" tick={{ fill: '#5C5C57', fontSize: 10 }} tickFormatter={(v: string) => v.slice(0, 7)} />
          <YAxis domain={[Math.floor(minVal * 1.1), Math.ceil(maxVal * 1.1)]} tick={{ fill: '#5C5C57', fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} width={42} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={0} stroke="#DDD9CE" strokeWidth={1} />
          <Area type="monotone" dataKey="cumReturn" stroke="#1B4FCC" strokeWidth={1.5} fill="url(#retGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
