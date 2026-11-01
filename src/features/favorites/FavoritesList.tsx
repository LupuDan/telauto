import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ListingGrid, ListingGridSkeleton } from '../../components/ListingCard'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { translateKey } from '../../i18n/translate'
import { errorToKey } from '../auth/authErrors'
import { useFavorites, useToggleFavorite } from './api'

/** "Contul meu → Favorite". The ♡ on each card removes it from the list. */
export function FavoritesList() {
  const { t } = useTranslation()
  const favorites = useFavorites()
  const toggle = useToggleFavorite()

  if (favorites.isPending) return <ListingGridSkeleton count={4} />
  if (favorites.isError) return <ErrorState error={favorites.error} onRetry={() => void favorites.refetch()} />

  const available = favorites.data.flatMap((item) => (item.available ? [item.listing] : []))
  const unavailable = favorites.data.filter((item) => !item.available)

  if (favorites.data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-surface p-6 text-center">
        <p className="text-slate-600">{t('favorites.empty')}</p>
        <Link to="/search" className="mt-3 inline-block font-semibold text-brand-700 hover:underline">
          {t('favorites.browse')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toggle.isError && <Alert kind="error">{translateKey(t, errorToKey(toggle.error))}</Alert>}
      {available.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">{t('favorites.hint')}</p>
          <ListingGrid listings={available} />
        </div>
      )}

      {unavailable.length > 0 && (
        <section aria-labelledby="unavailable-heading" className="space-y-2">
          <h2 id="unavailable-heading" className="text-base font-semibold">
            {t('favorites.unavailableHeading')}
          </h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-surface">
            {unavailable.map((item) => (
              <li key={item.listingId} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  {/* user text: plain text */}
                  <span className="block truncate font-medium text-slate-700">
                    {!item.available && item.title ? item.title : t('favorites.unavailableTitle')}
                  </span>
                  <span className="block text-xs text-slate-500">{t('favorites.unavailableText')}</span>
                </span>
                <Button
                  variant="secondary"
                  onClick={() => toggle.mutate({ listingId: item.listingId, save: false })}
                >
                  {t('favorites.removeShort')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
