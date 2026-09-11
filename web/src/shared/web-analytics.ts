import posthog from 'posthog-js'

import {
  createDisabledAnalytics,
  type AnalyticsAdapter,
} from '@money-space/core/shared/analytics'

/**
 * PostHog for the browser.
 *
 * The second of the two no-op guards: with no key we never call `init()` at
 * all and hand core the disabled adapter, so a dev machine and CI make no
 * network request. Empty is a supported state — the same contract the
 * RevenueCat keys already document in `.env.example`.
 *
 * See ../../../memory/analytics.md for what may be sent.
 */
export function createWebAnalytics(): AnalyticsAdapter {
  const key = import.meta.env.VITE_POSTHOG_KEY?.trim()
  const host = import.meta.env.VITE_POSTHOG_HOST?.trim()

  if (!key) return createDisabledAnalytics()

  posthog.init(key, {
    api_host: host || 'https://eu.i.posthog.com',
    // We emit a typed catalog. Autocapture would defeat it by scraping the
    // text of whatever was clicked — which on this app is a balance.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    // Home shows the household's whole picture. There is no masking rule that
    // makes recording it safe, so it is off rather than configured.
    disable_session_recording: true,
    // No profile for anonymous traffic.
    person_profiles: 'identified_only',
    ip: false,
    /**
     * Strip query and hash from every URL property.
     *
     * Not cosmetic: `/join?household=…&token=…` carries a LIVE invite token and
     * `/auth/reset-password` carries a recovery token in the fragment. Sending
     * either would hand a credential to a third party. Stripped unconditionally
     * rather than by allowlist — an allowlist fails open on the next route
     * somebody adds.
     */
    sanitize_properties: (properties) => {
      const cleaned = { ...properties }
      for (const key of ['$current_url', '$referrer', '$pathname']) {
        const value = cleaned[key]
        if (typeof value === 'string') {
          cleaned[key] = value.split('?')[0].split('#')[0]
        }
      }
      return cleaned
    },
  })

  return {
    isEnabled: () => true,
    capture: (event, properties) => posthog.capture(event, properties),
    identify: (distinctId) => posthog.identify(distinctId),
    group: (groupType, groupKey) => posthog.group(groupType, groupKey),
    reset: () => posthog.reset(),
    captureException: (error, context) =>
      posthog.captureException(error, context),
  }
}
