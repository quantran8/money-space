import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelCashflowEvent,
  completeCashflowEvent,
  createCashflowEvent,
  deleteCashflowEvent,
  listCashflowEvents,
  postponeCashflowEvent,
  updateCashflowEvent,
  type CashflowEventFilters,
  type CashflowEventPayload,
  type CompleteCashflowEventPayload,
} from '#/features/cashflow/api/cashflow-events.repository'
import type { CashflowEvent } from '#/features/cashflow/model/cashflow.types'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

const EMPTY_EVENTS: CashflowEvent[] = []

export function useCashflowEvents(filters?: CashflowEventFilters) {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? [...queryKeys.cashflowEvents(activeHouseholdId), filters ?? null]
      : ['cashflow-events', 'inactive'],
    queryFn: () => listCashflowEvents(activeHouseholdId!, filters),
    enabled: !!activeHouseholdId,
  })

  /**
   * A cashflow write moves the forecast, so every derived view is stale too.
   * Prefix-invalidating `['households', id]` would nuke assets and members
   * needlessly, so the affected families are listed explicitly.
   */
  const invalidate = () => {
    if (!activeHouseholdId) return
    // NOT awaited — see the note in `use-assets.ts`. Awaiting these keeps
    // `mutateAsync` pending until every refetch lands, long after the write
    // itself returned.
    for (const queryKey of [
      queryKeys.cashflowEvents(activeHouseholdId),
      queryKeys.events(activeHouseholdId),
      queryKeys.dashboard(activeHouseholdId),
      // Horizon-scoped key: match on the prefix so every horizon drops.
      queryKeys.forecastBundleAll(activeHouseholdId),
      queryKeys.attentionItems(activeHouseholdId),
    ]) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }

  return {
    cashflowEvents: query.data?.items ?? EMPTY_EVENTS,
    activeHouseholdId,
    ...query,
    createCashflowEvent: useMutation({
      mutationFn: (payload: CashflowEventPayload) =>
        createCashflowEvent(activeHouseholdId!, payload),
      onSuccess: invalidate,
    }),
    updateCashflowEvent: useMutation({
      mutationFn: ({
        eventId,
        payload,
      }: {
        eventId: string
        payload: Partial<CashflowEventPayload>
      }) => updateCashflowEvent(activeHouseholdId!, eventId, payload),
      onSuccess: invalidate,
    }),
    deleteCashflowEvent: useMutation({
      mutationFn: (eventId: string) => deleteCashflowEvent(activeHouseholdId!, eventId),
      onSuccess: invalidate,
    }),
    completeCashflowEvent: useMutation({
      mutationFn: ({
        eventId,
        payload,
      }: {
        eventId: string
        payload?: CompleteCashflowEventPayload
      }) => completeCashflowEvent(activeHouseholdId!, eventId, payload),
      onSuccess: invalidate,
    }),
    postponeCashflowEvent: useMutation({
      mutationFn: ({
        eventId,
        newExpectedDate,
        note,
      }: {
        eventId: string
        newExpectedDate: string
        note?: string
      }) => postponeCashflowEvent(activeHouseholdId!, eventId, { newExpectedDate, note }),
      onSuccess: invalidate,
    }),
    cancelCashflowEvent: useMutation({
      mutationFn: ({ eventId, note }: { eventId: string; note?: string }) =>
        cancelCashflowEvent(activeHouseholdId!, eventId, { note }),
      onSuccess: invalidate,
    }),
  }
}
