import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { currentTheme, setTheme, subscribeTheme } from '../lib/theme'

/**
 * Moon / sun button: switches between light and dark pages.
 * "icon": square button (header); "full": button with text (footer).
 */
export function ThemeToggle({ variant = 'icon', className = '' }: { variant?: 'icon' | 'full'; className?: string }) {
  const { t } = useTranslation()
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => 'light' as const)
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = next === 'dark' ? t('theme.toDark') : t('theme.toLight')
  const Icon = next === 'dark' ? Moon : Sun

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-field border border-line-strong bg-surface px-3 text-sm font-medium text-ink hover:bg-paper ${className}`}
      >
        <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
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
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-field text-ink hover:bg-paper ${className}`}
    >
      <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
    </button>
  )
}
