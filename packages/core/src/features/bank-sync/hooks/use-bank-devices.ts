import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  createBankCredential,
  listBankCredentials,
  revokeBankCredential,
} from '#/features/bank-sync/api/bank-sync.repository'
import type { CreatedBankCredential } from '#/features/bank-sync/model/bank-sync.types'
import { usePremiumAction } from '#/features/billing/hooks/use-premium-action'
import { ApiError } from '#/shared/api/http'
import { queryKeys } from '#/shared/api/query-keys'
import { clipboard } from '#/shared/clipboard'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'
import { getErrorMessage } from '#/shared/lib/get-error-message'
import { notify } from '#/shared/notify'

/** The caller's own Shortcuts tokens. A raw token is held in memory once, then dropped. */
export function useBankDevices() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()
  const { run } = usePremiumAction()
  const [created, setCreated] = useState<CreatedBankCredential | null>(null)

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.bankCredentials(activeHouseholdId)
      : ['bank-credentials', 'inactive'],
    queryFn: () => listBankCredentials(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.bankCredentials(activeHouseholdId!) })

  const createMutation = useMutation({
    mutationFn: (deviceLabel: string) => createBankCredential(activeHouseholdId!, deviceLabel),
    onSuccess: (result) => {
      setCreated(result)
      void invalidate()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 402) return
      notify.error(getErrorMessage(error, t('bankSync.devices.createFailed')))
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeBankCredential(activeHouseholdId!, id),
    onSuccess: () => {
      notify.success(t('bankSync.devices.revoked'))
      void invalidate()
    },
    onError: (error) => notify.error(getErrorMessage(error, t('common.genericError'))),
  })

  const create = useCallback(
    (deviceLabel: string) =>
      run({ reason: 'bank_sync' }, () => createMutation.mutateAsync(deviceLabel)),
    [run, createMutation],
  )

  const copyToken = useCallback(async () => {
    if (!created) return
    try {
      await clipboard.writeText(created.token)
      notify.success(t('bankSync.devices.tokenCopied'))
    } catch {
      notify.error(t('bankSync.devices.copyFailed'))
    }
  }, [created, t])

  return {
    devices: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create,
    isCreating: createMutation.isPending,
    created,
    clearCreated: () => setCreated(null),
    copyToken,
    revoke: (id: string) => revokeMutation.mutateAsync(id),
    isRevoking: revokeMutation.isPending,
  }
}
