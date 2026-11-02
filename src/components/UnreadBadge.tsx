import { useUnreadCount } from '../features/messages/api'

/** Blue circle with the number of unread messages (nothing when there are none). */
export function UnreadBadge({ className = '' }: { className?: string }) {
  const unread = useUnreadCount()
  const count = unread.data ?? 0
  if (count <= 0) return null
  return (
    <span
      aria-hidden="true"
      className={`absolute min-w-5 rounded-full bg-brand px-1 text-center text-xs leading-5 font-semibold text-white tabular ring-2 ring-surface ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
