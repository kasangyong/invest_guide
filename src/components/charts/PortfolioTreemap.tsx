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
  if (r > 15) return '#ffffff'
  if (r > 5)  return '#cccccc'
  if (r > 0)  return '#999999'
  if (r > -5) return '#555555'
  return '#2a2a2a'
}

function Tip({ active, payload }: TProps) {
  if (!active || !payload?.length) return null
  const node = payload[0]?.payload
  if (!node) return null
  const ret = Number(node.returnRate)
  return (
    <div className="bg-[#111111] border border-[#222222] px-3 py-2 text-xs">
      <p className="text-white font-medium">{node.name}</p>
      <p className="text-[#888888]">비중 {Number(node.size).toFixed(1)}%</p>
      <p className="text-[#888888]">수익률 {ret >= 0 ? '+' : ''}{ret.toFixed(1)}%</p>
    </div>
  )
}

interface ContentProps {
  x?: number; y?: number; width?: number; height?: number
  name?: string; returnRate?: number; size?: number; color?: string
}

function Content({ x = 0, y = 0, width = 0, height = 0, name = '', returnRate = 0, size = 0, color = '#333333' }: ContentProps) {
  if (width < 20 || height < 16) return null
  const fs = Math.min(12, width / 6)
  const sub = Math.min(10, width / 7)
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill={color} />
      {width > 40 && height > 28 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill={Number(returnRate) > 5 ? '#000000' : '#ffffff'} fontSize={fs} fontWeight="600">{name}</text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill={Number(returnRate) > 5 ? '#33333399' : '#ffffff99'} fontSize={sub}>{Number(size).toFixed(1)}%</text>
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
    <div className="bg-[#0a0a0a] border border-[#222222] overflow-hidden">
      <div className="px-4 py-2 border-b border-[#1e1e1e]">
        <span className="text-xs text-[#888888] uppercase tracking-wider">포트폴리오 구성</span>
        <span className="ml-3 text-xs text-[#444444]">크기=비중 · 밝기=수익률</span>
      </div>
      <div className="p-2">
        <ResponsiveContainer width="100%" height={height}>
          <Treemap data={treeData} dataKey="size" content={<Content />}>
            <Tooltip content={<Tip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
