import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Sheet } from '../../components/ui/Sheet'
import { translateKey } from '../../i18n/translate'
import { errorToKey } from '../auth/authErrors'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

/**
 * Button for a serious action (reject, block, delete): it opens a window that asks
 * for confirmation first (plan de design, 6.8).
 */
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

  return (
    <>
      <Button variant={variant} size="compact" onClick={() => setAsking(true)}>
        {children}
      </Button>
      <Sheet open={asking} onClose={() => setAsking(false)} title={confirmText}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            fullWidth
            loading={loading}
            onClick={() => {
              onConfirm()
              setAsking(false)
            }}
          >
            {children}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setAsking(false)}>
            {t('garage.cancel')}
          </Button>
        </div>
      </Sheet>
    </>
  )
}

export function ActionError({ error }: { error: unknown }) {
  const { t } = useTranslation()
  if (!error) return null
  return <Alert kind="error">{translateKey(t, errorToKey(error))}</Alert>
}

export function EmptyBox({ children }: { children: string }) {
  return <EmptyState text={children} />
}

/**
 * Admin lists: cards on phones; on computers one dense table-like box with a line between rows.
 */
export function AdminList({ children }: { children: ReactNode }) {
  return (
    <ul className="space-y-3 lg:space-y-0 lg:divide-y lg:divide-line lg:overflow-hidden lg:rounded-card lg:border lg:border-line lg:bg-surface">
      {children}
    </ul>
  )
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <li className="space-y-3 rounded-card border border-line bg-surface p-4 lg:space-y-2 lg:rounded-none lg:border-0 lg:px-4 lg:py-3">
      {children}
    </li>
  )
}
