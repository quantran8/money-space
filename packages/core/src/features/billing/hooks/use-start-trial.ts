import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { startTrial } from '#/features/billing/api/billing.repository'
import { useEntitlement } from '#/features/billing/hooks/use-entitlement'
import { ApiError } from '#/shared/api/http'
import { queryKeys } from '#/shared/api/query-keys'
import { notify } from '#/shared/notify'

/**
 * The paywall's free-trial action. A household starts its own trial here — it
 * is never granted at signup. See memory/billing-and-entitlement.md.
 */
export function useStartTrial(onStarted?: () => void) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { entitlement, activeHouseholdId } = useEntitlement()
  const [pending, setPending] = useState(false)

  /**
   * Offered while the answer is still loading is wrong here, unlike the gates:
   * this button SPENDS something, so it waits for a real `trialUsed`.
   */
  const trialDays = entitlement?.trialDays ?? 0
  const canStartTrial =
    !!activeHouseholdId &&
    !!entitlement &&
    !entitlement.trialUsed &&
    entitlement.tier !== 'premium' &&
    trialDays > 0

  async function start() {
    if (!activeHouseholdId || pending) return

    setPending(true)
    try {
      const next = await startTrial(activeHouseholdId)

      queryClient.setQueryData(queryKeys.entitlement(activeHouseholdId), next)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.goals(activeHouseholdId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard(activeHouseholdId),
      })

      notify.success(t('billing.paywall.trial.started', { days: trialDays }))
      onStarted?.()
    } catch (error) {
      // 409 means someone else already took it — refetch rather than insist.
      if (error instanceof ApiError && error.statusCode === 409) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.entitlement(activeHouseholdId),
        })
      }
      notify.error(t('billing.paywall.trial.failed'))
    } finally {
      setPending(false)
    }
  }

  return { canStartTrial, pending, start, trialDays }
}
