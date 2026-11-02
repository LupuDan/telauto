import { Check } from 'lucide-react'
import { useId } from 'react'
import { FieldError, FieldLabel } from './FieldMessage'

type Option = { value: string; label: string }

type ChipGroupProps = {
  label: string
  options: readonly Option[]
  /** single choice: the chosen value ('' = none); multiple: list of values */
  value: string | readonly string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  optional?: boolean
  error?: string
  className?: string
}

/**
 * Pressable pills for a few options: fuel, gearbox, condition, new/used (plan de design, section 5).
 * Single choice works like radio buttons (pressing the chosen pill again clears it);
 * multiple choice works like checkboxes.
 */
export function ChipGroup({
  label,
  options,
  value,
  onChange,
  multiple = false,
  optional,
  error,
  className = '',
}: ChipGroupProps) {
  const labelId = useId()
  const errorId = `${labelId}-error`
  const selected = new Set(typeof value === 'string' ? (value ? [value] : []) : value)

  function toggle(option: string) {
    if (multiple) {
      const next = new Set(selected)
      if (next.has(option)) next.delete(option)
      else next.add(option)
      onChange(options.map((item) => item.value).filter((item) => next.has(item)))
    } else {
      onChange(selected.has(option) ? '' : option)
    }
  }

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={error ? errorId : undefined}
      className={className}
    >
      <span id={labelId}>
        <FieldLabel label={label} optional={optional} />
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.has(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.value)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-base transition-colors ${
                active
                  ? 'border-brand bg-brand-50 font-medium text-brand'
                  : `bg-surface text-ink hover:bg-paper ${error ? 'border-danger' : 'border-line-strong'}`
              }`}
            >
              {active && <Check aria-hidden="true" className="size-4" strokeWidth={2.25} />}
              {option.label}
            </button>
          )
        })}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
