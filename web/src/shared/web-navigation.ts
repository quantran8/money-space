import { useCallback } from 'react'
import {
  useNavigate as useRouterNavigate,
  useLocation as useRouterLocation,
  useSearchParams,
} from 'react-router-dom'

import type {
  Navigate,
  NavigationAdapter,
  RouteLocation,
} from '@money-space/core/shared/navigation'

/**
 * react-router-dom behind core's navigation interface.
 *
 * Core already describes destinations as web paths, so unlike the native
 * adapter there is nothing to translate: `to`, `replace` and `state` map
 * one-to-one onto react-router's own arguments.
 */

function useWebNavigate(): Navigate {
  const navigate = useRouterNavigate()
  return useCallback(
    (to, options) => {
      navigate(to, { replace: options?.replace, state: options?.state })
    },
    [navigate],
  )
}

function useWebLocation(): RouteLocation {
  const location = useRouterLocation()
  return { pathname: location.pathname, state: location.state }
}

function useWebSearchParam(key: string): string | null {
  const [params] = useSearchParams()
  return params.get(key)
}

export const webNavigation: NavigationAdapter = {
  useNavigate: useWebNavigate,
  useLocation: useWebLocation,
  useSearchParam: useWebSearchParam,
}
