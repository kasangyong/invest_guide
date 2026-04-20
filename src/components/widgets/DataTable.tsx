import { useState } from 'react'

interface Props {
  headers: string[]
  rows: Record<string, string | number | null>[]
  maxRows?: number
}

export function DataTable({ headers, rows, maxRows = 100 }: Props) {
  const [open, setOpen] = useState(false)
  const displayed = rows.slice(0, maxRows)

  return (
    <div className="bg-[#1a1d27] border border-[#2d3142] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:text-white transition-colors"
      >
        <span className="font-semibold">📋 원시 데이터 ({rows.length}행)</span>
        <span className="text-gray-500">{open ? '▲ 접기' : '▼ 펼치기'}</span>
      </button>

      {open && (
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#12151f]">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-gray-400 uppercase tracking-wide whitespace-nowrap border-b border-[#2d3142]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((row, i) => (
                <tr key={i} className="hover:bg-[#2d3142]/50 transition-colors border-b border-[#2d3142]/30">
                  {headers.map((h) => {
                    const val = row[h]
                    return (
                      <td key={h} className="px-3 py-1.5 text-gray-300 whitespace-nowrap">
                        {val == null ? <span className="text-gray-600">—</span> : String(val)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > maxRows && (
            <p className="text-center text-xs text-gray-500 py-2">
              전체 {rows.length}행 중 {maxRows}행 표시
            </p>
          )}
        </div>
      )}
    </div>
  )
}
