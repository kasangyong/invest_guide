import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { OHLCVRow } from '../../types/financial'

interface Props { data: OHLCVRow[]; drawdownSeries: number[]; height?: number }
interface TPayload { value: number }
interface TProps { active?: boolean; label?: string; payload?: TPayload[] }

function Tip({ active, label, payload }: TProps) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div className="bg-[#111111] border border-[#222222] px-3 py-2 text-xs">
      <p className="text-[#555555] mb-1">{label}</p>
      <p className="text-white">{val.toFixed(2)}%</p>
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
    <div className="bg-[#0a0a0a] border border-[#222222] overflow-hidden">
      <div className="px-4 py-2 border-b border-[#1e1e1e] flex items-center gap-3">
        <span className="text-xs text-[#888888] uppercase tracking-wider">낙폭</span>
        <span className="text-xs text-[#555555]">MDD {minVal.toFixed(2)}%</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef5350" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef5350" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis dataKey="date" tick={{ fill: '#444444', fontSize: 10 }} tickFormatter={(v: string) => v.slice(0, 7)} />
          <YAxis domain={[Math.floor(minVal * 1.1), 0]} tick={{ fill: '#444444', fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} width={38} />
          <Tooltip content={<Tip />} />
          <Area type="monotone" dataKey="drawdown" stroke="#ef5350" strokeOpacity={0.7} strokeWidth={1.5} fill="url(#ddGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
