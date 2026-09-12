import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

import type { OAuthAdapter } from '@money-space/core/shared/oauth'

/**
 * Google sign-in through an in-app browser tab.
 *
 * The phone has no origin, so the redirect is a deep link back into this app
 * (`moneyspace://auth/callback`). `openAuthSessionAsync` catches that link and
 * hands the URL back rather than routing to it. See memory/auth.md.
 */
export const nativeOAuth: OAuthAdapter = {
  // `Linking.createURL` yields the Expo Go proxy URL in dev and the registered
  // scheme in a build, so the redirect works in both.
  buildRedirectUri: (path) => Linking.createURL(path),

  start: async (url, redirectUri) => {
    const result = await WebBrowser.openAuthSessionAsync(url, redirectUri)
    return result.type === 'success' ? result.url : null
  },
}
