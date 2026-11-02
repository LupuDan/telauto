import { useId, useState, type InputHTMLAttributes, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldError, FieldLabel } from './FieldMessage'
import { hintClass, inputClass } from './fieldStyles'

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  error?: string
  hint?: string
  ref?: Ref<HTMLInputElement>
}

/** Password box with an "Arată" / "Ascunde" button inside (plan de design, 6.7). */
export function PasswordField({ label, error, hint, id, className = '', ref, ...rest }: PasswordFieldProps) {
  const { t } = useTranslation()
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const [visible, setVisible] = useState(false)
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <FieldLabel htmlFor={inputId} label={label} />
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoCapitalize="none"
          spellCheck={false}
          className={`${inputClass(Boolean(error))} pr-24`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center rounded-r-field px-3 text-sm font-medium text-brand hover:underline"
        >
          {visible ? t('auth.hidePassword') : t('auth.showPassword')}
        </button>
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
