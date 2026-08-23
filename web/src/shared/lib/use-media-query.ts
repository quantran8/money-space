import { useSyncExternalStore } from 'react'

/**
 * Tracks whether a CSS media query currently matches.
 * Uses `useSyncExternalStore` so it stays correct across mount without an
 * effect that synchronously sets state. SSR-safe: returns `false` on the server.
 */
export function useMediaQuery(query: string) {
  function subscribe(onChange: () => void) {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }

  function getSnapshot() {
    return window.matchMedia(query).matches
  }

  function getServerSnapshot() {
    return false
  }

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Tailwind `md` breakpoint (768px). True on desktop/tablet, false on mobile. */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 768px)')
}
