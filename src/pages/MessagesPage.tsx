import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { publicPhotoUrl } from '../features/listings/photos'
import { useConversations, type ConversationSummary } from '../features/messages/api'
import { formatPrice, formatShortDate } from '../lib/format'

export function MessagesPage() {
  const { t } = useTranslation()
  usePageMeta(t('messages.metaTitle'))
  const conversations = useConversations()

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">{t('messages.title')}</h1>

      {conversations.isPending ? (
        <LoadingState />
      ) : conversations.isError ? (
        <ErrorState error={conversations.error} onRetry={() => void conversations.refetch()} />
      ) : conversations.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-surface p-6 text-center">
          <p className="text-slate-600">{t('messages.empty')}</p>
          <Link to="/search" className="mt-3 inline-block font-semibold text-brand-700 hover:underline">
            {t('favorites.browse')}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm">
          {conversations.data.map((conversation) => (
            <li key={conversation.id}>
              <ConversationRow conversation={conversation} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ConversationRow({ conversation: c }: { conversation: ConversationSummary }) {
  const { t, i18n } = useTranslation()
  const lng = i18n.resolvedLanguage
  const unread = c.unreadCount > 0
  const name = c.otherUserId ? c.otherName || t('profile.unnamed') : t('profile.deletedUser')

  return (
    <Link
      to={`/messages/${c.id}`}
      className={`flex items-center gap-3 p-3 hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 ${
        unread ? 'bg-brand-50/60' : ''
      }`}
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {c.listingCover && (
          <img src={publicPhotoUrl(c.listingCover)} alt="" loading="lazy" className="size-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate ${unread ? 'font-bold' : 'font-semibold'} text-slate-900`}>{name}</p>
          <span className="shrink-0 text-xs text-slate-500">{formatShortDate(c.lastMessageAt, lng)}</span>
        </div>
        {/* user text: plain text */}
        <p className="truncate text-sm text-slate-700">
          {c.listingTitle ?? t('messages.listingDeleted')}
          {c.listingPrice !== null && c.listingCurrency && (
            <span className="text-slate-500"> · {formatPrice(c.listingPrice, c.listingCurrency, lng)}</span>
          )}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-sm ${unread ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
            {c.lastBody ? `${c.lastFromMe ? `${t('messages.you')}: ` : ''}${c.lastBody}` : t('messages.noMessagesYet')}
          </p>
          {unread && (
            <span className="shrink-0 rounded-full bg-brand-700 px-2 py-0.5 text-xs font-bold text-white">
              <span className="sr-only">{t('messages.unread', { count: c.unreadCount })}</span>
              <span aria-hidden="true">{c.unreadCount}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
