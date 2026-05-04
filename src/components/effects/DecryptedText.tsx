import { useState, useEffect, useRef } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%'

interface DecryptedTextProps {
  text: string
  className?: string
  style?: React.CSSProperties
  speed?: number
  revealDelay?: number
}

export default function DecryptedText({ text, className = '', style, speed = 40, revealDelay = 0 }: DecryptedTextProps) {
  const [displayed, setDisplayed] = useState(() =>
    text.split('').map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
  )
  const revealedRef = useRef<boolean[]>(new Array(text.length).fill(false))
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    revealedRef.current = new Array(text.length).fill(false)
    setDisplayed(text.split('').map(() => CHARS[Math.floor(Math.random() * CHARS.length)]))

    const tid = setTimeout(() => {
      let i = 0
      frameRef.current = setInterval(() => {
        const revealed = revealedRef.current
        if (i < text.length) {
          revealed[i] = true
          i++
        }
        setDisplayed(prev =>
          prev.map((_, idx) =>
            revealed[idx] ? text[idx] : CHARS[Math.floor(Math.random() * CHARS.length)]
          )
        )
        if (i >= text.length && frameRef.current) clearInterval(frameRef.current)
      }, speed)
    }, revealDelay * 1000)

    return () => {
      clearTimeout(tid)
      if (frameRef.current) clearInterval(frameRef.current)
    }
  }, [text, speed, revealDelay])

  return (
    <span className={className} style={style}>
      {displayed.join('')}
    </span>
  )
}
