import { useQuery } from '@tanstack/react-query'

import { listActivity } from '#/features/activity/api/activity.repository'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

export function useActivity({ limit }: { limit?: number } = {}) {
  const { activeHouseholdId } = useActiveHousehold()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.activity(activeHouseholdId, limit)
      : ['activity', 'inactive'],
    queryFn: () => listActivity(activeHouseholdId!, { limit }),
    enabled: !!activeHouseholdId,
  })

  return { entries: query.data?.items ?? [], activeHouseholdId, ...query }
}
