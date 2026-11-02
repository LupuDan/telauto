/**
 * Telauto.md logo: a white price tag with a pointed left end and a round hole for the string
 * (TELAUTO_PLAN_DESIGN_v1.md, section 2).
 *
 * full    – header on computers, 36 px high
 * compact – header on phones, 30 px high
 * icon    – the small blue tag with "T" (favicon, empty screens); tone "muted" draws it grey
 *
 * The tag is drawn in two pieces (pointed SVG end + box with the text), so it fits the text
 * exactly in any font and never needs a picture file. Decorative: the link around it has the label.
 */
type LogoProps = {
  variant?: 'full' | 'compact' | 'icon'
  tone?: 'brand' | 'muted'
  className?: string
}

const SIZES = {
  full: { height: 36, tip: 16, font: 16, padRight: 12 },
  compact: { height: 30, tip: 14, font: 14, padRight: 10 },
} as const

export function Logo({ variant = 'full', tone = 'brand', className = '' }: LogoProps) {
  if (variant === 'icon') return <LogoIcon tone={tone} className={className} />

  const { height, tip, font, padRight } = SIZES[variant]
  const middle = height / 2
  const stroke = 1.5
  const edge = stroke / 2

  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 select-none items-stretch ${className}`} style={{ height }}>
      <svg width={tip} height={height} viewBox={`0 0 ${tip} ${height}`} className="relative z-10 -mr-px block shrink-0">
        {/* fill, slightly wider than the tip so no gap shows where it meets the box */}
        <path d={`M${tip + 1} ${edge} L${edge + 1} ${middle} L${tip + 1} ${height - edge} Z`} fill="var(--color-logo-tag)" />
        <path
          d={`M${tip + 1} ${edge} L${edge + 1} ${middle} L${tip + 1} ${height - edge}`}
          fill="none"
          stroke="var(--color-logo-ink)"
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
        <circle cx={tip * 0.62} cy={middle} r={2.5} fill="none" stroke="var(--color-logo-ink)" strokeWidth={stroke} />
      </svg>
      <span
        className="flex items-center rounded-r-logo border-[1.5px] border-l-0 border-logo-ink bg-logo-tag pl-1 font-display leading-none font-semibold whitespace-nowrap"
        style={{ fontSize: font, paddingRight: padRight }}
      >
        <span className="text-logo-ink">Telauto</span>
        <span className="text-logo-blue">.md</span>
      </span>
    </span>
  )
}

/** Small filled tag with the hole and a white "T" (same drawing as public/favicon.svg). */
function LogoIcon({ tone, className }: { tone: 'brand' | 'muted'; className: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`block ${className || 'size-8'}`}>
      <path
        d="M12 3h15a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H12L2.5 17.2a1.8 1.8 0 0 1 0-2.4Z"
        fill={tone === 'brand' ? 'var(--color-logo-blue)' : 'var(--color-line-strong)'}
      />
      <circle cx="9" cy="16" r="2.2" fill="var(--color-logo-tag)" />
      <path d="M15 9h12v3h-4.5v11h-3V12H15Z" fill="var(--color-logo-tag)" />
    </svg>
  )
}
