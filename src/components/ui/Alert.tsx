import type { ReactNode } from 'react'

type Kind = 'error' | 'success' | 'info' | 'warning'

const KINDS: Record<Kind, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-brand-100 bg-brand-50 text-brand-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
}

export function Alert({ kind = 'info', children }: { kind?: Kind; children: ReactNode }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${KINDS[kind]}`}>
      {children}
    </div>
  )
}
