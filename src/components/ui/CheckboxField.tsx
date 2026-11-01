import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  error?: string
  ref?: Ref<HTMLInputElement>
}

export function CheckboxField({ label, error, id, ref, ...rest }: CheckboxFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`

  return (
    <div>
      <div className="flex items-start gap-2">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 size-5 shrink-0 accent-brand-700"
          {...rest}
        />
        <label htmlFor={inputId} className="text-sm text-slate-700">
          {label}
        </label>
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
