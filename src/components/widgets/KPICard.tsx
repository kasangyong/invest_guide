type ColorType = 'positive' | 'negative' | 'neutral' | 'auto'

interface Props {
  label: string
  value: string
  change?: number
  unit?: string
  tooltip?: string
  colorType?: ColorType
}

function resolveColor(colorType: ColorType | undefined, value: string): string {
  if (!colorType || colorType === 'neutral') return 'var(--c-fg)'
  if (colorType === 'positive') return '#0A7A45'
  if (colorType === 'negative') return '#C42B35'
  if (value.startsWith('+')) return '#0A7A45'
  if (value.startsWith('-')) return '#C42B35'
  return 'var(--c-fg)'
}

export function KPICard({ label, value, change, unit, tooltip, colorType }: Props) {
  const valueColor = resolveColor(colorType, value)

  return (
    <div
      title={tooltip}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'var(--c-bg-muted)',
        borderRight: '1px solid var(--c-line)',
        padding: 'var(--s-4)',
        minWidth: '120px',
        cursor: 'default',
        flexShrink: 0,
      }}
    >
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'var(--c-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--s-3)' }}>
        {label}
      </p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'var(--t-2)', fontWeight: 500, lineHeight: 1.1, color: valueColor }}>
        {value}
        {unit && <span style={{ fontSize: 'var(--t--1)', color: 'var(--c-fg-muted)', marginLeft: '4px', fontWeight: 400 }}>{unit}</span>}
      </p>
      {change != null && (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', marginTop: 'var(--s-2)', color: change >= 0 ? '#0A7A45' : '#C42B35' }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </p>
      )}
    </div>
  )
}
