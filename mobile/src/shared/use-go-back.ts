import { useCallback } from 'react'
import { router } from 'expo-router'

/**
 * Leave a subscreen the way the phone expects: pop the stack when there is one,
 * and fall back to `fallback` only when there is not — a deep link, or a cold
 * start straight onto a detail screen.
 *
 * Navigating to the tab's path instead would push a second copy of that tab and
 * play the forward animation on the way "back". See
 * ../../../memory/mobile-back-must-pop.md.
 */
export function useGoBack(fallback: string) {
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace(fallback as Parameters<typeof router.replace>[0])
  }, [fallback])
}
