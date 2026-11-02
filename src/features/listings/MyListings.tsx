import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { CategoryIcon } from '../../components/CategoryIcon'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import { EmptyState } from '../../components/ui/EmptyState'
import { Sheet } from '../../components/ui/Sheet'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { translateKey } from '../../i18n/translate'
import { categoryById } from '../../lib/categories'
import { formatDate, formatPrice } from '../../lib/format'
import { errorToKey } from '../auth/authErrors'
import type { MyListing } from './api'
import { useListingAction, useMyListings } from './hooks'
import { publicPhotoUrl } from './photos'

type Group = 'active' | 'draft' | 'sold' | 'expired' | 'hidden'
const GROUPS: Group[] = ['active', 'draft', 'sold', 'expired', 'hidden']

function groupOf(listing: MyListing, now: number): Group {
  if (listing.status === 'draft') return 'draft'
  if (listing.status === 'sold') return 'sold'
  if (listing.status === 'hidden' || listing.status === 'rejected') return 'hidden'
  return new Date(listing.expires_at).getTime() <= now ? 'expired' : 'active'
}

/** Contul meu -> Anunțurile mele: active, drafts, sold, expired, hidden (plan, section 7). */
export function MyListings({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const listings = useMyListings(userId)
  const [group, setGroup] = useState<Group>('active')
  const [now] = useState(() => Date.now())

  if (listings.isPending) return <LoadingState />
  if (listings.isError) return <ErrorState error={listings.error} onRetry={() => void listings.refetch()} />

  const counts = Object.fromEntries(GROUPS.map((g) => [g, 0])) as Record<Group, number>
  for (const listing of listings.data) counts[groupOf(listing, now)] += 1
  const visible = listings.data.filter((listing) => groupOf(listing, now) === group)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label={t('account.tabs.listings')} className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm ${
                group === g
                  ? 'border-brand bg-brand-50 font-medium text-brand'
                  : 'border-line-strong bg-surface text-ink hover:bg-paper'
              }`}
            >
              {translateKey(t, `myListings.groups.${g}`)}
              <span className="tabular opacity-70">{counts[g]}</span>
            </button>
          ))}
        </div>
        <Link to="/new" className={buttonClass('action', 'compact')}>
          <Plus aria-hidden="true" className="size-5" strokeWidth={2} />
          {t('header.addListing')}
        </Link>
      </div>

      {visible.length === 0 ? (
        <EmptyState text={t('myListings.empty')} />
      ) : (
        <ul className="space-y-3">
          {visible.map((listing) => (
            <MyListingCard key={listing.id} listing={listing} group={group} userId={userId} />
          ))}
        </ul>
      )}
    </div>
  )
}

function MyListingCard({ listing, group, userId }: { listing: MyListing; group: Group; userId: string }) {
  const { t, i18n } = useTranslation()
  const action = useListingAction(userId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const category = categoryById(listing.category_id)
  const busy = action.isPending

  const run = (type: 'sold' | 'active' | 'reactivate' | 'publish' | 'delete') =>
    action.mutate({ type, listingId: listing.id })

  return (
    <li className="rounded-card border border-line bg-surface p-3">
      <div className="flex gap-3">
        <div className="size-20 shrink-0 overflow-hidden rounded-field bg-paper sm:size-24">
          {listing.coverPath ? (
            <img
              src={publicPhotoUrl(listing.coverPath)}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted">
              {category && <CategoryIcon name={category.icon} className="size-7" />}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-price text-ink">{formatPrice(listing.price, listing.currency, i18n.resolvedLanguage)}</p>
          {/* user text: React shows it as plain text */}
          <p className="line-clamp-2 font-medium break-words text-ink">{listing.title}</p>
          <p className="mt-0.5 text-sm text-muted">
            {category ? t(`categories.${category.slug}`) : ''}
            {group === 'active' &&
              ` · ${t('myListings.expiresOn', { date: formatDate(listing.expires_at, i18n.resolvedLanguage) })}`}
            {group === 'expired' &&
              ` · ${t('myListings.expiredOn', { date: formatDate(listing.expires_at, i18n.resolvedLanguage) })}`}
            {group !== 'draft' && ` · ${t('myListings.views', { count: listing.views })}`}
          </p>
          {group === 'hidden' && (
            <p className="mt-1 text-sm font-medium text-danger">
              {listing.status === 'rejected' ? t('myListings.rejectedNotice') : t('myListings.hiddenNotice')}
            </p>
          )}
        </div>
      </div>

      {action.isError && (
        <div className="mt-2">
          <Alert kind="error">{translateKey(t, errorToKey(action.error))}</Alert>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
        {group === 'draft' && (
          <>
            <LinkButton to={`/a/${listing.id}/edit`}>{t('myListings.finish')}</LinkButton>
            <Button variant="secondary" size="compact" disabled={busy} onClick={() => run('publish')}>
              {t('listingForm.publish')}
            </Button>
          </>
        )}
        {group === 'active' && (
          <>
            <LinkButton to={`/a/${listing.id}`}>{t('myListings.view')}</LinkButton>
            <LinkButton to={`/a/${listing.id}/edit`}>{t('myListings.edit')}</LinkButton>
            <Button variant="secondary" size="compact" disabled={busy} onClick={() => run('sold')}>
              {t('myListings.markSold')}
            </Button>
          </>
        )}
        {(group === 'sold' || group === 'expired') && (
          <>
            <LinkButton to={`/a/${listing.id}/edit`}>{t('myListings.edit')}</LinkButton>
            <Button variant="secondary" size="compact" disabled={busy} onClick={() => run('reactivate')}>
              {t('myListings.reactivate')}
            </Button>
          </>
        )}

        <Button variant="danger" size="compact" className="ml-auto" onClick={() => setConfirmDelete(true)}>
          {t('myListings.delete')}
        </Button>
      </div>

      {/* deleting cannot be undone: ask in a window first */}
      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t('myListings.deleteConfirm')}>
        {/* user text: React shows it as plain text */}
        <p className="text-muted">{listing.title}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button variant="danger" fullWidth loading={busy} onClick={() => run('delete')}>
            {t('myListings.deleteYes')}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>
            {t('myListings.deleteNo')}
          </Button>
        </div>
      </Sheet>
    </li>
  )
}

function LinkButton({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className={buttonClass('secondary', 'compact')}>
      {children}
    </Link>
  )
}
