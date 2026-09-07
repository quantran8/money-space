import { useMutation, useQueryClient } from '@tanstack/react-query'

import { runWhatIf } from '#/features/whatif/api/whatif.repository'
import type { WhatIfRequest, WhatIfResult } from '#/features/whatif/model/whatif.types'
import { usePremiumAction } from '#/features/billing/hooks/use-premium-action'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'
import { queryKeys } from '#/shared/api/query-keys'

/**
 * A mutation rather than a query because it is user-triggered and takes a body
 * — but it writes NOTHING, so there is deliberately no cache invalidation of
 * household data here.
 *
 * The one thing it DOES move is the month's what-if count, so the entitlement
 * is refetched after a run: `usage.whatIfThisMonth` is what the quota line on
 * screen reads, and a stale count would tell the household they have a run
 * left when they do not.
 */
export function useWhatIf() {
  const { activeHouseholdId } = useActiveHousehold()
  const queryClient = useQueryClient()
  const { run: runIfAllowed } = usePremiumAction()

  const mutation = useMutation({
    mutationFn: (payload: WhatIfRequest) => runWhatIf(activeHouseholdId!, payload),
    onSettled: () => {
      if (!activeHouseholdId) return
      // On settled, not on success: a run refused for being over the ceiling
      // is exactly when the count on screen is most wrong.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.entitlement(activeHouseholdId),
      })
    },
  })

  /**
   * Run the scenario, unless the month's quota is already spent.
   *
   * Gated HERE rather than in the sheet so both callers — the first run and the
   * re-run with an asset sale — go through it, and so the mobile app gets the
   * same gate for free. Returns `undefined` when the paywall opened instead,
   * which is the same shape a caller already handles for a failed run.
   */
  async function run(payload: WhatIfRequest): Promise<WhatIfResult | undefined> {
    return await runIfAllowed(
      { reason: 'whatif_quota', quota: 'whatIfPerMonth' },
      () => mutation.mutateAsync(payload),
    )
  }

  return {
    activeHouseholdId,
    result: mutation.data,
    run,
    reset: mutation.reset,
    isRunning: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}
