import { ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

/**
 * Safety panel (plan de design, section 5): pale yellow background, 4 px yellow bar on the left,
 * shield icon, short text and a link to "Sfaturi de siguranță". compact: smaller, without the link
 * (above a suspicious chat message).
 */
export function SafetyNotice({
  children,
  title,
  compact = false,
  className = '',
}: {
  children: ReactNode
  title?: string
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <aside
      className={`flex gap-3 rounded-field border-l-4 border-tag bg-tag-50 text-ink ${
        compact ? 'px-3 py-2 text-sm' : 'p-4'
      } ${className}`}
    >
      <ShieldAlert aria-hidden="true" className={`shrink-0 ${compact ? 'size-4 mt-0.5' : 'size-5 mt-0.5'}`} strokeWidth={1.75} />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={compact ? '' : 'text-sm'}>{children}</div>
        {!compact && (
          <Link to="/p/safety" className="inline-block text-sm font-medium text-brand underline-offset-2 hover:underline">
            {t('footer.safety')}
          </Link>
        )}
      </div>
    </aside>
  )
}
