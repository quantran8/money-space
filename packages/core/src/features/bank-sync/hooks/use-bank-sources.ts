import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  createBankSource,
  linkBankSource,
  listBankSources,
  unlinkBankSource,
  updateBankSource,
} from '#/features/bank-sync/api/bank-sync.repository'
import {
  normalizeAccountNumber,
  type SourceFormValues,
} from '#/features/bank-sync/model/bank-sync.schemas'
import type {
  BankPostingMode,
  BankProviderCode,
  BankSource,
} from '#/features/bank-sync/model/bank-sync.types'
import { useAssets } from '#/features/assets/hooks/use-assets'
import { isWalletAssetType } from '#/features/assets/model/assets'
import { usePremiumAction } from '#/features/billing/hooks/use-premium-action'
import { ApiError } from '#/shared/api/http'
import { queryKeys } from '#/shared/api/query-keys'
import { useActiveHousehold } from '#/shared/hooks/use-active-household'
import { getErrorMessage } from '#/shared/lib/get-error-message'
import { notify } from '#/shared/notify'

/** Bank accounts the household linked, and the wallets they may point at. */
export function useBankSources() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { activeHouseholdId } = useActiveHousehold()
  const { run } = usePremiumAction()
  const { assets } = useAssets()

  const query = useQuery({
    queryKey: activeHouseholdId
      ? queryKeys.bankSources(activeHouseholdId)
      : ['bank-sources', 'inactive'],
    queryFn: () => listBankSources(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  // Only an active cash/bank wallet can receive a posting; the server enforces the same.
  const walletOptions = useMemo(
    () =>
      assets
        .filter((a) => isWalletAssetType(a.type) && (a.status ?? 'active') === 'active')
        .map((a) => ({ value: a.id, label: a.name })),
    [assets],
  )

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.bankSync(activeHouseholdId!) })

  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.statusCode === 402) return
    notify.error(getErrorMessage(error, t('common.genericError')))
  }

  const addMutation = useMutation({
    mutationFn: async (values: SourceFormValues) => {
      const source = await createBankSource(activeHouseholdId!, {
        providerCode: values.providerCode as BankProviderCode,
        accountNumber: normalizeAccountNumber(values.accountNumber)!,
        displayLabel: values.displayLabel || undefined,
      })
      // New links always start in REVIEW; AUTO is a separate, confirmed step.
      return linkBankSource(activeHouseholdId!, source.id, {
        assetId: values.assetId,
        postingMode: 'REVIEW',
      })
    },
    onSuccess: (result) => {
      notify.success(
        result.reprocessed > 0
          ? t('bankSync.sources.linkedWithPending', { count: result.reprocessed })
          : t('bankSync.sources.linked'),
      )
      void invalidate()
    },
    onError,
  })

  const linkMutation = useMutation({
    mutationFn: (p: { source: BankSource; assetId: string; postingMode: BankPostingMode }) =>
      linkBankSource(activeHouseholdId!, p.source.id, {
        assetId: p.assetId,
        postingMode: p.postingMode,
      }),
    onSuccess: () => void invalidate(),
    onError,
  })

  const unlinkMutation = useMutation({
    mutationFn: (id: string) => unlinkBankSource(activeHouseholdId!, id),
    onSuccess: () => void invalidate(),
    onError,
  })

  const statusMutation = useMutation({
    mutationFn: (p: { id: string; status: 'ACTIVE' | 'DISABLED' }) =>
      updateBankSource(activeHouseholdId!, p.id, { status: p.status }),
    onSuccess: () => void invalidate(),
    onError,
  })

  const add = useCallback(
    (values: SourceFormValues) =>
      run({ reason: 'bank_sync' }, () => addMutation.mutateAsync(values)),
    [run, addMutation],
  )

  return {
    sources: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error,
    walletOptions,
    add,
    isAdding: addMutation.isPending,
    setLink: (source: BankSource, assetId: string, postingMode: BankPostingMode) =>
      linkMutation.mutateAsync({ source, assetId, postingMode }),
    isLinking: linkMutation.isPending,
    unlink: (id: string) => unlinkMutation.mutateAsync(id),
    setStatus: (id: string, status: 'ACTIVE' | 'DISABLED') =>
      statusMutation.mutateAsync({ id, status }),
  }
}
