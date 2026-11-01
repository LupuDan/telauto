import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { CATEGORY_ICONS, CATEGORY_SLUGS } from '../lib/categories'

export function HomePage() {
  const { t } = useTranslation()
  usePageMeta(t('home.metaTitle'), t('home.metaDescription'))

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold sm:text-3xl">{t('home.heading')}</h1>
        <p className="mt-1 text-slate-600">{t('app.tagline')}</p>
      </section>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-3 text-lg font-semibold">
          {t('home.categoriesHeading')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORY_SLUGS.map((slug) => (
            <li key={slug}>
              <Link
                to={`/c/${slug}`}
                className="flex h-full flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center font-medium shadow-sm transition hover:border-brand-600 hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <span aria-hidden="true" className="text-3xl">
                  {CATEGORY_ICONS[slug]}
                </span>
                <span>{t(`categories.${slug}`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="latest-heading">
        <h2 id="latest-heading" className="mb-3 text-lg font-semibold">
          {t('home.latestHeading')}
        </h2>
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          {t('home.latestEmpty')}
        </p>
      </section>
    </div>
  )
}
