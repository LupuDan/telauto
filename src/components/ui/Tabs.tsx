import type { ReactNode } from 'react'

export type TabItem<T extends string> = { value: T; label: ReactNode }

/**
 * Row of tabs (plan de design, section 5): the active one dark with a blue line under it.
 * On narrow phones the row scrolls sideways instead of wrapping.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: readonly TabItem<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {items.map((item) => {
          const active = item.value === value
          return (
            <li key={item.value}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onChange(item.value)}
                className={`-mb-px inline-flex min-h-11 items-center gap-1.5 border-b-2 px-3 font-medium whitespace-nowrap ${
                  active ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
