import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { ListingGrid, ListingGridSkeleton } from '../components/ListingCard'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useProfile } from '../features/profile/hooks'
import { useLocalities } from '../features/reference/hooks'
import { useSearchListings } from '../features/search/api'
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
        <h1 className="text-2xl font-semibold">{t('profile.notFoundTitle')}</h1>
        <p className="mt-2 text-slate-600">{t('profile.notFoundText')}</p>
        <Link to="/" className="mt-6 inline-block font-semibold text-brand hover:underline">
          {t('notFound.backHome')}
        </Link>
      </section>
    )
  }

  const data = profile.data
  const locality = localities.data?.find((item) => item.id === data.locality_id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="flex items-center gap-4 rounded-card border border-line bg-surface p-5 shadow-sm">
        <div
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand"
        >
          {name.charAt(0).toLocaleUpperCase()}
        </div>
        <div className="min-w-0">
          {/* user text is rendered as plain text by React (no HTML) */}
          <h1 className="truncate text-xl font-semibold">{name}</h1>
          <p className="text-sm text-slate-600">
            {locality ? localizedName(locality, i18n.resolvedLanguage) : t('profile.noLocality')}
          </p>
          <p className="text-sm text-slate-500">
            {t('profile.memberSince', { date: formatMonthYear(data.created_at, i18n.resolvedLanguage) })}
          </p>
          {data.is_blocked && <p className="mt-1 text-sm font-semibold text-danger">{t('profile.blocked')}</p>}
        </div>
      </section>

      <section aria-labelledby="profile-listings">
        <h2 id="profile-listings" className="mb-3 text-lg font-semibold">
          {t('profile.listingsHeading')}
        </h2>
        <ProfileListings userId={data.id} />
      </section>
    </div>
  )
}

function ProfileListings({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const listings = useSearchListings({ p_user_id: userId, p_limit: 48 })

  if (listings.isPending) return <ListingGridSkeleton count={4} />
  if (listings.isError) return <ErrorState error={listings.error} onRetry={() => void listings.refetch()} />
  if (listings.data.items.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line-strong bg-surface p-6 text-center text-slate-500">
        {t('profile.noListings')}
      </p>
    )
  }
  return <ListingGrid listings={listings.data.items} />
}
