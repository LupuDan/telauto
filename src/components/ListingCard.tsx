import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAuth } from '../features/auth/authContext'
import { FavoriteButton } from '../features/favorites/FavoriteButton'
import { cardFacts } from '../features/listings/attributeDisplay'
import { publicPhotoUrl } from '../features/listings/photos'
import { useLocalities } from '../features/reference/hooks'
import type { ListingSummary } from '../features/search/api'
import { categoryById } from '../lib/categories'
import { formatPrice, formatShortDate, localizedName } from '../lib/format'

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const { t, i18n } = useTranslation()
  const lng = i18n.resolvedLanguage
  const localities = useLocalities()
  const category = categoryById(listing.categoryId)
  const locality = localities.data?.find((item) => item.id === listing.localityId)
  const facts = category ? cardFacts(t, category, listing.attributes, lng) : []
  const { user } = useAuth()
  const isOwn = user?.id === listing.userId

  return (
    <div className="relative h-full">
      <Link
        to={`/a/${listing.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-600 hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <div className="relative aspect-[4/3] bg-slate-100">
          {listing.coverPath ? (
            <img
              src={publicPhotoUrl(listing.coverPath)}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <span aria-hidden="true" className="flex size-full items-center justify-center text-4xl">
              {category?.icon}
            </span>
          )}
          {(listing.hasImei || listing.hasVin) && (
            <span className="absolute top-2 left-2 rounded-md bg-emerald-700/90 px-1.5 py-0.5 text-xs font-semibold text-white">
              {listing.hasImei ? t('listing.imeiBadge') : t('listing.vinBadge')}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="text-lg font-bold text-slate-900">
            {formatPrice(listing.price, listing.currency, lng)}
            {listing.negotiable && (
              <span className="ml-1 text-xs font-normal text-slate-500">{t('listing.negotiableShort')}</span>
            )}
          </p>
          {/* user text: React shows it as plain text */}
          <h3 className="line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-brand-700">{listing.title}</h3>
          {facts.length > 0 && <p className="line-clamp-1 text-xs text-slate-600">{facts.join(' · ')}</p>}
          <p className="mt-auto pt-1 text-xs text-slate-500">
            {locality ? localizedName(locality, lng) : ''}
          {locality ? ' · ' : ''}
          {formatShortDate(listing.createdAt, lng)}
        </p>
      </div>
    </Link>
      {!isOwn && (
        <div className="absolute top-2 right-2">
          <FavoriteButton listingId={listing.id} />
        </div>
      )}
    </div>
  )
}

export function ListingGrid({ listings }: { listings: ListingSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing) => (
        <li key={listing.id}>
          <ListingCard listing={listing} />
        </li>
      ))}
    </ul>
  )
}

/** Grey boxes shown while the first results load. */
export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul aria-hidden="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-2 p-3">
            <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </li>
      ))}
    </ul>
  )
}
