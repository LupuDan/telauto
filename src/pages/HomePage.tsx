import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { ListingGrid, ListingGridSkeleton } from '../components/ListingCard'
import { ErrorState } from '../components/ui/ErrorState'
import { inputClass } from '../components/ui/fieldStyles'
import { useLocalities } from '../features/reference/hooks'
import { useSearchListings } from '../features/search/api'
import { CATEGORY_ICONS, CATEGORY_SLUGS } from '../lib/categories'
import { localizedName } from '../lib/format'

const LATEST_ARGS = { p_limit: 12 }

export function HomePage() {
  const { t } = useTranslation()
  usePageMeta(t('home.metaTitle'), t('home.metaDescription'))
  const latest = useSearchListings(LATEST_ARGS)

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-brand-700 p-5 text-white sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('home.heading')}</h1>
        <p className="mt-1 text-brand-100">{t('app.tagline')}</p>
        <HomeSearch />
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
                className="flex h-full flex-col items-center gap-2 rounded-xl border border-slate-200 bg-surface p-4 text-center font-medium shadow-sm transition hover:border-brand-600 hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
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
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 id="latest-heading" className="text-lg font-semibold">
            {t('home.latestHeading')}
          </h2>
          <Link to="/search" className="text-sm font-semibold text-brand-700 hover:underline">
            {t('home.seeAll')}
          </Link>
        </div>
        {latest.isPending ? (
          <ListingGridSkeleton />
        ) : latest.isError ? (
          <ErrorState error={latest.error} onRetry={() => void latest.refetch()} />
        ) : latest.data.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-surface p-6 text-center text-slate-500">
            {t('home.latestEmpty')}
          </p>
        ) : (
          <ListingGrid listings={latest.data.items} />
        )}
      </section>
    </div>
  )
}

/** Big search box with locality (plan, section 7). */
function HomeSearch() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const localities = useLocalities()
  const [q, setQ] = useState('')
  const [locality, setLocality] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (locality) params.set('loc', locality)
    const query = params.toString()
    navigate(query ? `/search?${query}` : '/search')
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <label htmlFor="home-search" className="sr-only">
        {t('header.searchLabel')}
      </label>
      <input
        id="home-search"
        type="search"
        value={q}
        maxLength={100}
        onChange={(event) => setQ(event.target.value)}
        placeholder={t('header.searchPlaceholder')}
        className={`${inputClass(false)} text-slate-900 sm:flex-1`}
      />
      <label htmlFor="home-locality" className="sr-only">
        {t('listingForm.locality')}
      </label>
      <select
        id="home-locality"
        value={locality}
        onChange={(event) => setLocality(event.target.value)}
        className={`${inputClass(false)} text-slate-900 sm:w-56`}
      >
        <option value="">{t('search.allLocalities')}</option>
        {localities.data?.map((item) => (
          <option key={item.id} value={String(item.id)}>
            {localizedName(item, i18n.resolvedLanguage)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="min-h-11 rounded-lg bg-surface px-6 font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {t('header.searchButton')}
      </button>
    </form>
  )
}
