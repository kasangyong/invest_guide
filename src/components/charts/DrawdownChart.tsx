import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { OHLCVRow } from '../../types/financial'

interface Props { data: OHLCVRow[]; drawdownSeries: number[]; height?: number }
interface TPayload { value: number }
interface TProps { active?: boolean; label?: string; payload?: TPayload[] }

function Tip({ active, label, payload }: TProps) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div style={{ background: '#fff', border: '1px solid #DDD9CE', padding: '8px 12px', fontSize: '0.75rem' }}>
      <p style={{ color: '#5C5C57', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: '#1A1A1A' }}>{val.toFixed(2)}%</p>
    </div>
  )
}

export function DrawdownChart({ data, drawdownSeries, height = 130 }: Props) {
  const step = Math.max(1, Math.floor(data.length / 200))
  const chartData = data
    .filter((_, i) => i % step === 0)
    .map((d, i) => ({ date: d.date, drawdown: drawdownSeries[i * step] ?? 0 }))
  const minVal = Math.min(...chartData.map((d) => d.drawdown))

  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #DDD9CE', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #DDD9CE', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.75rem', color: '#5C5C57', textTransform: 'uppercase', letterSpacing: '0.05em' }}>낙폭</span>
        <span style={{ fontSize: '0.75rem', color: '#5C5C57' }}>MDD {minVal.toFixed(2)}%</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C42B35" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#C42B35" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EBE7DC" />
          <XAxis dataKey="date" tick={{ fill: '#5C5C57', fontSize: 10 }} tickFormatter={(v: string) => v.slice(0, 7)} />
          <YAxis domain={[Math.floor(minVal * 1.1), 0]} tick={{ fill: '#5C5C57', fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} width={38} />
          <Tooltip content={<Tip />} />
          <Area type="monotone" dataKey="drawdown" stroke="#C42B35" strokeOpacity={0.6} strokeWidth={1.5} fill="url(#ddGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
