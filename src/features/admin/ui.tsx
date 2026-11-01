import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { translateKey } from '../../i18n/translate'
import { errorToKey } from '../auth/authErrors'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

/** Button that asks "Sigur?" before a serious action (reject, block, delete). */
export function ConfirmButton({
  children,
  confirmText,
  onConfirm,
  loading,
  variant = 'danger',
}: {
  children: ReactNode
  confirmText: string
  onConfirm: () => void
  loading?: boolean
  variant?: Variant
}) {
  const { t } = useTranslation()
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <Button variant={variant === 'danger' ? 'secondary' : variant} onClick={() => setAsking(true)}>
        {children}
      </Button>
    )
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-2 py-1">
      <span className="text-sm text-red-900">{confirmText}</span>
      <Button
        variant="danger"
        loading={loading}
        onClick={() => {
          onConfirm()
          setAsking(false)
        }}
      >
        {t('common.yes')}
      </Button>
      <Button variant="secondary" onClick={() => setAsking(false)}>
        {t('common.no')}
      </Button>
    </span>
  )
}

export function ActionError({ error }: { error: unknown }) {
  const { t } = useTranslation()
  if (!error) return null
  return <Alert kind="error">{translateKey(t, errorToKey(error))}</Alert>
}

export function EmptyBox({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 bg-surface p-6 text-center text-slate-500">{children}</p>
  )
}

export function Card({ children }: { children: ReactNode }) {
  return <li className="space-y-3 rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">{children}</li>
}
