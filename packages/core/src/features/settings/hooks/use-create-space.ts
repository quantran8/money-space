import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { createHousehold } from '#/features/onboarding/api/onboarding.repository'
import {
  buildOnboardingSchema,
  onboardingDefaultValues,
  type OnboardingForm,
} from '#/features/onboarding/model/onboarding-form'
import { useEntitlement } from '#/features/billing/hooks/use-entitlement'
import { ApiError } from '#/shared/api/http'
import { queryKeys } from '#/shared/api/query-keys'
import type { HouseholdListResponse } from '#/shared/hooks/use-active-household'
import { getErrorMessage } from '#/shared/lib/get-error-message'
import { useNavigate } from '#/shared/navigation'
import { notify } from '#/shared/notify'
import { useAppStore } from '#/shared/stores/household-store'
import { usePaywallStore } from '#/shared/stores/paywall-store'
import { useWhatIfStore } from '#/shared/stores/whatif-store'

/** Create another space from inside the app, then open it. See memory/households-and-onboarding.md. */
export function useCreateSpace() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setActiveHouseholdId = useAppStore((state) => state.setActiveHouseholdId)
  const [open, setOpen] = useState(false)
  const { isPremium, limits } = useEntitlement()
  const openPaywall = usePaywallStore((state) => state.openPaywall)

  const schema = useMemo(() => buildOnboardingSchema(t), [t])
  const form = useForm<OnboardingForm>({
    resolver: zodResolver(schema),
    defaultValues: onboardingDefaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  const mutation = useMutation({ mutationFn: createHousehold })

  // Fresh list only on the blocked path, so a space upgraded since the last fetch is not walled.
  async function openDialog() {
    const cached = queryClient.getQueryData<HouseholdListResponse>(queryKeys.households)
    if (!cached?.spaceQuota || cached.spaceQuota.used < cached.spaceQuota.limit) {
      setOpen(true)
      return
    }
    await queryClient.refetchQueries({ queryKey: queryKeys.households, exact: true })
    const quota = queryClient.getQueryData<HouseholdListResponse>(queryKeys.households)?.spaceQuota
    if (!quota || quota.used < quota.limit) {
      setOpen(true)
      return
    }
    // Upgrading the open space would not help when it is already Premium.
    if (isPremium) {
      notify.error(t('settings.spaces.create.limitOtherSpaces', { limit: quota.limit }))
      return
    }
    openPaywall({ reason: 'space_quota', limit: quota.limit, used: quota.used, limits })
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) form.reset(onboardingDefaultValues)
  }

  async function onSubmit(values: OnboardingForm) {
    try {
      const household = await mutation.mutateAsync({
        name: values.name.trim(),
        currency: values.currency,
      })
      // List first: `useActiveHousehold` resets an id it cannot find in the list.
      // `exact` — `['households']` prefixes every household-scoped key.
      await queryClient.refetchQueries({ queryKey: queryKeys.households, exact: true })
      useWhatIfStore.getState().close()
      setActiveHouseholdId(household.id)
      onOpenChange(false)
      notify.success(t('settings.spaces.create.created', { name: household.name }))
      navigate('/')
    } catch (error) {
      // The global 402 handler has already opened the paywall.
      if (error instanceof ApiError && error.statusCode === 402) {
        onOpenChange(false)
        return
      }
      notify.error(getErrorMessage(error, t('onboarding.toast.failed')))
    }
  }

  return {
    open,
    openDialog: () => void openDialog(),
    onOpenChange,
    form,
    isCreating: mutation.isPending,
    submit: form.handleSubmit(onSubmit),
  }
}

export type CreateSpace = ReturnType<typeof useCreateSpace>
