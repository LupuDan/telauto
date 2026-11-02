import { useId, type InputHTMLAttributes, type Ref } from 'react'
import { FieldError, FieldLabel } from './FieldMessage'
import { hintClass, inputClass } from './fieldStyles'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  /** already translated error message */
  error?: string
  hint?: string
  /** unit shown inside the field, on the right (lei, €, km, GB) */
  unit?: string
  /** adds "(opțional)" after the label */
  optional?: boolean
  ref?: Ref<HTMLInputElement>
}

export function TextField({ label, error, hint, unit, optional, id, className = '', ref, ...rest }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <FieldLabel htmlFor={inputId} label={label} optional={optional} />
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputClass(Boolean(error))} ${unit ? 'pr-14 tabular' : ''}`}
          {...rest}
        />
        {unit && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-base text-muted"
          >
            {unit}
          </span>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
