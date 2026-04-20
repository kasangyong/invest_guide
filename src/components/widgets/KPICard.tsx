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
  if (!colorType || colorType === 'neutral') return 'text-white'
  if (colorType === 'positive') return 'text-[#26a69a]'
  if (colorType === 'negative') return 'text-[#ef5350]'
  // auto: detect from value string sign
  if (value.startsWith('+')) return 'text-[#26a69a]'
  if (value.startsWith('-')) return 'text-[#ef5350]'
  return 'text-white'
}

export function KPICard({ label, value, change, unit, tooltip, colorType }: Props) {
  const valueColor = resolveColor(colorType, value)

  return (
    <div
      title={tooltip}
      className="flex flex-col justify-between bg-[#111111] border border-[#222222] px-4 py-3 min-w-[130px] cursor-default"
    >
      <p className="text-xs text-[#888888] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-xl font-semibold leading-tight ${valueColor}`}>
        {value}
        {unit && <span className="text-sm text-[#888888] ml-1 font-normal">{unit}</span>}
      </p>
      {change != null && (
        <p className={`text-xs mt-1 ${change >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </p>
      )}
    </div>
  )
}
