import { useQuery } from '@tanstack/react-query'

import { getEventsSummary, type EventsSummaryResponse } from '@/features/events/api/events.repository'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

/**
 * Monthly thu/chi/net aggregate for the events summary card. The backend is the
 * source of truth — these figures are computed server-side, NOT re-derived from
 * the event list on the client. `month` is `YYYY-MM`; omitted → current month.
 */
export function useEventsSummary(month?: string) {
  const { activeHouseholdId } = useActiveHousehold()

  return useQuery<EventsSummaryResponse>({
    queryKey: activeHouseholdId
      ? queryKeys.eventsSummary(activeHouseholdId, month)
      : ['events', 'summary', 'inactive', month ?? 'current'],
    queryFn: () => getEventsSummary(activeHouseholdId!, month),
    enabled: !!activeHouseholdId,
  })
}
