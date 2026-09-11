/**
 * Analytics, injected by the host app.
 *
 * Core cannot import a PostHog SDK directly: the web needs `posthog-js` and
 * native needs `posthog-react-native`, and neither resolves in the other's
 * bundler. So core owns the typed surface and each host supplies the client —
 * the same shape `configureStorage` and `configureStorePurchases` already use.
 *
 * The default adapter does nothing. That is the FIRST of two no-op guards: a
 * host that never calls `configureAnalytics` is silent rather than broken, and
 * each host adapter separately refuses to initialise without a key. Empty is a
 * supported state — it is what CI and every dev machine run in.
 *
 * See memory/analytics.md for what may and may not be sent.
 */

export type AnalyticsAdapter = {
  /** Whether anything is actually being sent. */
  isEnabled: () => boolean
  capture: (event: string, properties?: Record<string, unknown>) => void
  /** Called at sign-in. The distinct id is the profile UUID, never an email. */
  identify: (distinctId: string) => void
  /**
   * The household this event belongs to. A person can be in several spaces, so
   * it is a group rather than a property of the person.
   */
  group: (groupType: 'household', groupKey: string) => void
  /** Sign-out. Drops the identity so the next person is not the last one. */
  reset: () => void
  captureException: (
    error: unknown,
    context?: Record<string, unknown>,
  ) => void
}

/** The honest answer when no key is configured. */
function createDisabledAnalytics(): AnalyticsAdapter {
  return {
    isEnabled: () => false,
    capture: () => {},
    identify: () => {},
    group: () => {},
    reset: () => {},
    captureException: () => {},
  }
}

let adapter: AnalyticsAdapter = createDisabledAnalytics()

export function configureAnalytics(next: AnalyticsAdapter) {
  adapter = next
}

/** Read through the façade, never captured at module scope: the host installs
 *  its adapter after these modules have been imported. */
export const analytics: AnalyticsAdapter = {
  isEnabled: () => adapter.isEnabled(),
  capture: (event, properties) => adapter.capture(event, properties),
  identify: (distinctId) => adapter.identify(distinctId),
  group: (groupType, groupKey) => adapter.group(groupType, groupKey),
  reset: () => adapter.reset(),
  captureException: (error, context) => adapter.captureException(error, context),
}

export { createDisabledAnalytics }
