import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useAuth } from '../features/auth/authContext'
import { errorToKey } from '../features/auth/authErrors'
import { publicPhotoUrl } from '../features/listings/photos'
import {
  MAX_MESSAGE_LENGTH,
  useConversation,
  useLiveConversation,
  useMessages,
  useSendMessage,
  type ConversationSummary,
  type Message,
} from '../features/messages/api'
import { translateKey } from '../i18n/translate'
import { ReportButton } from '../features/reports/ReportButton'
import { formatDate, formatPrice } from '../lib/format'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function ConversationPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const validId = id && UUID_PATTERN.test(id) ? id : undefined
  const conversation = useConversation(validId)
  const messages = useMessages(conversation.data ? validId : undefined)
  useLiveConversation(conversation.data ? validId : undefined)

  const name = conversation.data?.otherName || t('profile.unnamed')
  usePageMeta(conversation.data ? `${name} – ${t('messages.metaTitle')}` : t('messages.metaTitle'))

  if (validId && conversation.isPending) return <LoadingState />
  if (conversation.isError) return <ErrorState error={conversation.error} onRetry={() => void conversation.refetch()} />
  if (!validId || !conversation.data) {
    return (
      <section className="mx-auto max-w-md py-12 text-center">
        <h1 className="text-2xl font-bold">{t('messages.notFound')}</h1>
        <Link to="/messages" className="mt-6 inline-block font-semibold text-brand-700 hover:underline">
          {t('messages.backToList')}
        </Link>
      </section>
    )
  }

  return (
    // the chat fills the screen below the header, so the box to type in is always visible
    <div className="mx-auto -my-6 flex h-[calc(100dvh-7.5rem)] min-h-[26rem] max-w-3xl flex-col md:h-[calc(100dvh-5rem)]">
      <ChatHeader conversation={conversation.data} />
      {messages.isPending ? (
        <div className="flex-1">
          <LoadingState />
        </div>
      ) : messages.isError ? (
        <div className="flex-1">
          <ErrorState error={messages.error} onRetry={() => void messages.refetch()} />
        </div>
      ) : (
        <MessageList messages={messages.data} />
      )}
      <Composer conversation={conversation.data} />
    </div>
  )
}

function ChatHeader({ conversation: c }: { conversation: ConversationSummary }) {
  const { t, i18n } = useTranslation()
  const name = c.otherUserId ? c.otherName || t('profile.unnamed') : t('profile.deletedUser')

  const listing = (
    <>
      <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {c.listingCover && <img src={publicPhotoUrl(c.listingCover)} alt="" className="size-full object-cover" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-slate-800">
          {c.listingTitle ?? t('messages.listingDeleted')}
        </span>
        <span className="block text-sm text-slate-600">
          {c.listingPrice !== null && c.listingCurrency
            ? formatPrice(c.listingPrice, c.listingCurrency, i18n.resolvedLanguage)
            : ''}
          {c.listingId && !c.listingAvailable ? ` · ${t('messages.listingUnavailable')}` : ''}
        </span>
      </span>
    </>
  )

  return (
    <div className="space-y-2 border-b border-slate-200 bg-slate-50 py-3">
      <div className="flex items-center gap-2">
        <Link
          to="/messages"
          className="flex size-10 items-center justify-center rounded-lg text-xl text-slate-600 hover:bg-slate-100"
          aria-label={t('messages.backToList')}
        >
          ←
        </Link>
        {c.otherUserId ? (
          <Link to={`/u/${c.otherUserId}`} className="truncate text-lg font-semibold hover:underline">
            {name}
          </Link>
        ) : (
          <span className="truncate text-lg font-semibold text-slate-500">{name}</span>
        )}
        <span className="text-xs text-slate-500">{c.iAmSeller ? t('messages.roleBuyer') : t('messages.roleSeller')}</span>
      </div>
      {c.listingId && c.listingAvailable ? (
        <Link to={`/a/${c.listingId}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-slate-100">
          {listing}
        </Link>
      ) : (
        <div className="flex items-center gap-3 p-1 opacity-70">{listing}</div>
      )}
    </div>
  )
}

function MessageList({ messages }: { messages: Message[] }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)
  const lng = i18n.resolvedLanguage
  const time = new Intl.DateTimeFormat(lng === 'ru' ? 'ru-MD' : 'ro-MD', { hour: '2-digit', minute: '2-digit' })

  // always show the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-slate-500">
        {t('messages.startHint')}
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto py-4" role="log" aria-live="polite" aria-label={t('messages.title')}>
      <div className="mx-auto max-w-prose px-2">
        <Alert kind="warning">{t('messages.safetyNotice')}</Alert>
      </div>
      {messages.map((message, index) => {
        const mine = message.senderId === user?.id
        const day = formatDate(message.createdAt, lng)
        const showDay = index === 0 || day !== formatDate(messages[index - 1].createdAt, lng)
        return (
          <div key={message.id}>
            {showDay && <p className="my-3 text-center text-xs font-medium text-slate-500">{day}</p>}
            {!mine && message.isFlagged && (
              <div className="mb-1 max-w-[85%] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="note">
                <span aria-hidden="true">⚠️ </span>
                {t('messages.flaggedWarning')}
              </div>
            )}
            <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
                  mine ? 'rounded-br-sm bg-brand-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-surface text-slate-900'
                }`}
              >
                {/* user text: React shows it as plain text, never as HTML */}
                <p className="break-words whitespace-pre-wrap">{message.body}</p>
                <p className={`mt-0.5 text-right text-[11px] ${mine ? 'text-brand-100' : 'text-slate-500'}`}>
                  <time dateTime={message.createdAt}>{time.format(new Date(message.createdAt))}</time>
                  {mine && (
                    <span className="ml-1" aria-label={message.readAt ? t('messages.read') : t('messages.sent')}>
                      {message.readAt ? '✓✓' : '✓'}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {!mine && message.senderId && (
              <div className="mt-0.5 pl-1">
                <ReportButton variant="link" target={{ messageId: message.id }} />
              </div>
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

function Composer({ conversation }: { conversation: ConversationSummary }) {
  const { t } = useTranslation()
  const send = useSendMessage(conversation.id)
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (!conversation.canReply) {
    return (
      <p className="border-t border-slate-200 p-3 text-center text-sm text-slate-600">
        {conversation.otherUserId ? t('messages.cannotReplyBlocked') : t('messages.cannotReplyDeleted')}
      </p>
    )
  }

  function submit() {
    const body = text.trim()
    if (!body || send.isPending) return
    send.mutate(body, {
      onSuccess: () => {
        setText('')
        textareaRef.current?.focus()
      },
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit()
  }

  // Enter sends, Shift+Enter makes a new line (phones: the send button)
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    // same background as the page: only the text box stands out
    <form onSubmit={handleSubmit} className="space-y-2 border-t border-slate-200 bg-slate-50 pt-3 pb-1">
      {send.isError && <Alert kind="error">{translateKey(t, errorToKey(send.error))}</Alert>}
      <div className="flex items-end gap-2">
        <label htmlFor="message-text" className="sr-only">
          {t('messages.placeholder')}
        </label>
        <textarea
          id="message-text"
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={Math.min(5, Math.max(1, text.split('\n').length))}
          placeholder={t('messages.placeholder')}
          className="block min-h-11 w-full flex-1 resize-none rounded-xl border border-slate-300 bg-surface px-3 py-2 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
        <Button type="submit" loading={send.isPending} disabled={!text.trim()} aria-label={t('messages.send')}>
          <span aria-hidden="true">➤</span>
          <span className="hidden sm:inline">{t('messages.send')}</span>
        </Button>
      </div>
      {text.length > MAX_MESSAGE_LENGTH - 200 && (
        <p className="text-right text-xs text-slate-500">
          {text.length} / {MAX_MESSAGE_LENGTH}
        </p>
      )}
    </form>
  )
}
