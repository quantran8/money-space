import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createEvent, deleteEvent, listEvents, updateEvent, type EventPayload } from '@/features/events/api/events.repository'
import type { MoneyEventItem } from '@/features/events/model/events.types'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

const EMPTY_EVENTS: MoneyEventItem[] = []

export function useEvents(month?: string) {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId ? queryKeys.events(activeHouseholdId, month) : ['events', 'inactive', month ?? 'all'],
    queryFn: () => listEvents(activeHouseholdId!, month),
    enabled: !!activeHouseholdId,
  })

  /**
   * NOT awaited — see the note in `use-assets.ts`. Awaiting `invalidateQueries`
   * inside `onSuccess` holds `mutateAsync` open until every refetch lands,
   * which is what made saving a record feel slow long after the write itself
   * had returned.
   */
  const invalidate = () => {
    if (!activeHouseholdId) return
    const keys = [
      // Invalidate by the `events` prefix so BOTH the list (`…, 'events', month`)
      // and the backend-computed thu/chi/net summary (`…, 'events', 'summary',
      // month`) refetch — the summary is the source of truth for the totals.
      ['households', activeHouseholdId, 'events'],
      queryKeys.dashboard(activeHouseholdId),
      // Recording a repayment reduces the linked debt's outstanding balance
      // (see backend MoneyEventsService), so the debts view must refetch.
      queryKeys.debts(activeHouseholdId),
      // Asset purchase/sale/transfer events change asset values, the liquidity
      // buckets and the per-asset value history — refetch the assets views too.
      // (Prefix-matches the assets list, summary, snapshots and value-history.)
      queryKeys.assets(activeHouseholdId),
      // The forms quote flexible money back at the user (§22.7).
      ['households', activeHouseholdId, 'flexible-money'],
      ['households', activeHouseholdId, 'forecast'],
    ]
    for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey })
  }

  return {
    events: query.data?.items ?? EMPTY_EVENTS,
    activeHouseholdId,
    ...query,
    createEvent: useMutation({
      mutationFn: (payload: EventPayload) => createEvent(activeHouseholdId!, payload),
      onSuccess: invalidate,
    }),
    updateEvent: useMutation({
      mutationFn: ({ eventId, payload }: { eventId: string; payload: Partial<EventPayload> }) =>
        updateEvent(activeHouseholdId!, eventId, payload),
      onSuccess: invalidate,
    }),
    deleteEvent: useMutation({
      mutationFn: (eventId: string) => deleteEvent(activeHouseholdId!, eventId),
      onSuccess: invalidate,
    }),
  }
}
