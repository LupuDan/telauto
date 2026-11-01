import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { translateKey } from '../../i18n/translate'
import { useAuth } from '../auth/authContext'
import { errorToKey } from '../auth/authErrors'
import { useStartConversation } from './api'

/** "Scrie mesaj" on the listing page. Rendered inside a 3-column grid (the error takes a full row). */
export function MessageButton({ listingId }: { listingId: string }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const start = useStartConversation()

  function handleClick() {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/a/${listingId}`)}`)
      return
    }
    start.mutate(listingId, { onSuccess: (conversationId) => navigate(`/messages/${conversationId}`) })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={start.isPending}
        aria-busy={start.isPending || undefined}
        className="flex min-h-11 flex-col items-center justify-center rounded-lg border border-brand-700 px-1 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-60"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ✉
        </span>
        <span>{t('listing.actions.message')}</span>
      </button>
      {start.isError && (
        <div className="order-last col-span-3">
          <Alert kind="error">{translateKey(t, errorToKey(start.error))}</Alert>
        </div>
      )}
    </>
  )
}
