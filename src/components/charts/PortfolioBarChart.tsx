import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts'
import type { PortfolioRow } from '../../types/financial'

interface Props { data: PortfolioRow[]; height?: number }
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

export function PortfolioBarChart({ data, height = 260 }: Props) {
  const sorted = [...data].sort((a, b) => (b.returnRate ?? 0) - (a.returnRate ?? 0))
  return (
    <div className="bg-[#0a0a0a] border border-[#222222] overflow-hidden">
      <div className="px-4 py-2 border-b border-[#1e1e1e]">
        <span className="text-xs text-[#888888] uppercase tracking-wider">종목별 수익률</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 8, right: 40, left: 60, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#444444', fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
          <YAxis type="category" dataKey="ticker" tick={{ fill: '#888888', fontSize: 11 }} width={56} />
          <Tooltip content={<Tip />} />
          <ReferenceLine x={0} stroke="#333333" strokeWidth={1} />
          <Bar dataKey="returnRate" radius={[0, 2, 2, 0]}>
            {sorted.map((entry, i) => (
              <Cell key={`c-${i}`} fill={(entry.returnRate ?? 0) >= 0 ? '#ffffff' : '#333333'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
