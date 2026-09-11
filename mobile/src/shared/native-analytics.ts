import { PostHog } from 'posthog-react-native'

import {
  createDisabledAnalytics,
  type AnalyticsAdapter,
} from '@money-space/core/shared/analytics'

/**
 * PostHog on a phone.
 *
 * Same contract as the web adapter: no key means no client is constructed and
 * core keeps its disabled adapter, which is what Expo Go and CI run in.
 *
 * See ../../../memory/analytics.md for what may be sent.
 */
export function createNativeAnalytics(): AnalyticsAdapter {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim()
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim()

  if (!key) return createDisabledAnalytics()

  const client = new PostHog(key, {
    host: host || 'https://eu.i.posthog.com',
    // Every screen in this app shows the household's money.
    enableSessionReplay: false,
    // `app_opened` is ours, with a 30-minute rule that makes it comparable to
    // the web's. The SDK's own lifecycle events would double-count it.
    captureAppLifecycleEvents: false,
    disableGeoip: true,
  })

  /**
   * The RN SDK types properties as `JsonType`, while core's shared adapter
   * types them as `unknown` — it has to, since it cannot depend on either
   * SDK's types. The cast lives HERE, at the one boundary, rather than
   * loosening the shared contract for every caller.
   */
  const asProperties = (value: Record<string, unknown> | undefined) =>
    value as Parameters<typeof client.capture>[1]

  return {
    isEnabled: () => true,
    capture: (event, properties) =>
      client.capture(event, asProperties(properties)),
    identify: (distinctId) => client.identify(distinctId),
    group: (groupType, groupKey) => client.group(groupType, groupKey),
    reset: () => client.reset(),
    captureException: (error, context) =>
      client.capture(
        '$exception',
        asProperties({
          ...context,
          $exception_message:
            error instanceof Error ? error.message : String(error),
          $exception_type: error instanceof Error ? error.name : 'NonError',
          // `null`, never `undefined`: the SDK's JsonType has no undefined.
          $exception_stack_trace_raw:
            error instanceof Error ? (error.stack ?? null) : null,
        }),
      ),
  }
}
