import { useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode, CSSProperties } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

interface MagnetProps {
  children: ReactNode
  strength?: number
  style?: CSSProperties
}

export default function Magnet({ children, strength = 0.3, style }: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 20 })
  const springY = useSpring(y, { stiffness: 200, damping: 20 })

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * strength)
    y.set((e.clientY - cy) * strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY, display: 'inline-block', ...style }}
    >
      {children}
    </motion.div>
  )
}
