import { useMutation } from '@tanstack/react-query'

import { runWhatIf } from '@/features/whatif/api/whatif.repository'
import type { WhatIfRequest } from '@/features/whatif/model/whatif.types'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

/**
 * A mutation rather than a query because it is user-triggered and takes a body
 * — but it writes NOTHING, so there is deliberately no cache invalidation here.
 */
export function useWhatIf() {
  const { activeHouseholdId } = useActiveHousehold()

  const mutation = useMutation({
    mutationFn: (payload: WhatIfRequest) => runWhatIf(activeHouseholdId!, payload),
  })

  return {
    activeHouseholdId,
    result: mutation.data,
    run: mutation.mutateAsync,
    reset: mutation.reset,
    isRunning: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}
