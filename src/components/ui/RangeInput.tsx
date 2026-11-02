import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldError, FieldLabel } from './FieldMessage'
import { inputClass } from './fieldStyles'

type RangeInputProps = {
  label: string
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
  /** unit inside both boxes (lei, €, km) */
  unit?: string
  error?: string
  className?: string
  inputMode?: 'numeric' | 'decimal'
}

/** Two boxes, "de la" and "până la", for price, year, kilometres (plan de design, section 5). */
export function RangeInput({
  label,
  from,
  to,
  onChange,
  unit,
  error,
  className = '',
  inputMode = 'numeric',
}: RangeInputProps) {
  const { t } = useTranslation()
  const id = useId()
  const errorId = `${id}-error`

  const box = (which: 'from' | 'to') => (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={`${id}-${which}`} className="sr-only">
        {`${label}, ${t(which === 'from' ? 'common.rangeFrom' : 'common.rangeTo')}`}
      </label>
      <input
        id={`${id}-${which}`}
        inputMode={inputMode}
        value={which === 'from' ? from : to}
        placeholder={t(which === 'from' ? 'common.rangeFrom' : 'common.rangeTo')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(which === 'from' ? { from: event.target.value, to } : { from, to: event.target.value })}
        className={`${inputClass(Boolean(error))} tabular ${unit ? 'pr-12' : ''}`}
      />
      {unit && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
          {unit}
        </span>
      )}
    </div>
  )

  return (
    <div role="group" aria-labelledby={`${id}-label`} className={className}>
      <span id={`${id}-label`}>
        <FieldLabel label={label} />
      </span>
      <div className="flex items-center gap-2">
        {box('from')}
        <span aria-hidden="true" className="text-muted">
          –
        </span>
        {box('to')}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
