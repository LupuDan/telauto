import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { translateKey } from '../../i18n/translate'
import { toast } from '../../lib/toast'
import { useAuth } from '../auth/authContext'
import { errorToKey } from '../auth/authErrors'
import { useStartConversation } from './api'

/** "Scrie mesaj" (primary button) on the listing page. Visitors go to the login page first. */
export function MessageButton({ listingId, className = '' }: { listingId: string; className?: string }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const start = useStartConversation()

  function handleClick() {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/a/${listingId}`)}`)
      return
    }
    start.mutate(listingId, {
      onSuccess: (conversationId) => navigate(`/messages/${conversationId}`),
      onError: (error) => toast(translateKey(t, errorToKey(error))),
    })
  }

  return (
    <Button fullWidth loading={start.isPending} onClick={handleClick} className={className}>
      <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.75} />
      {t('listing.actions.message')}
    </Button>
  )
}
