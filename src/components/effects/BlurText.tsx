import { motion } from 'motion/react'

interface BlurTextProps {
  text: string
  className?: string
  delay?: number
  animateBy?: 'words' | 'characters'
  style?: React.CSSProperties
}

export default function BlurText({ text, className = '', delay = 0.05, animateBy = 'words', style }: BlurTextProps) {
  const items = animateBy === 'words' ? text.split(' ') : text.split('')
  return (
    <span className={className} style={style}>
      {items.map((item, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.5, delay: i * delay, ease: [0.2, 0, 0, 1] }}
          style={{ display: 'inline-block', marginRight: animateBy === 'words' ? '0.25em' : '0' }}
        >
          {item}
        </motion.span>
      ))}
    </span>
  )
}
