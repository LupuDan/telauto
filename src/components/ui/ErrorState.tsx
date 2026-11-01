import { useTranslation } from 'react-i18next'
import { errorToKey } from '../../features/auth/authErrors'
import { translateKey } from '../../i18n/translate'
import { Button } from './Button'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="mx-auto max-w-md py-12 text-center">
      <p className="font-semibold text-slate-800">{t('common.errorTitle')}</p>
      <p className="mt-1 text-slate-600">{translateKey(t, errorToKey(error))}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
