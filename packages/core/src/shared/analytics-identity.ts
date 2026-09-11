import { analytics } from '#/shared/analytics'
import { useAppStore } from '#/shared/stores/household-store'
import { useAuthStore } from '#/shared/stores/auth-store'

/**
 * Keep the analytics identity in step with who is signed in and which space
 * they are looking at.
 *
 * Subscribed rather than called at sign-in, and that is load-bearing: a cold
 * start with a restored session never passes through the login screen, so a
 * call there would miss every returning user. This is the same pattern
 * `bootstrap.ts` already uses to keep RevenueCat's `app_user_id` correct — and
 * it uses the same id, the profile UUID, so a purchase webhook and an analytics
 * event name the same person.
 *
 * The household is a GROUP, not a person property: someone can belong to
 * several spaces, and an event belongs to the one it happened in.
 */
export function installAnalyticsIdentity(): () => void {
  let identified: string | null = null
  let grouped: string | null = null

  const syncUser = (userId: string | null | undefined) => {
    if (!userId) {
      // Signed out: drop the identity so the next person on this device is not
      // recorded as the last one.
      if (identified) {
        analytics.reset()
        identified = null
        grouped = null
      }
      return
    }
    if (userId === identified) return
    identified = userId
    analytics.identify(userId)
  }

  const syncHousehold = (householdId: string | null | undefined) => {
    if (!householdId || householdId === grouped) return
    grouped = householdId
    analytics.group('household', householdId)
  }

  syncUser(useAuthStore.getState().user?.id)
  syncHousehold(useAppStore.getState().activeHouseholdId)

  const unsubscribeAuth = useAuthStore.subscribe((state) =>
    syncUser(state.user?.id),
  )
  const unsubscribeHousehold = useAppStore.subscribe((state) =>
    syncHousehold(state.activeHouseholdId),
  )

  return () => {
    unsubscribeAuth()
    unsubscribeHousehold()
  }
}
