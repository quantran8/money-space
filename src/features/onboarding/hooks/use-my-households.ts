import { useQuery } from '@tanstack/react-query'

import { apiRequest } from '@/shared/api/http'
import { queryKeys } from '@/shared/api/query-keys'
import type { HouseholdSummary } from '@/shared/hooks/use-active-household'

type HouseholdListResponse = {
  items: HouseholdSummary[]
  total: number
}

/** Fetches the households the current user belongs to. Drives onboarding gating. */
export function useMyHouseholds() {
  return useQuery({
    queryKey: queryKeys.households,
    queryFn: () => apiRequest<HouseholdListResponse>('/api/households'),
  })
}
