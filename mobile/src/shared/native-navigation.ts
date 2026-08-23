import { useCallback, useMemo } from 'react'
import { router, useLocalSearchParams, usePathname } from 'expo-router'

import type {
  Navigate,
  NavigationAdapter,
  RouteLocation,
} from '@money-space/core/shared/navigation'

/**
 * Expo Router behind core's navigation interface.
 *
 * Core speaks in web paths (`/goals`, `/join?household=…`) because those are
 * also the deep-link shape — a scanned invite has to resolve the same way on
 * both platforms. The file-based routes are named to match, so the paths pass
 * through untouched.
 *
 * `state` has no equivalent on native: expo-router carries data in params, not
 * in a history entry. It is serialised into the query string so the receiving
 * screen reads it back through the same `useLocalSearchParams`.
 */

const STATE_PARAM = '__state'

function withState(to: string, state: unknown): string {
  if (state === undefined || state === null) return to
  const separator = to.includes('?') ? '&' : '?'
  return `${to}${separator}${STATE_PARAM}=${encodeURIComponent(JSON.stringify(state))}`
}

function useNativeNavigate(): Navigate {
  return useCallback((to, options) => {
    const href = withState(to, options?.state)
    if (options?.replace) {
      router.replace(href)
    } else {
      router.push(href)
    }
  }, [])
}

function useNativeLocation(): RouteLocation {
  const pathname = usePathname()
  const params = useLocalSearchParams<Record<string, string>>()
  const raw = params[STATE_PARAM]

  const state = useMemo(() => {
    if (typeof raw !== 'string') return undefined
    try {
      return JSON.parse(raw) as unknown
    } catch {
      return undefined
    }
  }, [raw])

  return { pathname, state }
}

function useNativeSearchParam(key: string): string | null {
  const params = useLocalSearchParams<Record<string, string>>()
  const value = params[key]
  return typeof value === 'string' ? value : null
}

export const nativeNavigation: NavigationAdapter = {
  useNavigate: useNativeNavigate,
  useLocation: useNativeLocation,
  useSearchParam: useNativeSearchParam,
}
