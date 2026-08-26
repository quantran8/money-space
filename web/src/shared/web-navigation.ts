import { useCallback } from 'react'
import {
  useLocation as useRouterLocation,
  useNavigate as useRouterNavigate,
  useSearchParams,
} from 'react-router-dom'

import type {
  Navigate,
  NavigationAdapter,
  RouteLocation,
} from '@money-space/core/shared/navigation'

/**
 * react-router-dom behind core's navigation shim.
 *
 * Core describes destinations as paths and calls these through
 * `#/shared/navigation`; without an adapter installed that module falls back to
 * a NO-OP, so every `navigate()` inside a core hook silently did nothing on the
 * web — a debt row's click reached `openDetail`, which reached a function that
 * returned. The gates hid it: `RequireAuth` / `RequireHousehold` redirect
 * declaratively with `<Navigate>`, so login and onboarding still moved and only
 * the flows where `navigate()` IS the mechanism stayed put.
 *
 * `useCallback` on the returned function because core is free to put it in a
 * dependency array; react-router's own `navigate` is already stable, so this
 * only preserves that.
 */
function useNavigate(): Navigate {
  const navigate = useRouterNavigate()
  return useCallback<Navigate>(
    (to, options) => {
      navigate(to, { replace: options?.replace, state: options?.state })
    },
    [navigate],
  )
}

function useLocation(): RouteLocation {
  const location = useRouterLocation()
  return { pathname: location.pathname, state: location.state }
}

function useSearchParam(key: string): string | null {
  const [params] = useSearchParams()
  return params.get(key)
}

export const webNavigation: NavigationAdapter = {
  useNavigate,
  useLocation,
  useSearchParam,
}
