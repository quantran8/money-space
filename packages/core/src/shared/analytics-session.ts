import { analytics } from '#/shared/analytics'
import { storage } from '#/shared/storage'

/**
 * `app_opened`, with the rule that makes the two platforms comparable.
 *
 * A phone fires "became active" every time someone glances at it; a browser tab
 * fires on every reload. Counting those raw would have mobile reporting many
 * times the web's opens for identical use. Thirty minutes is the gap that reads
 * as "came back" rather than "never left".
 *
 * Goes through core's injected `storage` — never `localStorage`, which does not
 * exist on Hermes. The adapter is already async for exactly this reason.
 */
const SESSION_GAP_MS = 30 * 60 * 1000
const LAST_OPEN_KEY = 'money-space-analytics-last-open'

export type AnalyticsPlatform = 'web' | 'ios' | 'android'

/**
 * Fire `app_opened` when at least 30 minutes have passed since the last one.
 *
 * Fire-and-forget, and it swallows its own failures: a storage read that fails
 * must not stop an app from starting.
 */
export async function noteAppOpened(
  platform: AnalyticsPlatform,
): Promise<void> {
  if (!analytics.isEnabled()) return

  try {
    const now = Date.now()
    const raw = await storage.getItem(LAST_OPEN_KEY)
    const last = raw ? Number(raw) : 0
    const elapsed = Number.isFinite(last) && last > 0 ? now - last : Infinity

    if (elapsed < SESSION_GAP_MS) return

    await storage.setItem(LAST_OPEN_KEY, String(now))
    analytics.capture('app_opened', {
      platform,
      // Infinity on a first-ever open; null reads better than a fake number.
      minutes_since_last_open: Number.isFinite(elapsed)
        ? Math.round(elapsed / 60_000)
        : null,
    })
  } catch {
    // Analytics must never be the reason a cold start fails.
  }
}
