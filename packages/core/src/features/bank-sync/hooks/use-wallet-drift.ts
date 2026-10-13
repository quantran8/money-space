import { useQuery } from '@tanstack/react-query'

import { getWalletDrift } from '#/features/bank-sync/api/bank-sync.repository'
import type { WalletDrift } from '#/features/bank-sync/model/bank-sync.types'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'

const NONE: WalletDrift[] = []

/** Wallets whose ledger disagrees with the bank's last reported balance. */
export function useWalletDrift(enabled = true) {
  const { activeHouseholdId } = useActiveHousehold()
  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.bankWalletDrift(activeHouseholdId)
      : ['bank-wallet-drift', 'inactive'],
    queryFn: () => getWalletDrift(activeHouseholdId!),
    enabled: enabled && !!activeHouseholdId,
    staleTime: 60_000,
  })
  const all = query.data ?? NONE
  return {
    drifts: all.filter((d) => d.drift !== 0),
    byAssetId: new Map(all.filter((d) => d.drift !== 0).map((d) => [d.assetId, d])),
    isLoading: query.isLoading,
  }
}
