import { useTranslation } from 'react-i18next'
import { errorToKey } from '../../features/auth/authErrors'
import { translateKey } from '../../i18n/translate'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

/**
 * A list could not be loaded (plan de design, 6.9). No connection: "Nu s-au putut încărca anunțurile.
 * Verifică internetul și încearcă din nou." Other errors say what happened.
 */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation()
  const key = errorToKey(error)
  return (
    <div role="alert">
      <EmptyState
        text={key === 'errors.network' ? t('common.loadFailed') : translateKey(t, key)}
        action={
          onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          )
        }
      />
    </div>
  )
}
