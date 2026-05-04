import { useEffect, useRef } from 'react'

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*'

interface LetterGlitchProps {
  color?: string
  opacity?: number
  speed?: number
  style?: React.CSSProperties
}

export default function LetterGlitch({ color = '#C9A84C', opacity = 0.07, speed = 80, style }: LetterGlitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fontSize = 14
    let cols: number[] = []
    let animId: ReturnType<typeof setInterval>

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const numCols = Math.floor(canvas.width / fontSize)
      cols = new Array(numCols).fill(1)
    }
    resize()
    window.addEventListener('resize', resize)

    animId = setInterval(() => {
      if (!canvas || !ctx) return
      ctx.fillStyle = 'rgba(5,6,8,0.03)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = color
      ctx.globalAlpha = opacity * 15
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`

      for (let i = 0; i < cols.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        ctx.fillText(char, i * fontSize, cols[i] * fontSize)
        if (cols[i] * fontSize > canvas.height && Math.random() > 0.975) {
          cols[i] = 0
        }
        cols[i]++
      }
    }, speed)

    return () => {
      clearInterval(animId)
      window.removeEventListener('resize', resize)
    }
  }, [color, opacity, speed])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
    />
  )
}
