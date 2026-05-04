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
    <div style={{ background: 'var(--c-bg-muted)', border: '1px solid var(--c-line)', padding: 'var(--s-5)', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'var(--c-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--s-4)' }}>
        AI Insight
      </p>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
          {[1, 0.85, 0.9, 0.7].map((w, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ height: '6px', background: 'var(--c-line)', width: `${w * 40}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '8px', background: 'var(--c-line)', width: '100%', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '8px', background: 'var(--c-line)', width: `${w * 90}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', flex: 1 }}>
          {insights.map((insight, i) => {
            const colonIdx = insight.indexOf(': ')
            const prefix = colonIdx > -1 ? insight.slice(0, colonIdx + 1) : ''
            const body = colonIdx > -1 ? insight.slice(colonIdx + 2) : insight
            const match = body.match(/^.+?[.。]\s(?=[가-힣A-Z])/)
            const headline = match ? match[0].trim() : body
            const detail = match ? body.slice(match[0].length).trim() : ''

            return (
              <div key={i} style={{ paddingLeft: 'var(--s-3)', borderLeft: '2px solid var(--c-accent)', opacity: 0.9 }}>
                {prefix && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'var(--c-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
                    {prefix}
                  </span>
                )}
                <p style={{ fontSize: 'var(--t-0)', color: 'var(--c-fg)', lineHeight: 1.55, margin: 0 }}>{headline}</p>
                {detail && (
                  <p style={{ fontSize: 'var(--t--1)', color: 'var(--c-fg-muted)', lineHeight: 1.7, marginTop: '4px' }}>{detail}</p>
                )}
              </div>
            )
          })}
          {disclaimer && (
            <p style={{ fontSize: '0.65rem', color: 'var(--c-fg-muted)', marginTop: 'auto', paddingTop: 'var(--s-4)', borderTop: '1px solid var(--c-line)', lineHeight: 1.6 }}>
              {disclaimer}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
