import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import type { PortfolioRow } from '../../types/financial'

interface TreemapNode {
  name: string
  size: number
  returnRate: number
  color: string
  [key: string]: string | number
}

interface TPayloadItem { payload: TreemapNode }
interface TProps { active?: boolean; payload?: TPayloadItem[] }

function getColor(r: number): string {
  if (r > 15) return '#1A6B3A'
  if (r > 5)  return '#2D9E57'
  if (r > 0)  return '#8DC4A0'
  if (r > -5) return '#CCCCCC'
  return '#B83040'
}

function Tip({ active, payload }: TProps) {
  if (!active || !payload?.length) return null
  const node = payload[0]?.payload
  if (!node) return null
  const ret = Number(node.returnRate)
  return (
    <div style={{ background: '#fff', border: '1px solid #DDD9CE', padding: '8px 12px', fontSize: '0.75rem' }}>
      <p style={{ color: '#1A1A1A', fontWeight: 500 }}>{node.name}</p>
      <p style={{ color: '#5C5C57' }}>비중 {Number(node.size).toFixed(1)}%</p>
      <p style={{ color: ret >= 0 ? '#0A7A45' : '#C42B35' }}>수익률 {ret >= 0 ? '+' : ''}{ret.toFixed(1)}%</p>
    </div>
  )
}

interface ContentProps {
  x?: number; y?: number; width?: number; height?: number
  name?: string; returnRate?: number; size?: number; color?: string
}

function Content({ x = 0, y = 0, width = 0, height = 0, name = '', returnRate = 0, size = 0 }: ContentProps) {
  if (width < 20 || height < 16) return null
  const ret = Number(returnRate)
  const fill = getColor(ret)
  const textColor = (ret > 5 || ret < -5) ? '#ffffff' : '#1A1A1A'
  const subColor = (ret > 5 || ret < -5) ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,26,0.55)'
  const fs = Math.min(12, width / 6)
  const sub = Math.min(10, width / 7)
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill={fill} />
      {width > 40 && height > 28 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill={textColor} fontSize={fs} fontWeight="600">{name}</text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill={subColor} fontSize={sub}>{Number(size).toFixed(1)}%</text>
        </>
      )}
    </g>
  )
}

interface Props { data: PortfolioRow[]; height?: number }

export function PortfolioTreemap({ data, height = 300 }: Props) {
  const treeData: TreemapNode[] = data.map((row) => ({
    name: row.ticker,
    size: row.weight,
    returnRate: row.returnRate ?? 0,
    color: getColor(row.returnRate ?? 0),
  }))

  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #DDD9CE', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #DDD9CE' }}>
        <span style={{ fontSize: '0.75rem', color: '#5C5C57', textTransform: 'uppercase', letterSpacing: '0.05em' }}>포트폴리오 구성</span>
        <span style={{ marginLeft: '12px', fontSize: '0.625rem', color: '#5C5C57' }}>크기=비중 · 색상=수익률</span>
      </div>
      <div style={{ padding: '8px' }}>
        <ResponsiveContainer width="100%" height={height}>
          <Treemap data={treeData} dataKey="size" content={<Content />}>
            <Tooltip content={<Tip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
