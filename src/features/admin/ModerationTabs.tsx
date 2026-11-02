import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { translateKey } from '../../i18n/translate'
import { formatDate } from '../../lib/format'
import {
  useFlaggedMessages,
  useHiddenListings,
  useModerateListing,
  useOpenReports,
  useResolveMessageReports,
  useSetUserBlocked,
  type ListingReportGroup,
  type MessageReportGroup,
  type ReportRow,
} from './api'
import { ActionError, Card, ConfirmButton, EmptyBox } from './ui'

// ---------------------------------------------------------------------------
// Open reports, grouped by listing / message
// ---------------------------------------------------------------------------

export function ReportsTab() {
  const { t } = useTranslation()
  const reports = useOpenReports()

  if (reports.isPending) return <LoadingState />
  if (reports.isError) return <ErrorState error={reports.error} onRetry={() => void reports.refetch()} />
  if (reports.data.length === 0) return <EmptyBox>{t('admin.reports.empty')}</EmptyBox>

  return (
    <ul className="space-y-3">
      {reports.data.map((group) =>
        group.kind === 'listing' ? (
          <ListingReportCard key={group.listingId} group={group} />
        ) : (
          <MessageReportCard key={group.messageId} group={group} />
        ),
      )}
    </ul>
  )
}

function ReportList({ reports }: { reports: ReportRow[] }) {
  const { t, i18n } = useTranslation()
  return (
    <ul className="space-y-1 rounded-field bg-paper p-3 text-sm">
      {reports.map((report) => (
        <li key={report.id}>
          <span className="font-semibold">{translateKey(t, `reports.reasons.${report.reason}`)}</span>
          <span className="text-slate-500">
            {' '}
            · {report.reporterName || t('profile.deletedUser')} · {formatDate(report.createdAt, i18n.resolvedLanguage)}
          </span>
          {/* user text: plain text */}
          {report.details && <p className="break-words whitespace-pre-line text-slate-700">{report.details}</p>}
        </li>
      ))}
    </ul>
  )
}

function ListingReportCard({ group }: { group: ListingReportGroup }) {
  const { t } = useTranslation()
  const moderate = useModerateListing()
  const block = useSetUserBlocked()
  const run = (action: 'hide' | 'reject' | 'restore') => moderate.mutate({ listingId: group.listingId, action })

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/a/${group.listingId}`} className="font-semibold break-words text-brand hover:underline">
            {group.title}
          </Link>
          <p className="text-sm text-slate-600">
            {translateKey(t, `admin.status.${group.status}`)} · {t('admin.author')}:{' '}
            {group.authorId ? (
              <Link to={`/u/${group.authorId}`} className="hover:underline">
                {group.authorName || t('profile.unnamed')}
              </Link>
            ) : (
              t('profile.deletedUser')
            )}
            {group.authorBlocked && <span className="ml-1 font-semibold text-danger">({t('profile.blocked')})</span>}
          </p>
        </div>
        <span className="rounded-full bg-danger-50 px-2 py-0.5 text-sm font-semibold text-danger">
          {t('admin.reports.count', { count: group.reports.length })}
        </span>
      </div>
      <ReportList reports={group.reports} />
      <ActionError error={moderate.error ?? block.error} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={moderate.isPending} onClick={() => run('restore')}>
          {t('admin.actions.allGood')}
        </Button>
        {group.status !== 'hidden' && (
          <Button variant="secondary" loading={moderate.isPending} onClick={() => run('hide')}>
            {t('admin.actions.hide')}
          </Button>
        )}
        <ConfirmButton confirmText={t('admin.confirm.reject')} onConfirm={() => run('reject')} loading={moderate.isPending}>
          {t('admin.actions.reject')}
        </ConfirmButton>
        {group.authorId && !group.authorBlocked && (
          <ConfirmButton
            confirmText={t('admin.confirm.block')}
            loading={block.isPending}
            onConfirm={() => block.mutate({ userId: group.authorId!, blocked: true })}
          >
            {t('admin.actions.blockAuthor')}
          </ConfirmButton>
        )}
      </div>
    </Card>
  )
}

function MessageReportCard({ group }: { group: MessageReportGroup }) {
  const { t, i18n } = useTranslation()
  const resolve = useResolveMessageReports()
  const block = useSetUserBlocked()

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm text-slate-600">
          {t('admin.messageFrom')}{' '}
          <SenderName id={group.senderId} name={group.senderName} blocked={group.senderBlocked} /> ·{' '}
          {formatDate(group.sentAt, i18n.resolvedLanguage)}
        </p>
        <span className="rounded-full bg-danger-50 px-2 py-0.5 text-sm font-semibold text-danger">
          {t('admin.reports.count', { count: group.reports.length })}
        </span>
      </div>
      {/* user text: plain text */}
      <p className="rounded-field border border-line p-3 break-words whitespace-pre-wrap">{group.body}</p>
      <ReportList reports={group.reports} />
      <ActionError error={resolve.error ?? block.error} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={resolve.isPending} onClick={() => resolve.mutate(group.messageId)}>
          {t('admin.actions.closeReports')}
        </Button>
        {group.senderId && !group.senderBlocked && (
          <ConfirmButton
            confirmText={t('admin.confirm.block')}
            loading={block.isPending}
            onConfirm={() => {
              block.mutate({ userId: group.senderId!, blocked: true })
              resolve.mutate(group.messageId)
            }}
          >
            {t('admin.actions.blockSender')}
          </ConfirmButton>
        )}
      </div>
    </Card>
  )
}

function SenderName({ id, name, blocked }: { id: string | null; name: string | null; blocked: boolean }) {
  const { t } = useTranslation()
  if (!id) return <>{t('profile.deletedUser')}</>
  return (
    <>
      <Link to={`/u/${id}`} className="font-medium hover:underline">
        {name || t('profile.unnamed')}
      </Link>
      {blocked && <span className="ml-1 font-semibold text-danger">({t('profile.blocked')})</span>}
    </>
  )
}

// ---------------------------------------------------------------------------
// Messages flagged automatically (links, "avans", "card", "curier", ...)
// ---------------------------------------------------------------------------

export function FlaggedTab() {
  const { t, i18n } = useTranslation()
  const messages = useFlaggedMessages()
  const block = useSetUserBlocked()

  if (messages.isPending) return <LoadingState />
  if (messages.isError) return <ErrorState error={messages.error} onRetry={() => void messages.refetch()} />

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">{t('admin.flagged.intro')}</p>
      <ActionError error={block.error} />
      {messages.data.length === 0 ? (
        <EmptyBox>{t('admin.flagged.empty')}</EmptyBox>
      ) : (
        <ul className="space-y-3">
          {messages.data.map((message) => (
            <Card key={message.id}>
              <p className="text-sm text-slate-600">
                {t('admin.messageFrom')}{' '}
                <SenderName id={message.senderId} name={message.senderName} blocked={message.senderBlocked} /> ·{' '}
                {formatDate(message.createdAt, i18n.resolvedLanguage)}
              </p>
              {/* user text: plain text */}
              <p className="rounded-field border border-line p-3 break-words whitespace-pre-wrap">{message.body}</p>
              {message.senderId && !message.senderBlocked && (
                <ConfirmButton
                  confirmText={t('admin.confirm.block')}
                  loading={block.isPending}
                  onConfirm={() => block.mutate({ userId: message.senderId!, blocked: true })}
                >
                  {t('admin.actions.blockSender')}
                </ConfirmButton>
              )}
            </Card>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hidden and rejected listings
// ---------------------------------------------------------------------------

export function HiddenTab() {
  const { t, i18n } = useTranslation()
  const listings = useHiddenListings()
  const moderate = useModerateListing()

  if (listings.isPending) return <LoadingState />
  if (listings.isError) return <ErrorState error={listings.error} onRetry={() => void listings.refetch()} />
  if (listings.data.length === 0) return <EmptyBox>{t('admin.hidden.empty')}</EmptyBox>

  return (
    <div className="space-y-3">
      <ActionError error={moderate.error} />
      <ul className="space-y-3">
        {listings.data.map((listing) => (
          <Card key={listing.id}>
            <div className="min-w-0">
              <Link to={`/a/${listing.id}`} className="font-semibold break-words text-brand hover:underline">
                {listing.title}
              </Link>
              <p className="text-sm text-slate-600">
                {translateKey(t, `admin.status.${listing.status}`)} · {formatDate(listing.updatedAt, i18n.resolvedLanguage)} ·{' '}
                {t('admin.author')}:{' '}
                <Link to={`/u/${listing.authorId}`} className="hover:underline">
                  {listing.authorName || t('profile.unnamed')}
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                loading={moderate.isPending}
                onClick={() => moderate.mutate({ listingId: listing.id, action: 'restore' })}
              >
                {t('admin.actions.restore')}
              </Button>
              {listing.status === 'hidden' && (
                <ConfirmButton
                  confirmText={t('admin.confirm.reject')}
                  loading={moderate.isPending}
                  onConfirm={() => moderate.mutate({ listingId: listing.id, action: 'reject' })}
                >
                  {t('admin.actions.reject')}
                </ConfirmButton>
              )}
            </div>
          </Card>
        ))}
      </ul>
    </div>
  )
}
