import type { ButtonHTMLAttributes } from 'react'
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonStyles'
import { Spinner } from './Spinner'

export type { ButtonSize, ButtonVariant }

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'normal',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClass(variant, size, fullWidth)} ${className}`}
      {...rest}
    >
      {/* while loading the text stays (invisible) so the button keeps its width; the spinner sits on top */}
      <span className={`inline-flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''}`}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner className="size-5" />
        </span>
      )}
    </button>
  )
}
