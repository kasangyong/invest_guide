import { useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode, CSSProperties } from 'react'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  spotlightColor?: string
}

export default function SpotlightCard({ children, className = '', style, spotlightColor = 'rgba(201,168,76,0.08)' }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    card.style.setProperty('--x', `${x}px`)
    card.style.setProperty('--y', `${y}px`)
  }

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(300px circle at var(--x, 50%) var(--y, 50%), ${spotlightColor}, transparent 70%)`,
        transition: 'opacity 0.3s',
        zIndex: 1,
      }} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
