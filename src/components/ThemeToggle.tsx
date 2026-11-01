import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { currentTheme, setTheme, subscribeTheme } from '../lib/theme'

/**
 * ☀/🌙 button: switches between light and dark pages.
 * "icon": small square button (header); "full": button with text (footer).
 */
export function ThemeToggle({ variant = 'icon', className = '' }: { variant?: 'icon' | 'full'; className?: string }) {
  const { t } = useTranslation()
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => 'light' as const)
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = next === 'dark' ? t('theme.toDark') : t('theme.toLight')
  const icon = next === 'dark' ? '🌙' : '☀️'

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-surface px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${className}`}
      >
        <span aria-hidden="true">{icon}</span>
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 bg-surface px-2 text-base leading-none hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  )
}
