import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'

export function NotFoundPage() {
  const { t } = useTranslation()
  usePageMeta(t('notFound.metaTitle'))

  return (
    <section className="mx-auto max-w-md py-12 text-center">
      <p className="text-5xl font-semibold text-slate-300" aria-hidden="true">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{t('notFound.heading')}</h1>
      <p className="mt-2 text-slate-600">{t('notFound.text')}</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-brand hover:underline">
        {t('notFound.backHome')}
      </Link>
    </section>
  )
}
