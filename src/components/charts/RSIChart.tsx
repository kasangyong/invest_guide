import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import type { OHLCVRow } from '../../types/financial'

interface Props { data: OHLCVRow[]; rsiSeries: (number | null)[]; height?: number }
interface TPayload { value: number; name: string; color: string }
interface TProps { active?: boolean; label?: string; payload?: TPayload[] }

function Tip({ active, label, payload }: TProps) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  const color = val != null ? (val > 70 ? '#C42B35' : val < 30 ? '#0A7A45' : '#1A1A1A') : '#1A1A1A'
  return (
    <div style={{ background: '#fff', border: '1px solid #DDD9CE', padding: '8px 12px', fontSize: '0.75rem' }}>
      <p style={{ color: '#5C5C57', marginBottom: '4px' }}>{label}</p>
      {val != null && <p style={{ color }}>RSI {val.toFixed(1)}</p>}
    </div>
  )
}

export function RSIChart({ data, rsiSeries, height = 150 }: Props) {
  const chartData = data
    .map((d, i) => ({ date: d.date, rsi: rsiSeries[i] ?? null }))
    .filter((d): d is { date: string; rsi: number } => d.rsi != null)
    .slice(-120)

  const lastRsi = chartData[chartData.length - 1]?.rsi
  const rsiColor = lastRsi != null ? (lastRsi > 70 ? '#C42B35' : lastRsi < 30 ? '#0A7A45' : '#5C5C57') : '#5C5C57'

  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #DDD9CE', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #DDD9CE', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.75rem', color: '#5C5C57', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RSI (14)</span>
        {lastRsi != null && (
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: rsiColor }}>{lastRsi.toFixed(1)}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.625rem', color: '#5C5C57' }}>
          <span style={{ color: '#C42B35' }}>70 과매수</span>
          <span style={{ margin: '0 6px', color: '#DDD9CE' }}>·</span>
          <span style={{ color: '#0A7A45' }}>30 과매도</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EBE7DC" />
          <XAxis dataKey="date" tick={{ fill: '#5C5C57', fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis domain={[0, 100]} tick={{ fill: '#5C5C57', fontSize: 10 }} width={28} ticks={[0, 30, 50, 70, 100]} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={70} stroke="#C42B35" strokeOpacity={0.4} strokeDasharray="4 3" strokeWidth={1} label={{ value: '70', position: 'right', fill: '#C42B35', fontSize: 9 }} />
          <ReferenceLine y={50} stroke="#DDD9CE" strokeDasharray="2 4" strokeWidth={1} />
          <ReferenceLine y={30} stroke="#0A7A45" strokeOpacity={0.4} strokeDasharray="4 3" strokeWidth={1} label={{ value: '30', position: 'right', fill: '#0A7A45', fontSize: 9 }} />
          <Line type="monotone" dataKey="rsi" stroke="#1B4FCC" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
