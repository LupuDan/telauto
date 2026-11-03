import { useEffect, useRef, useState } from 'react'

const TRIGGER = 70 // px pulled down before letting go = refresh
const MAX = 100

/**
 * "Trage în jos ca să reîmprospătezi" on touch screens: works only when the page is scrolled to the top.
 * Returns how far the finger pulled (for the small indicator) and whether a refresh is running.
 */
export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const refresh = useRef(onRefresh)
  useEffect(() => {
    refresh.current = onRefresh
  })

  useEffect(() => {
    let startY: number | null = null
    let distance = 0
    const start = (event: TouchEvent) => {
      startY = window.scrollY <= 0 && event.touches.length === 1 ? event.touches[0].clientY : null
      distance = 0
    }
    const move = (event: TouchEvent) => {
      if (startY === null) return
      distance = Math.max(0, event.touches[0].clientY - startY)
      setPull(Math.min(distance, MAX))
    }
    const end = () => {
      if (startY !== null && distance >= TRIGGER) {
        setRefreshing(true)
        void refresh.current().finally(() => setRefreshing(false))
      }
      startY = null
      distance = 0
      setPull(0)
    }
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', end)
    window.addEventListener('touchcancel', end)
    return () => {
      window.removeEventListener('touchstart', start)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
      window.removeEventListener('touchcancel', end)
    }
  }, [])

  return { pull, ready: pull >= TRIGGER, refreshing }
}
