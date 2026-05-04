import { useEffect, useState } from 'react'

interface ScrollProgressProps {
  color?: string
  height?: number
}

export default function ScrollProgress({ color = '#C9A84C', height = 2 }: ScrollProgressProps) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const fn = () => {
      const s = document.documentElement.scrollTop
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight
      setProgress(h > 0 ? (s / h) * 100 : 0)
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: `${height}px`, background: 'transparent' }}>
      <div style={{ height: '100%', width: `${progress}%`, background: color, transition: 'width 0.1s linear' }} />
    </div>
  )
}
