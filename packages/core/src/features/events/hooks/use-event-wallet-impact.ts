import { useQuery } from '@tanstack/react-query'

import {
  eventDeleteImpact,
  listOverdraftEvents,
  previewEventUpdate,
  type EventPayload,
  type EventWalletImpact,
} from '#/features/events/api/events.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

const CLEAR: EventWalletImpact = { isClear: true, wallets: [] }

/**
 * What deleting this event would do to the wallets it touches — read when the
 * delete dialog opens, so the confirmation can say that a wallet would go
 * negative instead of letting the household find out afterwards.
 *
 * Editing an event replays every wallet it touches from that wallet's opening
 * balance (see wallet-replay-on-edit), so removing a back-dated inflow can leave
 * the events that follow it overdrawn. That is permitted — the balance is
 * allowed to go negative because it truthfully records spending in excess of
 * income — which is exactly why it needs saying out loud beforehand.
 */
export function useEventDeleteImpact(eventId?: string | null) {
  const { activeHouseholdId } = useActiveHousehold()
  const canQuery = Boolean(activeHouseholdId && eventId)

  const query = useQuery({
    queryKey:
      activeHouseholdId && eventId
        ? queryKeys.eventDeleteImpact(activeHouseholdId, eventId)
        : ['event-delete-impact', 'inactive'],
    queryFn: () => eventDeleteImpact(activeHouseholdId!, eventId!),
    enabled: canQuery,
  })

  return {
    impact: query.data ?? CLEAR,
    /**
     * Treated as "nothing to warn about" until the answer arrives. The warning
     * is advisory and the write never depends on it, so a slow read delays the
     * warning rather than blocking the household.
     */
    isClear: query.data?.isClear ?? true,
    isLoading: query.isLoading && canQuery,
  }
}

/**
 * What saving this edit would do to the wallets it touches, for the candidate
 * payload currently in the form. Same advisory contract as
 * {@link useEventDeleteImpact}.
 *
 * `payload` is serialised into the query key so each distinct candidate is
 * cached on its own — the form re-renders on every keystroke, and without that
 * the preview would either thrash or answer for a stale amount. Pass `enabled:
 * false` while the form is invalid, so a half-typed amount is never previewed.
 */
export function useEventUpdatePreview(
  eventId: string | null | undefined,
  payload: Partial<EventPayload> | null,
  options?: { enabled?: boolean },
) {
  const { activeHouseholdId } = useActiveHousehold()
  const canQuery = Boolean(
    activeHouseholdId && eventId && payload && (options?.enabled ?? true),
  )

  const query = useQuery({
    queryKey:
      activeHouseholdId && eventId
        ? [
            ...queryKeys.events(activeHouseholdId),
            'update-preview',
            eventId,
            JSON.stringify(payload),
          ]
        : ['event-update-preview', 'inactive'],
    queryFn: () => previewEventUpdate(activeHouseholdId!, eventId!, payload!),
    enabled: canQuery,
  })

  return {
    impact: query.data ?? CLEAR,
    isClear: query.data?.isClear ?? true,
    isLoading: query.isLoading && canQuery,
  }
}

const NO_OVERDRAFTS: Record<string, number> = {}

/**
 * Which events sit at a point where their wallet's balance is negative, mapped
 * to that balance, so the list can mark them.
 *
 * Fetched once for the household rather than per row: an overdraft is a property
 * of a wallet's running balance, so it takes a replay of that wallet's whole
 * ledger — which also keeps the cost independent of how the list is paged.
 */
export function useEventOverdrafts() {
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.eventOverdrafts(activeHouseholdId)
      : ['event-overdrafts', 'inactive'],
    queryFn: () => listOverdraftEvents(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  return {
    /** Event id → the negative balance at that point. Absent means fine. */
    overdrafts: query.data?.overdrafts ?? NO_OVERDRAFTS,
    isLoading: query.isLoading && !!activeHouseholdId,
  }
}
