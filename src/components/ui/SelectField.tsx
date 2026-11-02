import { useId, type Ref, type SelectHTMLAttributes } from 'react'
import { FieldError, FieldLabel } from './FieldMessage'
import { inputClass } from './fieldStyles'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  optional?: boolean
  ref?: Ref<HTMLSelectElement>
}

/** Plain list for short choices (plan de design, section 5: Select). */
export function SelectField({ label, error, optional, id, className = '', children, ref, ...rest }: SelectFieldProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  const errorId = `${selectId}-error`

  return (
    <div className={className}>
      <FieldLabel htmlFor={selectId} label={label} optional={optional} />
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={inputClass(Boolean(error))}
        {...rest}
      >
        {children}
      </select>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
