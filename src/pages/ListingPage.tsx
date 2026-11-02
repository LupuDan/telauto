import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { ListingGrid } from '../components/ListingCard'
import { Alert } from '../components/ui/Alert'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useAuth } from '../features/auth/authContext'
import { countView, useListing, type ListingDetails } from '../features/listingPage/api'
import { AttributeList } from '../features/listingPage/AttributeList'
import { ListingGallery } from '../features/listingPage/ListingGallery'
import { SellerBox } from '../features/listingPage/SellerBox'
import { useSearchListings } from '../features/search/api'
import { useLocalities } from '../features/reference/hooks'
import { categoryById, type CategoryConfig } from '../lib/categories'
import { formatDate, formatPrice, localizedName } from '../lib/format'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function ListingPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const validId = id && UUID_PATTERN.test(id) ? id : undefined
  const listing = useListing(validId)
  const { user, loading: authLoading } = useAuth()

  const data = listing.data
  usePageMeta(
    data ? `${data.title} – Telauto.md` : t('errors.listingNotFound'),
    data ? data.description.slice(0, 160) : undefined,
  )

  // opening another listing (e.g. from "similar") starts at the top
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [validId])

  const isVisibleToAll = data?.status === 'active' && !data.expired
  useEffect(() => {
    if (!data || authLoading || !isVisibleToAll || data.userId === user?.id) return
    void countView(data.id)
  }, [data, authLoading, isVisibleToAll, user?.id])

  if (validId && listing.isPending) return <LoadingState />
  if (listing.isError) return <ErrorState error={listing.error} onRetry={() => void listing.refetch()} />

  const category = data ? categoryById(data.categoryId) : undefined
  if (!data || !category) {
    return (
      <section className="mx-auto max-w-md py-12 text-center">
        <h1 className="text-2xl font-semibold">{t('errors.listingNotFound')}</h1>
        <p className="mt-2 text-slate-600">{t('listing.notFoundText')}</p>
        <Link to="/" className="mt-6 inline-block font-semibold text-brand hover:underline">
          {t('notFound.backHome')}
        </Link>
      </section>
    )
  }

  return <ListingView key={data.id} listing={data} category={category} visibleToAll={isVisibleToAll} />
}

function ListingView({
  listing,
  category,
  visibleToAll,
}: {
  listing: ListingDetails
  category: CategoryConfig
  visibleToAll: boolean
}) {
  const { t, i18n } = useTranslation()
  const lng = i18n.resolvedLanguage
  const localities = useLocalities()
  const locality = localities.data?.find((item) => item.id === listing.localityId)
  const conditionGroup = category.conditionLabels

  return (
    <div className="space-y-8">
      <nav aria-label={t('listing.breadcrumb')} className="text-sm text-slate-600">
        <Link to="/" className="hover:underline">
          {t('listing.home')}
        </Link>
        <span aria-hidden="true"> › </span>
        <Link to={`/c/${category.slug}`} className="hover:underline">
          {t(`categories.${category.slug}`)}
        </Link>
      </nav>

      {!visibleToAll && (
        <Alert kind="warning">
          {listing.status === 'draft' ? t('listing.notPublicDraft') : t('listing.notPublic')}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <ListingGallery photos={listing.photos} title={listing.title} fallbackIcon={category.icon} />

          <div className="space-y-2">
            {/* user text: React shows it as plain text, never as HTML */}
            <h1 className="text-2xl font-semibold break-words">{listing.title}</h1>
            <p className="text-3xl font-semibold text-ink">
              {formatPrice(listing.price, listing.currency, lng)}
              {listing.negotiable && (
                <span className="ml-2 align-middle text-sm font-medium text-slate-600">{t('listingForm.negotiable')}</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {listing.hasImei && <Badge>{t('listing.imeiBadge')}</Badge>}
              {listing.hasVin && <Badge>{t('listing.vinBadge')}</Badge>}
            </div>
            <p className="text-sm text-slate-500">
              {locality ? `${localizedName(locality, lng)} · ` : ''}
              {t('listing.publishedOn', { date: formatDate(listing.createdAt, lng) })} ·{' '}
              {t('myListings.views', { count: listing.views })}
            </p>
          </div>

          <section aria-labelledby="characteristics-heading" className="space-y-2">
            <h2 id="characteristics-heading" className="text-lg font-semibold">
              {t('listing.characteristics')}
            </h2>
            <AttributeList
              category={category}
              attributes={listing.attributes}
              extraRows={[
                {
                  key: 'condition',
                  label: t('listingForm.condition'),
                  value:
                    listing.condition === 'new'
                      ? t(`listingForm.conditionOptions.${conditionGroup}.new`)
                      : t(`listingForm.conditionOptions.${conditionGroup}.used`),
                },
              ]}
            />
          </section>

          {listing.compatibility.length > 0 && (
            <section aria-labelledby="compat-heading" className="space-y-2">
              <h2 id="compat-heading" className="text-lg font-semibold">
                {t('listingForm.compatibilityTitle')}
              </h2>
              <ul className="divide-y divide-slate-100 rounded-card border border-line bg-surface text-sm">
                {listing.compatibility.map((row, index) => (
                  <li key={index} className="flex justify-between gap-3 px-4 py-2.5">
                    <span className="font-medium">
                      {row.makeName} {row.modelName ?? `(${t('listingForm.compatibilityAllModels')})`}
                    </span>
                    <span className="text-slate-600">
                      {row.yearFrom}–{row.yearTo}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {listing.description && (
            <section aria-labelledby="description-heading" className="space-y-2">
              <h2 id="description-heading" className="text-lg font-semibold">
                {t('listingForm.description')}
              </h2>
              <p className="rounded-card border border-line bg-surface p-4 break-words whitespace-pre-line text-slate-800">
                {listing.description}
              </p>
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <SellerBox listing={listing} />
        </div>
      </div>

      <SimilarListings listing={listing} category={category} />
    </div>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-success-50 px-2 py-0.5 text-sm font-semibold text-success ring-1 ring-success-200">
      <span aria-hidden="true">✓</span>
      {children}
    </span>
  )
}

/** Same category and, when set, the same brand / make / type (first field of the category). */
function SimilarListings({ listing, category }: { listing: ListingDetails; category: CategoryConfig }) {
  const { t } = useTranslation()
  const firstField = category.fields[0]
  const value = firstField ? listing.attributes[firstField.key] : undefined
  const result = useSearchListings({
    p_category_id: category.id,
    p_exclude_id: listing.id,
    p_limit: 8,
    ...(value !== undefined ? { p_attributes: { [firstField.key]: value } } : {}),
  })

  if (!result.data || result.data.items.length === 0) return null
  return (
    <section aria-labelledby="similar-heading" className="space-y-3">
      <h2 id="similar-heading" className="text-lg font-semibold">
        {t('listing.similar')}
      </h2>
      <ListingGrid listings={result.data.items} />
    </section>
  )
}
