import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ListingCard, ListingGridSkeleton } from '../../components/ListingCard'
import { Logo } from '../../components/Logo'
import { Alert } from '../../components/ui/Alert'
import { buttonClass } from '../../components/ui/buttonStyles'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { translateKey } from '../../i18n/translate'
import { formatPrice } from '../../lib/format'
import { errorToKey } from '../auth/authErrors'
import { publicPhotoUrl } from '../listings/photos'
import { FavoriteButton } from './FavoriteButton'
import { useFavorites, useToggleFavorite, type FavoriteItem } from './api'

/**
 * "Contul meu → Favorite" (plan de design, 6.6): 2-column grid with the same cards as the search.
 * The full heart removes a listing ("Scos din favorite" + "Anulează").
 * Listings sold or expired meanwhile stay, with a faded photo and the badge "Indisponibil".
 */
export function FavoritesList() {
  const { t } = useTranslation()
  const favorites = useFavorites()
  const toggle = useToggleFavorite()

  if (favorites.isPending) return <ListingGridSkeleton count={4} />
  if (favorites.isError) return <ErrorState error={favorites.error} onRetry={() => void favorites.refetch()} />

  if (favorites.data.length === 0) {
    return (
      <EmptyState
        text={t('favorites.empty')}
        action={
          <Link to="/search" className={buttonClass('secondary')}>
            {t('favorites.browse')}
          </Link>
        }
      />
    )
  }

  const unavailable = favorites.data.filter((item) => !item.available)

  return (
    <div className="space-y-3">
      {toggle.isError && <Alert kind="error">{translateKey(t, errorToKey(toggle.error))}</Alert>}
      {unavailable.length > 0 && (
        <button
          type="button"
          disabled={toggle.isPending}
          onClick={() => {
            for (const item of unavailable) toggle.mutate({ listingId: item.listingId, save: false })
          }}
          className="inline-flex min-h-11 items-center font-medium text-brand hover:underline disabled:opacity-60"
        >
          {t('favorites.removeUnavailable')}
        </button>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
        {favorites.data.map((item) => (
          <li key={item.listingId}>
            {item.available ? <ListingCard listing={item.listing} /> : <UnavailableCard item={item} />}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Same shape as the card, not a link (the listing cannot be opened any more). */
function UnavailableCard({ item }: { item: Extract<FavoriteItem, { available: false }> }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="relative h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper">
          {item.coverPath ? (
            <img
              src={publicPhotoUrl(item.coverPath)}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover opacity-40 grayscale"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center">
              <Logo variant="icon" tone="muted" className="size-10" />
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <span className="self-start rounded-full bg-paper px-2 py-0.5 type-micro font-semibold text-muted">
            {t('favorites.unavailableBadge')}
          </span>
          {item.price !== null && item.currency && (
            <p className="type-price text-muted">{formatPrice(item.price, item.currency, i18n.resolvedLanguage)}</p>
          )}
          {/* user text: plain text */}
          <h3 className="line-clamp-2 text-[15px] leading-5 font-medium break-words text-muted">
            {item.title ?? t('favorites.unavailableTitle')}
          </h3>
        </div>
      </div>
      <div className="absolute top-1 right-1">
        <FavoriteButton listingId={item.listingId} />
      </div>
    </div>
  )
}
