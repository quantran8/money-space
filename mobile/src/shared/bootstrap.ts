import * as Clipboard from 'expo-clipboard'
import { getLocales } from 'expo-localization'

import { installAuthBridge } from '@money-space/core/features/auth/api/auth-bridge'
import { configureJoinUrlBase } from '@money-space/core/features/invites/model/invites.types'
import { initI18n, restoreLanguage } from '@money-space/core/i18n/config'
import { configureEnv } from '@money-space/core/shared/api/env'
import { configureClipboard } from '@money-space/core/shared/clipboard'
import { configureNavigation } from '@money-space/core/shared/navigation'
import { hydrateAuth } from '@money-space/core/shared/stores/auth-store'
import { configureStorage } from '@money-space/core/shared/storage'

import { nativeNavigation } from '@/shared/native-navigation'
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

  initI18n(getLocales()[0]?.languageTag)

  // Both read storage; the gates wait on `hydrated` rather than on this promise.
  return Promise.all([hydrateAuth(), restoreLanguage()]).then(() => undefined)
}
