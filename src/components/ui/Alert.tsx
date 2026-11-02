import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Kind = 'error' | 'success' | 'info' | 'warning'

// dark text on every tint (readable in both themes); the colour is carried by the border and the icon
const KINDS: Record<Kind, { box: string; icon: string; Icon: LucideIcon }> = {
  error: { box: 'border-danger-200 bg-danger-50', icon: 'text-danger', Icon: CircleAlert },
  success: { box: 'border-success-200 bg-success-50', icon: 'text-success', Icon: CircleCheck },
  info: { box: 'border-brand-100 bg-brand-50', icon: 'text-brand', Icon: Info },
  warning: { box: 'border-tag bg-tag-50', icon: 'text-ink', Icon: TriangleAlert },
}

export function Alert({ kind = 'info', children }: { kind?: Kind; children: ReactNode }) {
  const { box, icon, Icon } = KINDS[kind]
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-field border px-4 py-3 text-sm text-ink ${box}`}
    >
      <Icon aria-hidden="true" className={`mt-px size-5 shrink-0 ${icon}`} strokeWidth={1.75} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
