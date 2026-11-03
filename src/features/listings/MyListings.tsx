import { Ellipsis, Eye, Heart, Pencil, Plus, RotateCw, Send, Share2, SquareCheckBig, Trash2, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { CategoryIcon } from '../../components/CategoryIcon'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Sheet } from '../../components/ui/Sheet'
import { Spinner } from '../../components/ui/Spinner'
import { translateKey } from '../../i18n/translate'
import { categoryById } from '../../lib/categories'
import { formatPrice } from '../../lib/format'
import { getSiteBaseUrl } from '../../lib/siteUrl'
import { toast } from '../../lib/toast'
import { useIsDesktop } from '../../lib/useIsDesktop'
import { usePullToRefresh } from '../../lib/usePullToRefresh'
import { errorToKey } from '../auth/authErrors'
import type { MyListing } from './api'
import { useListingAction, useMyListings, useMyListingSaves } from './hooks'
import { daysLeft, groupOf, isExpiringSoon, type ListingGroup } from './myListingGroups'
import { publicPhotoUrl } from './photos'

/** Pills on top of the list (plan de design, 6.6). "Ciorne" (drafts) are listings not published yet. */
type Filter = 'active' | 'expiring' | 'sold' | 'expired' | 'hidden' | 'draft'
const FILTERS: Filter[] = ['active', 'expiring', 'sold', 'expired', 'hidden', 'draft']
const PAGE = 20

type ActionType = 'sold' | 'active' | 'reactivate' | 'publish' | 'delete'
type Row = { listing: MyListing; group: ListingGroup; expiring: boolean; saves: number }

function matches(row: Row, filter: Filter) {
  return filter === 'expiring' ? row.expiring : row.group === filter
}

/** The draft opens in the form; everything else opens the public page, exactly as buyers see it. */
function rowHref(row: Row) {
  return row.group === 'draft' ? `/a/${row.listing.id}/edit` : `/a/${row.listing.id}`
}

/** Which actions make sense for this listing (the "⋯" panel shows only these). */
function actionsOf(row: Row) {
  const { group, expiring } = row
  return {
    edit: group !== 'hidden',
    markSold: group === 'active',
    reactivate: group === 'expired' || group === 'sold' || expiring,
    publish: group === 'draft',
    share: group === 'active',
  }
}

/**
 * "Contul meu → Anunțurile mele" (plan de design, 6.6).
 * Phones: one compact row per listing (72 px photo, title, price, state, views and saves, "⋯").
 * Computers: a table with photo, title, price, state, views and actions; "⋯" opens a small menu.
 */
export function MyListings({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const listings = useMyListings(userId)
  const saves = useMyListingSaves(userId)
  const action = useListingAction(userId)
  const isDesktop = useIsDesktop()
  const [params, setParams] = useSearchParams()
  const [now] = useState(() => Date.now())
  const [shown, setShown] = useState(PAGE)
  const [menuFor, setMenuFor] = useState<Row | null>(null)
  const [deleteFor, setDeleteFor] = useState<Row | null>(null)
  const [whyFor, setWhyFor] = useState<Row | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const refresh = useCallback(() => Promise.all([listings.refetch(), saves.refetch()]), [listings, saves])
  const { pull, ready, refreshing } = usePullToRefresh(refresh)

  const paramFilter = params.get('f') as Filter | null
  const filter: Filter = paramFilter && FILTERS.includes(paramFilter) ? paramFilter : 'active'

  if (listings.isPending) return <LoadingState />
  if (listings.isError) return <ErrorState error={listings.error} onRetry={() => void listings.refetch()} />

  const rows: Row[] = listings.data.map((listing) => ({
    listing,
    group: groupOf(listing, now),
    expiring: isExpiringSoon(listing, now),
    saves: saves.data?.get(listing.id) ?? 0,
  }))

  if (rows.length === 0) {
    return (
      <EmptyState
        text={t('myListings.emptyAll')}
        action={
          <Link to="/new" className={buttonClass('action')}>
            <Plus aria-hidden="true" className="size-5" strokeWidth={2} />
            {t('header.addListing')}
          </Link>
        }
      />
    )
  }

  const counts = Object.fromEntries(FILTERS.map((f) => [f, rows.filter((row) => matches(row, f)).length])) as Record<
    Filter,
    number
  >
  // pills with zero listings are not shown, except "Active"
  const pills = FILTERS.filter((f) => f === 'active' || f === filter || counts[f] > 0)
  const visible = rows.filter((row) => matches(row, filter))

  function chooseFilter(f: Filter) {
    setShown(PAGE)
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('f', f)
        next.delete('notice')
        next.delete('id')
        return next
      },
      { replace: true },
    )
  }

  function run(type: ActionType, row: Row) {
    setMenuFor(null)
    setPendingId(row.listing.id)
    action.mutate(
      { type, listingId: row.listing.id },
      {
        onSuccess: () => {
          if (type === 'delete') setDeleteFor(null)
          // marked as sold at once, with "Anulează" for 5 seconds
          if (type === 'sold') {
            toast(t('myListings.soldToast'), {
              action: {
                label: t('common.undo'),
                onClick: () => action.mutate({ type: 'active', listingId: row.listing.id }),
              },
            })
          }
        },
        onSettled: () => setPendingId(null),
      },
    )
  }

  async function share(row: Row) {
    setMenuFor(null)
    const url = `${getSiteBaseUrl()}#/a/${row.listing.id}`
    try {
      if (navigator.share) await navigator.share({ title: row.listing.title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast(t('myListings.linkCopied'))
      }
    } catch {
      // the share menu was closed: nothing to do
    }
  }

  const rowProps = {
    pendingId,
    onMenu: setMenuFor,
    onWhy: setWhyFor,
    onReactivate: (row: Row) => run('reactivate', row),
  }
  const menu = (row: Row) => (
    <ActionList
      row={row}
      onEdit={() => setMenuFor(null)}
      onSold={() => run('sold', row)}
      onReactivate={() => run('reactivate', row)}
      onPublish={() => run('publish', row)}
      onShare={() => void share(row)}
      onDelete={() => {
        setMenuFor(null)
        setDeleteFor(row)
      }}
    />
  )

  return (
    <div className="space-y-3">
      {/* pull-to-refresh indicator (phones) */}
      {(pull > 0 || refreshing) && (
        <div
          aria-live="polite"
          className="flex items-center justify-center gap-2 text-sm text-muted"
          style={{ height: refreshing ? 40 : pull / 2 }}
        >
          {refreshing ? (
            <>
              <Spinner className="size-4" />
              {t('myListings.refreshing')}
            </>
          ) : (
            <RotateCw aria-hidden="true" className={`size-5 ${ready ? 'text-brand' : ''}`} style={{ rotate: `${pull * 3}deg` }} />
          )}
        </div>
      )}

      {/* the pills scroll sideways and stay at the top while the list scrolls */}
      <div className="sticky top-0 z-20 -mx-4 bg-paper px-4 py-2 lg:static lg:mx-0 lg:px-0">
        <div role="group" aria-label={t('myListings.filtersLabel')} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {pills.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => chooseFilter(f)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm whitespace-nowrap ${
                filter === f
                  ? 'border-brand bg-brand-50 font-medium text-brand'
                  : 'border-line-strong bg-surface text-ink hover:bg-paper'
              }`}
            >
              {translateKey(t, `myListings.groups.${f}`)}
              <span className="tabular opacity-70">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {action.isError && <Alert kind="error">{translateKey(t, errorToKey(action.error))}</Alert>}

      {visible.length === 0 ? (
        <EmptyState text={t('myListings.empty')} />
      ) : isDesktop ? (
        <ListingTable rows={visible.slice(0, shown)} menuFor={menuFor} menu={menu} onCloseMenu={() => setMenuFor(null)} {...rowProps} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {visible.slice(0, shown).map((row) => (
            <ListingRow key={row.listing.id} row={row} {...rowProps} />
          ))}
        </ul>
      )}

      {/* more listings load by themselves when the end of the list comes into view */}
      {visible.length > shown && <LoadMore onVisible={() => setShown((value) => value + PAGE)} />}

      {/* only while the list is short */}
      {rows.length < 5 && (
        <div className="flex justify-center pt-2">
          <Link to="/new" className={buttonClass('action')}>
            <Plus aria-hidden="true" className="size-5" strokeWidth={2} />
            {t('header.addListing')}
          </Link>
        </div>
      )}

      {/* phones: "⋯" opens a panel from the bottom */}
      <Sheet open={!isDesktop && menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor?.listing.title ?? ''}>
        {menuFor && (
          <div className="-mx-4 -my-4">
            {menu(menuFor)}
            <div className="border-t border-line p-4">
              <Button variant="secondary" fullWidth onClick={() => setMenuFor(null)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* deleting cannot be undone: ask in a window first */}
      <Sheet open={deleteFor !== null} onClose={() => setDeleteFor(null)} title={t('myListings.deleteConfirm')}>
        {deleteFor && (
          <>
            {/* user text: React shows it as plain text */}
            <p className="text-muted">{deleteFor.listing.title}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button
                variant="danger"
                fullWidth
                loading={pendingId === deleteFor.listing.id}
                onClick={() => run('delete', deleteFor)}
              >
                {t('myListings.deleteYes')}
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setDeleteFor(null)}>
                {t('myListings.deleteNo')}
              </Button>
            </div>
          </>
        )}
      </Sheet>

      <Sheet open={whyFor !== null} onClose={() => setWhyFor(null)} title={t('myListings.whyTitle')}>
        <p className="text-ink">
          {whyFor?.listing.status === 'rejected' ? t('myListings.rejectedNotice') : t('myListings.hiddenNotice')}
        </p>
        <Link to="/p/terms" className="mt-3 inline-flex min-h-11 items-center font-medium text-brand hover:underline">
          {t('auth.termsLink')}
        </Link>
      </Sheet>
    </div>
  )
}

type RowProps = {
  pendingId: string | null
  onMenu: (row: Row) => void
  onWhy: (row: Row) => void
  onReactivate: (row: Row) => void
}

/** Phones and tablets: one horizontal row per listing. Pressing the row (outside the buttons) opens it. */
function ListingRow({ row, pendingId, onMenu, onWhy, onReactivate }: { row: Row } & RowProps) {
  const { t, i18n } = useTranslation()
  const { listing } = row
  return (
    <li className="relative flex gap-3 p-3 hover:bg-paper">
      <Thumb listing={listing} className="size-18" />
      <div className="min-w-0 flex-1">
        {/* the link covers the whole row (after:absolute) */}
        <Link
          to={rowHref(row)}
          className="line-clamp-2 font-medium break-words text-ink after:absolute after:inset-0 after:content-['']"
        >
          {listing.title}
        </Link>
        <p className="type-price text-ink">{formatPrice(listing.price, listing.currency, i18n.resolvedLanguage)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <StatusBadge row={row} onWhy={onWhy} />
          <Stats row={row} />
        </div>
        <DirectAction row={row} pending={pendingId === listing.id} onReactivate={onReactivate} className="mt-2" />
      </div>
      <MenuButton
        label={t('myListings.actionsFor', { title: listing.title })}
        onClick={() => onMenu(row)}
        className="relative z-10 -mr-2 self-start"
      />
    </li>
  )
}

/** Computers: a table with columns for photo, title, price, state, views and actions. */
function ListingTable({
  rows,
  menuFor,
  menu,
  onCloseMenu,
  ...rowProps
}: {
  rows: Row[]
  menuFor: Row | null
  menu: (row: Row) => ReactNode
  onCloseMenu: () => void
} & RowProps) {
  const { t, i18n } = useTranslation()
  const head = 'px-3 py-2 text-left text-sm font-medium text-muted'
  return (
    <div className="rounded-card border border-line bg-surface">
      <table className="w-full border-collapse">
        <thead className="border-b border-line">
          <tr>
            <th className={`${head} w-24`}>
              <span className="sr-only">{t('myListings.colPhoto')}</span>
            </th>
            <th className={head}>{t('myListings.colTitle')}</th>
            <th className={`${head} text-right`}>{t('myListings.colPrice')}</th>
            <th className={head}>{t('myListings.colStatus')}</th>
            <th className={head}>{t('myListings.colStats')}</th>
            <th className={`${head} text-right`}>
              <span className="sr-only">{t('myListings.colActions')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.listing.id} className="relative hover:bg-paper">
              <td className="px-3 py-2">
                <Thumb listing={row.listing} className="size-18" />
              </td>
              <td className="max-w-80 px-3 py-2">
                <Link
                  to={rowHref(row)}
                  className="line-clamp-2 font-medium break-words text-ink after:absolute after:inset-0 after:content-[''] hover:underline"
                >
                  {row.listing.title}
                </Link>
              </td>
              <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-ink tabular">
                {formatPrice(row.listing.price, row.listing.currency, i18n.resolvedLanguage)}
              </td>
              <td className="px-3 py-2">
                <StatusBadge row={row} onWhy={rowProps.onWhy} showActive />
              </td>
              <td className="px-3 py-2">
                <Stats row={row} />
              </td>
              <td className="px-3 py-2">
                {/* the row with the open menu stays above the next rows */}
                <div
                  className={`relative flex items-center justify-end gap-1 ${
                    menuFor?.listing.id === row.listing.id ? 'z-30' : 'z-10'
                  }`}
                >
                  <DirectAction row={row} pending={rowProps.pendingId === row.listing.id} onReactivate={rowProps.onReactivate} />
                  <div className="relative">
                    <MenuButton
                      label={t('myListings.actionsFor', { title: row.listing.title })}
                      expanded={menuFor?.listing.id === row.listing.id}
                      onClick={() => (menuFor?.listing.id === row.listing.id ? onCloseMenu() : rowProps.onMenu(row))}
                    />
                    {menuFor?.listing.id === row.listing.id && <PopoverMenu onClose={onCloseMenu}>{menu(row)}</PopoverMenu>}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Small menu under "⋯" on computers; closes on Esc or a click outside it. */
function PopoverMenu({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node
      // the "⋯" button itself toggles the menu
      if (ref.current && !ref.current.contains(target) && !ref.current.parentElement?.contains(target)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [onClose])
  return (
    <div ref={ref} className="absolute top-full right-0 z-30 mt-1 w-64 overflow-hidden rounded-card border border-line bg-surface py-1 shadow-float">
      {children}
    </div>
  )
}

/** The rows of the "⋯" panel / menu: only the actions that make sense, "Șterge anunțul" in red, last. */
function ActionList({
  row,
  onEdit,
  onSold,
  onReactivate,
  onPublish,
  onShare,
  onDelete,
}: {
  row: Row
  onEdit: () => void
  onSold: () => void
  onReactivate: () => void
  onPublish: () => void
  onShare: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const can = actionsOf(row)
  const id = row.listing.id
  return (
    <ul className="divide-y divide-line">
      {can.edit && (
        <li>
          <Link to={`/a/${id}/edit`} onClick={onEdit} className={actionClass}>
            <ActionIcon Icon={Pencil} />
            {t('myListings.edit')}
          </Link>
        </li>
      )}
      {can.publish && <ActionButton Icon={Send} label={t('listingForm.publish')} onClick={onPublish} />}
      {can.markSold && <ActionButton Icon={SquareCheckBig} label={t('myListings.markSoldFull')} onClick={onSold} />}
      {can.reactivate && <ActionButton Icon={RotateCw} label={t('myListings.reactivate')} onClick={onReactivate} />}
      {can.share && <ActionButton Icon={Share2} label={t('myListings.share')} onClick={onShare} />}
      <ActionButton Icon={Trash2} label={t('myListings.deleteFull')} onClick={onDelete} danger />
    </ul>
  )
}

const actionClass = 'flex min-h-14 w-full items-center gap-3 px-4 text-left text-ink hover:bg-paper lg:min-h-11'

function ActionIcon({ Icon }: { Icon: LucideIcon }) {
  return <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
}

function ActionButton({ Icon, label, onClick, danger = false }: { Icon: LucideIcon; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={`${actionClass} ${danger ? 'text-danger' : ''}`}>
        <ActionIcon Icon={Icon} />
        {label}
      </button>
    </li>
  )
}

function MenuButton({
  label,
  onClick,
  expanded,
  className = '',
}: {
  label: string
  onClick: () => void
  expanded?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-haspopup="menu"
      aria-expanded={expanded}
      className={`flex size-11 shrink-0 items-center justify-center rounded-field text-ink hover:bg-paper ${className}`}
    >
      <Ellipsis aria-hidden="true" className="size-5" strokeWidth={2} />
    </button>
  )
}

/** The most likely action, right in the row: "Reactivează" (expired / expiring soon), "Finalizează" (draft). */
function DirectAction({
  row,
  pending,
  onReactivate,
  className = '',
}: {
  row: Row
  pending: boolean
  onReactivate: (row: Row) => void
  className?: string
}) {
  const { t } = useTranslation()
  if (row.group === 'draft') {
    return (
      <Link to={`/a/${row.listing.id}/edit`} className={`${buttonClass('secondary', 'compact')} relative z-10 ${className}`}>
        {t('myListings.finish')}
      </Link>
    )
  }
  if (row.group !== 'expired' && !row.expiring) return null
  return (
    <Button
      variant="secondary"
      size="compact"
      loading={pending}
      onClick={() => onReactivate(row)}
      className={`relative z-10 ${className}`}
    >
      {t('myListings.reactivate')}
    </Button>
  )
}

/**
 * State under the price: "Vândut" and "Expirat" grey, "Ascuns de moderator" red with "De ce?",
 * "Expiră în 2 zile" yellow. Active listings have no badge on phones (the table shows "Activ").
 */
function StatusBadge({ row, onWhy, showActive = false }: { row: Row; onWhy: (row: Row) => void; showActive?: boolean }) {
  const { t } = useTranslation()
  const [now] = useState(() => Date.now())
  const pill = 'rounded-full px-2 py-0.5 type-micro font-semibold whitespace-nowrap'
  const grey = `${pill} bg-paper text-muted`

  if (row.group === 'hidden') {
    return (
      <span className="flex flex-wrap items-center gap-x-2">
        <span className={`${pill} bg-danger-50 text-danger`}>
          {row.listing.status === 'rejected' ? t('myListings.badgeRejected') : t('myListings.badgeHidden')}
        </span>
        <button
          type="button"
          onClick={() => onWhy(row)}
          className="relative z-10 inline-flex min-h-11 items-center text-sm font-medium text-brand hover:underline"
        >
          {t('myListings.why')}
        </button>
      </span>
    )
  }
  if (row.group === 'sold') return <span className={grey}>{t('myListings.badgeSold')}</span>
  if (row.group === 'expired') return <span className={grey}>{t('myListings.badgeExpired')}</span>
  if (row.group === 'draft') return <span className={grey}>{t('myListings.badgeDraft')}</span>
  if (row.expiring) {
    return (
      <span className={`${pill} bg-tag-50 text-ink`}>
        {t('myListings.expiresIn', { count: daysLeft(row.listing.expires_at, now) })}
      </span>
    )
  }
  return showActive ? <span className={`${pill} bg-success-50 text-success`}>{t('myListings.badgeActive')}</span> : null
}

/** 👁 views and ♡ saves (not for drafts, nobody has seen them yet). */
function Stats({ row }: { row: Row }) {
  const { t } = useTranslation()
  if (row.group === 'draft') return null
  return (
    <span className="flex items-center gap-3 text-sm text-muted tabular">
      <span className="flex items-center gap-1" title={t('myListings.views', { count: row.listing.views })}>
        <Eye aria-hidden="true" className="size-4" strokeWidth={1.75} />
        <span aria-hidden="true">{row.listing.views}</span>
        <span className="sr-only">{t('myListings.views', { count: row.listing.views })}</span>
      </span>
      <span className="flex items-center gap-1" title={t('myListings.saves', { count: row.saves })}>
        <Heart aria-hidden="true" className="size-4" strokeWidth={1.75} />
        <span aria-hidden="true">{row.saves}</span>
        <span className="sr-only">{t('myListings.saves', { count: row.saves })}</span>
      </span>
    </span>
  )
}

function Thumb({ listing, className }: { listing: MyListing; className: string }) {
  const category = categoryById(listing.category_id)
  return (
    <div className={`shrink-0 overflow-hidden rounded-field bg-paper ${className}`}>
      {listing.coverPath ? (
        <img src={publicPhotoUrl(listing.coverPath)} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted">
          {category && <CategoryIcon name={category.icon} className="size-7" />}
        </div>
      )}
    </div>
  )
}

/** Invisible marker at the end of the list: when it scrolls into view, the next 20 listings are shown. */
function LoadMore({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && onVisible(), {
      rootMargin: '400px',
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [onVisible])
  return (
    <div ref={ref} className="flex justify-center py-4">
      <Spinner className="size-5 text-muted" />
    </div>
  )
}
