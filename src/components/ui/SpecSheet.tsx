import type { ReactNode } from 'react'

export type SpecRow = { key: string; label: string; value: ReactNode }

/**
 * Product sheet (plan de design, section 5): label on the left (grey), value on the right
 * (dark, 500, tabular digits), rows alternating white and paper. On a narrow phone the value
 * moves under the label when both do not fit on one line.
 */
export function SpecSheet({ rows, className = '' }: { rows: readonly SpecRow[]; className?: string }) {
  if (rows.length === 0) return null
  return (
    <dl className={`overflow-hidden rounded-card border border-line ${className}`}>
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-2.5 odd:bg-surface even:bg-paper"
        >
          <dt className="min-w-0 text-muted">{row.label}</dt>
          {/* user text: React shows it as plain text */}
          <dd className="ml-auto min-w-0 text-right font-medium break-words whitespace-pre-line text-ink tabular">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
