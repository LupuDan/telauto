import type { ReactNode } from 'react'
import { Logo } from '../Logo'

/**
 * Empty screens (plan de design, 6.9): centred, a small grey price-tag logo, a sentence that says
 * what the person can do, and optionally one action (button or link).
 */
export function EmptyState({
  title,
  text,
  action,
  className = '',
}: {
  title?: string
  text: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto flex max-w-md flex-col items-center px-4 py-10 text-center ${className}`}>
      <Logo variant="icon" tone="muted" className="size-12" />
      {title && <p className="mt-4 font-semibold text-ink">{title}</p>}
      <p className={`${title ? 'mt-1' : 'mt-4'} text-muted`}>{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
