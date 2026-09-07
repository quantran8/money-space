import * as Clipboard from 'expo-clipboard'
import { getLocales } from 'expo-localization'

import { installAuthBridge } from '@money-space/core/features/auth/api/auth-bridge'
import { configureJoinUrlBase } from '@money-space/core/features/invites/model/invites.types'
import { initI18n, restoreLanguage } from '@money-space/core/i18n/config'
import { configureEnv } from '@money-space/core/shared/api/env'
import { configureClipboard } from '@money-space/core/shared/clipboard'
import { configureNavigation } from '@money-space/core/shared/navigation'
import { hydrateAuth, useAuthStore } from '@money-space/core/shared/stores/auth-store'
import { configureStorage } from '@money-space/core/shared/storage'
import { configureStorePurchases } from '@money-space/core/shared/store-purchases'

import { nativeNavigation } from '@/shared/native-navigation'
import { nativePurchases } from '@/shared/native-purchases'
import { nativeStorage } from '@/shared/native-storage'

/**
 * Install the platform behind core, before anything renders.
 *
 * Order matters in one place only: storage must be configured before
 * `hydrateAuth` and `restoreLanguage`, since both read through it.
 *
 * The toast notifier is NOT wired here — it needs a mounted view, so
 * `ToastProvider` installs itself.
 */

/**
 * `EXPO_PUBLIC_*` is inlined by Metro at build time, so this is a literal after
 * bundling, not a runtime lookup. On a device, localhost is the device itself —
 * point this at the machine's LAN IP.
 */
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL

let started = false

/** Kick off startup. Idempotent — Fast Refresh re-runs module scope. */
export function bootstrap(): Promise<void> {
  if (started) return Promise.resolve()
  started = true

  configureEnv({ apiBaseUrl })
  configureStorage(nativeStorage)
  configureNavigation(nativeNavigation)
  // Core's default reaches for `navigator.clipboard`, which does not exist
  // here — without this the invite dialog's copy would report a failure it
  // never actually attempted.
  configureClipboard({
    writeText: (text) => Clipboard.setStringAsync(text).then(() => undefined),
    readText: () => Clipboard.getStringAsync(),
  })
  // A native app has no origin to build a link from, so an invite it shares is
  // a deep link into this app. `app.json` registers the scheme.
  configureJoinUrlBase('moneyspace://')

  // Wire the HTTP client to the auth store before any request can run.
  installAuthBridge()

  // In-app purchase. The web keeps core's default, which reports that it
  // cannot sell — a browser has no store sheet, and the web sells via PayOS.
  configureStorePurchases(nativePurchases)
  identifyBuyerOnAuthChange()

  initI18n(getLocales()[0]?.languageTag)

  // Both read storage; the gates wait on `hydrated` rather than on this promise.
  return Promise.all([hydrateAuth(), restoreLanguage()]).then(() => undefined)
}

/**
 * Keep RevenueCat's `app_user_id` equal to the signed-in profile id.
 *
 * This is load-bearing rather than housekeeping: that id is exactly what
 * arrives in the purchase webhook, and the server resolves the household from
 * it. If a purchase were made while RevenueCat still held an anonymous id, the
 * money would arrive for a subscriber the server could not map.
 *
 * Subscribed rather than called at sign-in so a cold start with a restored
 * session identifies too — that path never passes through the login screen.
 */
function identifyBuyerOnAuthChange() {
  let identified: string | null = null

  const sync = (userId: string | null | undefined) => {
    if (!userId || userId === identified) return
    identified = userId
    // Failure here must not block startup: the purchase flow re-reads the id
    // before it opens the store sheet, so a missed identify is recoverable.
    void nativePurchases.identify(userId).catch(() => {})
  }

  sync(useAuthStore.getState().user?.id)
  useAuthStore.subscribe((state) => sync(state.user?.id))
}
