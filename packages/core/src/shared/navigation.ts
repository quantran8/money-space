/**
 * Navigation, injected by the host app.
 *
 * Core describes destinations as paths (`/goals`, `/assets/:id`) and lets the
 * host decide how to get there: react-router-dom on the web, Expo Router on
 * native. The two have incompatible APIs, but the surface the hooks actually
 * use is small enough to agree on.
 *
 * Paths stay in web form because they are also the deep-link shape — a scanned
 * invite arrives as `/join?household=…&token=…` on both platforms.
 */

export type NavigateOptions = {
  /** Replace the current entry rather than pushing a new one. */
  replace?: boolean
  /**
   * Data handed to the destination. On the web this is history state; on native
   * the host serialises it into route params.
   */
  state?: unknown
}

export type Navigate = (to: string, options?: NavigateOptions) => void

export type RouteLocation = {
  /** Path only, no query string. */
  pathname: string
  /** Whatever the previous screen passed as `state`. */
  state: unknown
}

/**
 * What core needs from the router, expressed as hooks so a host can back them
 * with its own reactive primitives.
 */
export type NavigationAdapter = {
  useNavigate: () => Navigate
  useLocation: () => RouteLocation
  /** Read a query parameter of the current route. `null` when absent. */
  useSearchParam: (key: string) => string | null
}

const NOT_CONFIGURED: NavigationAdapter = {
  useNavigate: () => () => {},
  useLocation: () => ({ pathname: '/', state: undefined }),
  useSearchParam: () => null,
}

let adapter: NavigationAdapter = NOT_CONFIGURED

export function configureNavigation(next: NavigationAdapter) {
  adapter = next
}

// Thin wrappers rather than re-exported functions: the adapter is installed at
// startup, after these modules are imported, so the lookup has to happen at
// call time. They are still hooks — same call order, every render.
export function useNavigate(): Navigate {
  return adapter.useNavigate()
}

export function useLocation(): RouteLocation {
  return adapter.useLocation()
}

export function useSearchParam(key: string): string | null {
  return adapter.useSearchParam(key)
}
