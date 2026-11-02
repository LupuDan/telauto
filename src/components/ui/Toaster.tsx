import { CircleCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { subscribeToasts, type ToastMessage } from '../../lib/toast'

/** Notices at the bottom on phones (above the bottom bar), top right on computers; gone after 4 s. */
export function Toaster() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(
    () =>
      subscribeToasts((message) => {
        setMessages((current) => [...current.slice(-2), message])
        window.setTimeout(() => setMessages((current) => current.filter((item) => item.id !== message.id)), 4000)
      }),
    [],
  )

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 lg:inset-x-auto lg:top-20 lg:right-6 lg:bottom-auto lg:items-end"
    >
      {messages.map((message) => (
        <p
          key={message.id}
          className="pointer-events-auto flex max-w-sm animate-[toast-in_200ms_ease-out] items-center gap-2 rounded-field bg-ink px-4 py-3 text-sm text-surface shadow-float"
        >
          <CircleCheck aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
          {message.text}
        </p>
      ))}
    </div>
  )
}
