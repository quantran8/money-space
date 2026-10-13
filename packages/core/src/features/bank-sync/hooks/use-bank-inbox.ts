import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import {
  getBankEventCounts,
  listBankEvents,
  reparseBankEvent,
  resolveBankEvent,
} from '#/features/bank-sync/api/bank-sync.repository'
import {
  BANK_INBOX_TAB_STATUSES,
  type BankInboxTab,
  type BankResolvePayload,
} from '#/features/bank-sync/model/bank-sync.types'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'
import { getErrorMessage } from '#/shared/lib/get-error-message'
import { notify } from '#/shared/notify'

const PAGE_SIZE = 30

/** Open-item counts for the nav badge and the inbox tabs. */
export function useBankInboxCounts(enabled = true) {
  const { activeHouseholdId } = useActiveHousehold()
  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.bankEventCounts(activeHouseholdId)
      : ['bank-event-counts', 'inactive'],
    queryFn: () => getBankEventCounts(activeHouseholdId!),
    enabled: enabled && !!activeHouseholdId,
    staleTime: 60_000,
  })
  const counts = query.data?.counts ?? {}
  return {
    total: query.data?.total ?? 0,
    byTab: {
      unmapped: counts.UNMAPPED ?? 0,
      review: (counts.REVIEW ?? 0) + (counts.FAILED ?? 0),
      parse_failed: counts.PARSE_FAILED ?? 0,
    } satisfies Record<BankInboxTab, number>,
  }
}

export function useBankInbox(tab: BankInboxTab) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()

  const query = useInfiniteQuery({
    queryKey: activeHouseholdId
      ? queryKeys.bankEvents(activeHouseholdId, tab)
      : ['bank-events', 'inactive', tab],
    queryFn: ({ pageParam }) =>
      listBankEvents(activeHouseholdId!, {
        statuses: BANK_INBOX_TAB_STATUSES[tab],
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: !!activeHouseholdId,
  })

  // A posted event is a money write: refresh the whole household, not just the inbox.
  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.household(activeHouseholdId!) })

  const resolveMutation = useMutation({
    mutationFn: (p: BankResolvePayload & { id: string }) => {
      const { id, ...payload } = p
      return resolveBankEvent(activeHouseholdId!, id, payload)
    },
    onSuccess: (event) => {
      notify.success(
        event.status === 'IGNORED' ? t('bankSync.inbox.ignored') : t('bankSync.inbox.posted'),
      )
      void invalidateAll()
    },
    onError: (error) => notify.error(getErrorMessage(error, t('bankSync.inbox.resolveFailed'))),
  })

  const reparseMutation = useMutation({
    mutationFn: (id: string) => reparseBankEvent(activeHouseholdId!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bankSync(activeHouseholdId!) })
    },
    onError: (error) => notify.error(getErrorMessage(error, t('bankSync.inbox.reparseFailed'))),
  })

  return {
    events: query.data?.pages.flatMap((page) => page.items) ?? [],
    isLoading: query.isLoading,
    error: query.error,
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
    post: (id: string, assetId?: string, cashflowEventId?: string) =>
      resolveMutation.mutateAsync({ id, action: 'post', assetId, cashflowEventId }),
    replaceManual: (id: string, cashflowEventId: string, assetId?: string) =>
      resolveMutation.mutateAsync({ id, action: 'replace_manual', assetId, cashflowEventId }),
    ignore: (id: string) => resolveMutation.mutateAsync({ id, action: 'ignore' }),
    isResolving: resolveMutation.isPending,
    reparse: (id: string) => reparseMutation.mutateAsync(id),
    isReparsing: reparseMutation.isPending,
  }
}
