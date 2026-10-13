import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createMatchRule,
  deleteMatchRule,
  linkCashflowEvent,
  listCashflowSettlements,
  listLinkCandidates,
  listHouseholdMatchRules,
  previewMatchRule,
  replaceManualCompletion,
  unlinkCashflowEvent,
} from '#/features/cashflow/api/cashflow-events.repository'
import { resolveBankEvent } from '#/features/bank-sync/api/bank-sync.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

/** Settling moves the forecast and the wallet; refresh everything household-scoped. */
function useInvalidateHousehold() {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()
  return () => {
    if (!activeHouseholdId) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.household(activeHouseholdId) })
  }
}

export function useLinkCandidates(eventId: string | null, q: string) {
  const { activeHouseholdId } = useActiveHousehold()
  return useQuery({
    queryKey:
      activeHouseholdId && eventId
        ? queryKeys.cashflowLinkCandidates(activeHouseholdId, eventId, q)
        : ['cashflow-link-candidates', 'inactive'],
    queryFn: () => listLinkCandidates(activeHouseholdId!, eventId!, q),
    enabled: !!activeHouseholdId && !!eventId,
  })
}

export function useCashflowSettlements(eventId: string | null) {
  const { activeHouseholdId } = useActiveHousehold()
  return useQuery({
    queryKey:
      activeHouseholdId && eventId
        ? queryKeys.cashflowSettlements(activeHouseholdId, eventId)
        : ['cashflow-settlements', 'inactive'],
    queryFn: () => listCashflowSettlements(activeHouseholdId!, eventId!),
    enabled: !!activeHouseholdId && !!eventId,
  })
}

export function useCashflowSettlementActions() {
  const { activeHouseholdId } = useActiveHousehold()
  const invalidate = useInvalidateHousehold()
  return {
    link: useMutation({
      mutationFn: (p: { eventId: string; moneyEventId: string }) =>
        linkCashflowEvent(activeHouseholdId!, p.eventId, p.moneyEventId),
      onSuccess: invalidate,
    }),
    replaceManual: useMutation({
      mutationFn: (p: { eventId: string; moneyEventId: string }) =>
        replaceManualCompletion(activeHouseholdId!, p.eventId, p.moneyEventId),
      onSuccess: invalidate,
    }),
    /** Inbox row: post it and settle in one step. */
    postBankAndLink: useMutation({
      mutationFn: (p: {
        bankEventId: string
        eventId: string
        assetId?: string
        replaceManual?: boolean
      }) =>
        resolveBankEvent(
          activeHouseholdId!,
          p.bankEventId,
          p.replaceManual
            ? { action: 'replace_manual', cashflowEventId: p.eventId, assetId: p.assetId }
            : { action: 'post', cashflowEventId: p.eventId, assetId: p.assetId },
        ),
      onSuccess: invalidate,
    }),
    unlink: useMutation({
      mutationFn: (p: { eventId: string; moneyEventId: string }) =>
        unlinkCashflowEvent(activeHouseholdId!, p.eventId, p.moneyEventId),
      onSuccess: invalidate,
    }),
  }
}

/** Every note rule in the household, managed from Settings. */
export function useHouseholdMatchRules() {
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()
  const key = activeHouseholdId
    ? queryKeys.cashflowMatchRules(activeHouseholdId)
    : (['cashflow-match-rules', 'inactive'] as const)
  const query = useQuery({
    queryKey: key,
    queryFn: () => listHouseholdMatchRules(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })
  const refresh = () => void queryClient.invalidateQueries({ queryKey: key })
  return {
    rules: query.data ?? [],
    isLoading: query.isLoading,
    create: useMutation({
      mutationFn: (p: { eventId: string; phrase: string }) =>
        createMatchRule(activeHouseholdId!, p.eventId, p.phrase),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (p: { eventId: string; ruleId: string }) =>
        deleteMatchRule(activeHouseholdId!, p.eventId, p.ruleId),
      onSuccess: refresh,
    }),
    preview: useMutation({
      mutationFn: (phrase: string) => previewMatchRule(activeHouseholdId!, phrase),
    }),
  }
}
