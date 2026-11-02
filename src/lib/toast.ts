// Short notices ("Linkul a fost copiat"): toast('...') from anywhere, <Toaster /> in Layout shows them.
export type ToastMessage = { id: number; text: string }

const EVENT = 'telauto:toast'
let nextId = 1

export function toast(text: string): void {
  window.dispatchEvent(new CustomEvent<ToastMessage>(EVENT, { detail: { id: nextId++, text } }))
}

export function subscribeToasts(onToast: (message: ToastMessage) => void): () => void {
  const listener = (event: Event) => onToast((event as CustomEvent<ToastMessage>).detail)
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
