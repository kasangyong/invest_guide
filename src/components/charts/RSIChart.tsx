import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import type { OHLCVRow } from '../../types/financial'

interface Props { data: OHLCVRow[]; rsiSeries: (number | null)[]; height?: number }
interface TPayload { value: number; name: string; color: string }
interface TProps { active?: boolean; label?: string; payload?: TPayload[] }

function Tip({ active, label, payload }: TProps) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  const color = val != null ? (val > 70 ? '#ef5350' : val < 30 ? '#26a69a' : '#ffffff') : '#ffffff'
  return (
    <div className="bg-[#111111] border border-[#222222] px-3 py-2 text-xs">
      <p className="text-[#555555] mb-1">{label}</p>
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
  const rsiColor = lastRsi != null ? (lastRsi > 70 ? '#ef5350' : lastRsi < 30 ? '#26a69a' : '#aaaaaa') : '#aaaaaa'

  return (
    <div className="bg-[#0a0a0a] border border-[#222222] overflow-hidden">
      <div className="px-4 py-2 border-b border-[#1e1e1e] flex items-center gap-3">
        <span className="text-xs text-[#888888] uppercase tracking-wider">RSI (14)</span>
        {lastRsi != null && (
          <span className="text-xs font-medium" style={{ color: rsiColor }}>{lastRsi.toFixed(1)}</span>
        )}
        <span className="ml-auto text-[10px] text-[#444444]">
          <span style={{ color: '#ef5350' }}>70 과매수</span>
          <span className="mx-1.5 text-[#2a2a2a]">·</span>
          <span style={{ color: '#26a69a' }}>30 과매도</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis dataKey="date" tick={{ fill: '#444444', fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis domain={[0, 100]} tick={{ fill: '#444444', fontSize: 10 }} width={28} ticks={[0, 30, 50, 70, 100]} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={70} stroke="#ef5350" strokeOpacity={0.5} strokeDasharray="4 3" strokeWidth={1} label={{ value: '70', position: 'right', fill: '#ef5350', fontSize: 9 }} />
          <ReferenceLine y={50} stroke="#333333" strokeDasharray="2 4" strokeWidth={1} />
          <ReferenceLine y={30} stroke="#26a69a" strokeOpacity={0.5} strokeDasharray="4 3" strokeWidth={1} label={{ value: '30', position: 'right', fill: '#26a69a', fontSize: 9 }} />
          <Line type="monotone" dataKey="rsi" stroke="#888888" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
