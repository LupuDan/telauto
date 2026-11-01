import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'

/** Temporary page for routes that are built in later phases. */
export function ComingSoonPage() {
  const { t } = useTranslation()
  usePageMeta(t('comingSoon.metaTitle'))

  return (
    <section className="mx-auto max-w-md py-12 text-center">
      <h1 className="text-2xl font-bold">{t('comingSoon.heading')}</h1>
      <p className="mt-2 text-slate-600">{t('comingSoon.text')}</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-brand-700 hover:underline">
        {t('comingSoon.backHome')}
      </Link>
    </section>
  )
}
