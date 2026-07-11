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

  const invalidate = async () => {
    if (!activeHouseholdId) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.events(activeHouseholdId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(activeHouseholdId) }),
      // Recording a repayment reduces the linked debt's outstanding balance
      // (see backend MoneyEventsService), so the debts view must refetch.
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(activeHouseholdId) }),
      // Asset purchase/sale/transfer events change asset values, the liquidity
      // buckets and the per-asset value history — refetch the assets views too.
      // (Prefix-matches the assets list, summary, snapshots and value-history.)
      queryClient.invalidateQueries({ queryKey: queryKeys.assets(activeHouseholdId) }),
    ])
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
