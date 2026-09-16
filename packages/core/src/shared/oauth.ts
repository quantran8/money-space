/**
 * The browser hand-off in an OAuth round trip, injected by the host app.
 *
 * Web leaves the page and comes back as a fresh load on `/auth/callback`;
 * native opens an in-app tab and returns the callback URL as a value. See
 * memory/auth.md.
 */

export type OAuthAdapter = {
  /** Absolute URI Google returns to — the backend rejects a relative one. */
  buildRedirectUri: (path: string) => string
  /**
   * Send the user to `url`. Resolves with the callback URL where the platform
   * catches it, null when the user dismissed it, and never where the page
   * navigates away.
   */
  start: (url: string, redirectUri: string) => Promise<string | null>
}

/** The browser default, so the web needs no wiring. */
const webOAuth: OAuthAdapter = {
  buildRedirectUri: (path) => new URL(path, window.location.origin).toString(),
  start: (url) => {
    window.location.assign(url)
    // The page is being replaced; resolving would flash an idle button over it.
    return new Promise<string | null>(() => {})
  },
}

let adapter: OAuthAdapter = webOAuth

export function configureOAuth(next: OAuthAdapter) {
  adapter = next
}

export const oauth: OAuthAdapter = {
  buildRedirectUri: (path) => adapter.buildRedirectUri(path),
  start: (url, redirectUri) => adapter.start(url, redirectUri),
}
