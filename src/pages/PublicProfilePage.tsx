import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useProfile } from '../features/profile/hooks'
import { useLocalities } from '../features/reference/hooks'
import { formatMonthYear, localizedName } from '../lib/format'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function PublicProfilePage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const validId = id && UUID_PATTERN.test(id) ? id : undefined
  const profile = useProfile(validId)
  const localities = useLocalities()

  const name = profile.data?.display_name || t('profile.unnamed')
  usePageMeta(profile.data ? t('profile.metaTitle', { name }) : t('profile.notFoundTitle'))

  if (validId && profile.isPending) return <LoadingState />
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />

  if (!validId || !profile.data) {
    return (
      <section className="mx-auto max-w-md py-12 text-center">
        <h1 className="text-2xl font-bold">{t('profile.notFoundTitle')}</h1>
        <p className="mt-2 text-slate-600">{t('profile.notFoundText')}</p>
        <Link to="/" className="mt-6 inline-block font-semibold text-brand-700 hover:underline">
          {t('notFound.backHome')}
        </Link>
      </section>
    )
  }

  const data = profile.data
  const locality = localities.data?.find((item) => item.id === data.locality_id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700"
        >
          {name.charAt(0).toLocaleUpperCase()}
        </div>
        <div className="min-w-0">
          {/* user text is rendered as plain text by React (no HTML) */}
          <h1 className="truncate text-xl font-bold">{name}</h1>
          <p className="text-sm text-slate-600">
            {locality ? localizedName(locality, i18n.resolvedLanguage) : t('profile.noLocality')}
          </p>
          <p className="text-sm text-slate-500">
            {t('profile.memberSince', { date: formatMonthYear(data.created_at, i18n.resolvedLanguage) })}
          </p>
          {data.is_blocked && <p className="mt-1 text-sm font-semibold text-red-700">{t('profile.blocked')}</p>}
        </div>
      </section>

      <section aria-labelledby="profile-listings">
        <h2 id="profile-listings" className="mb-3 text-lg font-semibold">
          {t('profile.listingsHeading')}
        </h2>
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          {t('profile.listingsSoon')}
        </p>
      </section>
    </div>
  )
}
