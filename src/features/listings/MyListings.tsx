import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
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
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                group === g
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-slate-300 bg-surface text-slate-700 hover:bg-slate-50'
              }`}
            >
              {translateKey(t, `myListings.groups.${g}`)} ({counts[g]})
            </button>
          ))}
        </div>
        <Link
          to="/new"
          className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + {t('header.addListing')}
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-surface p-6 text-center text-slate-500">
          {t('myListings.empty')}
        </p>
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
    <li className="rounded-xl border border-slate-200 bg-surface p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:size-24">
          {listing.coverPath ? (
            <img
              src={publicPhotoUrl(listing.coverPath)}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div aria-hidden="true" className="flex size-full items-center justify-center text-2xl">
              {category?.icon}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{listing.title}</p>
          <p className="font-bold text-brand-700">{formatPrice(listing.price, listing.currency, i18n.resolvedLanguage)}</p>
          <p className="text-xs text-slate-500">
            {category ? t(`categories.${category.slug}`) : ''}
            {group === 'active' &&
              ` · ${t('myListings.expiresOn', { date: formatDate(listing.expires_at, i18n.resolvedLanguage) })}`}
            {group === 'expired' &&
              ` · ${t('myListings.expiredOn', { date: formatDate(listing.expires_at, i18n.resolvedLanguage) })}`}
            {group !== 'draft' && ` · ${t('myListings.views', { count: listing.views })}`}
          </p>
          {group === 'hidden' && (
            <p className="mt-1 text-xs font-medium text-red-700">
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

      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {group === 'draft' && (
          <>
            <LinkButton to={`/a/${listing.id}/edit`}>{t('myListings.finish')}</LinkButton>
            <Button variant="secondary" disabled={busy} onClick={() => run('publish')}>
              {t('listingForm.publish')}
            </Button>
          </>
        )}
        {group === 'active' && (
          <>
            <LinkButton to={`/a/${listing.id}`}>{t('myListings.view')}</LinkButton>
            <LinkButton to={`/a/${listing.id}/edit`}>{t('myListings.edit')}</LinkButton>
            <Button variant="secondary" disabled={busy} onClick={() => run('sold')}>
              {t('myListings.markSold')}
            </Button>
          </>
        )}
        {(group === 'sold' || group === 'expired') && (
          <>
            <LinkButton to={`/a/${listing.id}/edit`}>{t('myListings.edit')}</LinkButton>
            <Button variant="secondary" disabled={busy} onClick={() => run('reactivate')}>
              {t('myListings.reactivate')}
            </Button>
          </>
        )}

        {confirmDelete ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-700">{t('myListings.deleteConfirm')}</span>
            <Button variant="danger" disabled={busy} onClick={() => run('delete')}>
              {t('myListings.deleteYes')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              {t('myListings.deleteNo')}
            </Button>
          </span>
        ) : (
          <Button variant="ghost" className="ml-auto text-red-700" onClick={() => setConfirmDelete(true)}>
            {t('myListings.delete')}
          </Button>
        )}
      </div>
    </li>
  )
}

function LinkButton({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-surface px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
    >
      {children}
    </Link>
  )
}
