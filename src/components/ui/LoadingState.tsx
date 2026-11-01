import { useTranslation } from 'react-i18next'
import { Spinner } from './Spinner'

export function LoadingState() {
  const { t } = useTranslation()
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-slate-500">
      <Spinner />
      <span>{t('common.loading')}</span>
    </div>
  )
}
