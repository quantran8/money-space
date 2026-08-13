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
} from '@/features/cashflow/api/cashflow-events.repository'
import type { CashflowEvent } from '@/features/cashflow/model/cashflow.types'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

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
  const invalidate = async () => {
    if (!activeHouseholdId) return
    await Promise.all(
      [
        queryKeys.cashflowEvents(activeHouseholdId),
        queryKeys.events(activeHouseholdId),
        queryKeys.dashboard(activeHouseholdId),
        // Horizon-scoped keys: match on the prefix so every horizon drops.
        ['households', activeHouseholdId, 'forecast'],
        ['households', activeHouseholdId, 'flexible-money'],
        ['households', activeHouseholdId, 'financial-state'],
        queryKeys.attentionItems(activeHouseholdId),
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    )
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
