import { useSyncExternalStore } from 'react'

// Same limit as Tailwind's "lg:" (1024 px): from here the bottom bar is gone and pages use two columns.
const QUERY = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
  const list = window.matchMedia(QUERY)
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

/** true on screens of at least 1024 px; follows the window when it is resized. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
