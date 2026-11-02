import { useUnreadCount } from '../features/messages/api'

/** Text for screen readers: "Mesaje – 3 necitite". */
export function useMessagesLabel(base: string, unreadText: (count: number) => string): string {
  const unread = useUnreadCount()
  const count = unread.data ?? 0
  return count > 0 ? `${base} – ${unreadText(count)}` : base
}
