import { useState, useEffect } from 'react'
import type { InsightRequest } from '../../types/financial'
import { generateInsights } from '../../engine/insightGenerator'

interface Props {
  request: InsightRequest
  volumes?: number[]
}

export function InsightPanel({ request, volumes }: Props) {
  const [insights, setInsights] = useState<string[]>([])
  const [disclaimer, setDisclaimer] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    generateInsights(request, volumes).then((result) => {
      if (!cancelled) {
        setInsights(result.insights)
        setDisclaimer(result.disclaimer)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.dataType, JSON.stringify(request.metrics)])

  return (
    <div className="bg-[#111111] border border-[#222222] p-4 h-full flex flex-col">
      <p className="text-xs text-[#555555] uppercase tracking-wider mb-3">AI 인사이트</p>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2 bg-[#1e1e1e] rounded animate-pulse w-1/3" />
              <div className="h-2.5 bg-[#1e1e1e] rounded animate-pulse w-full" />
              <div className="h-2.5 bg-[#1e1e1e] rounded animate-pulse w-5/6" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {insights.map((insight, i) => {
            // 카테고리 분리: "📈 추세: ..." → prefix + body
            const colonIdx = insight.indexOf(': ')
            const prefix = colonIdx > -1 ? insight.slice(0, colonIdx + 1) : ''
            const body = colonIdx > -1 ? insight.slice(colonIdx + 2) : insight
            // 첫 문장과 나머지 분리 (마침표 + 공백 + 한/영 대문자)
            const match = body.match(/^.+?[.。]\s(?=[가-힣A-Z])/)
            const headline = match ? match[0].trim() : body
            const detail = match ? body.slice(match[0].length).trim() : ''

            return (
              <div key={i} className="border-l-2 border-[#2a2a2a] pl-3 py-0.5">
                {prefix && (
                  <span className="text-[10px] text-[#555555] uppercase tracking-widest block mb-1">
                    {prefix}
                  </span>
                )}
                <p className="text-sm text-[#d4d4d4] leading-snug">{headline}</p>
                {detail && (
                  <p className="text-xs text-[#606060] leading-relaxed mt-1">{detail}</p>
                )}
              </div>
            )
          })}
          {disclaimer && (
            <p className="text-[10px] text-[#3a3a3a] mt-1 leading-relaxed border-t border-[#1a1a1a] pt-2">{disclaimer}</p>
          )}
        </div>
      )}
    </div>
  )
}
