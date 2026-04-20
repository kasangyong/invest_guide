import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import type { OHLCVRow } from '../../types/financial'

interface Props { data: OHLCVRow[]; cumulativeReturns: number[]; height?: number }
interface TPayload { value: number; name: string }
interface TProps { active?: boolean; label?: string; payload?: TPayload[] }

function Tip({ active, label, payload }: TProps) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div className="bg-[#111111] border border-[#222222] px-3 py-2 text-xs">
      <p className="text-[#555555] mb-1">{label}</p>
      <p className="text-white">{val >= 0 ? '+' : ''}{val.toFixed(2)}%</p>
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
    <div className="bg-[#0a0a0a] border border-[#222222] overflow-hidden">
      <div className="px-4 py-2 border-b border-[#1e1e1e] flex items-center gap-3">
        <span className="text-xs text-[#888888] uppercase tracking-wider">누적 수익률</span>
        <span className="text-xs text-[#555555]">{lastVal >= 0 ? '+' : ''}{lastVal.toFixed(2)}%</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis dataKey="date" tick={{ fill: '#444444', fontSize: 10 }} tickFormatter={(v: string) => v.slice(0, 7)} />
          <YAxis domain={[Math.floor(minVal * 1.1), Math.ceil(maxVal * 1.1)]} tick={{ fill: '#444444', fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} width={42} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={0} stroke="#333333" strokeWidth={1} />
          <Area type="monotone" dataKey="cumReturn" stroke="#ffffff" strokeWidth={1.5} fill="url(#retGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
