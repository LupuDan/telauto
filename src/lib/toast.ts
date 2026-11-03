// Short notices ("Linkul a fost copiat"): toast('...') from anywhere, <Toaster /> in Layout shows them.
// With an action ("Anulează"), the notice stays as long as the action is valid (default 5 s).
export type ToastAction = { label: string; onClick: () => void }
export type ToastMessage = { id: number; text: string; action?: ToastAction; duration: number }

const EVENT = 'telauto:toast'
let nextId = 1

export function toast(text: string, options: { action?: ToastAction; duration?: number } = {}): void {
  const duration = options.duration ?? (options.action ? 5000 : 4000)
  window.dispatchEvent(
    new CustomEvent<ToastMessage>(EVENT, { detail: { id: nextId++, text, action: options.action, duration } }),
  )
}

export function subscribeToasts(onToast: (message: ToastMessage) => void): () => void {
  const listener = (event: Event) => onToast((event as CustomEvent<ToastMessage>).detail)
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
