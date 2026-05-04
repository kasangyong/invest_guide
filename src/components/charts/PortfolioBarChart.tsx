import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts'
import type { PortfolioRow } from '../../types/financial'

interface Props { data: PortfolioRow[]; height?: number }
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

export function PortfolioBarChart({ data, height = 260 }: Props) {
  const sorted = [...data].sort((a, b) => (b.returnRate ?? 0) - (a.returnRate ?? 0))
  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #DDD9CE', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #DDD9CE' }}>
        <span style={{ fontSize: '0.75rem', color: '#5C5C57', textTransform: 'uppercase', letterSpacing: '0.05em' }}>종목별 수익률</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 8, right: 40, left: 60, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EBE7DC" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#5C5C57', fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
          <YAxis type="category" dataKey="ticker" tick={{ fill: '#5C5C57', fontSize: 11 }} width={56} />
          <Tooltip content={<Tip />} />
          <ReferenceLine x={0} stroke="#DDD9CE" strokeWidth={1} />
          <Bar dataKey="returnRate" radius={[0, 2, 2, 0]}>
            {sorted.map((entry, i) => (
              <Cell key={`c-${i}`} fill={(entry.returnRate ?? 0) >= 0 ? '#1B4FCC' : '#C42B35'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
