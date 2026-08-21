import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { createHousehold } from '@/features/onboarding/api/onboarding.repository'
import {
  buildOnboardingSchema,
  onboardingDefaultValues,
  type OnboardingForm,
} from '@/features/onboarding/model/onboarding-form'
import { queryKeys } from '@/shared/api/query-keys'
import { getErrorMessage } from '@/shared/lib/get-error-message'
import { useAppStore } from '@/shared/stores/household-store'
import { useAuthStore } from '@/shared/stores/auth-store'

/**
 * Creating the household — the whole of the "create" branch of onboarding.
 *
 * It used to hand off to a nine-screen wizard on success (`setOnboardingStep`).
 * Now it navigates straight into the app: the household is the only thing that
 * had to exist first, and every other piece of setup has its own home.
 */
export function useOnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setActiveHouseholdId = useAppStore((state) => state.setActiveHouseholdId)
  const user = useAuthStore((state) => state.user)

  const schema = useMemo(() => buildOnboardingSchema(t), [t])

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(schema),
    defaultValues: onboardingDefaultValues,
    mode: 'onChange',
  })

  const createMutation = useMutation({
    mutationFn: createHousehold,
    onSuccess: async (household) => {
      setActiveHouseholdId(household.id)
      /**
       * REFETCH, not invalidate. `RequireHousehold` is the only reader of this
       * query and it is not mounted while we are on /onboarding, so the
       * `households` entry has no active observer. `invalidateQueries` defaults
       * to `refetchType: 'active'` — with nothing observing, it marks the entry
       * stale and resolves WITHOUT fetching, so awaiting it guaranteed nothing.
       * The gate then mounted against an empty (or absent) list and bounced the
       * user straight back here.
       *
       * `refetchQueries` fetches regardless of observers, so the cache holds the
       * new household before we navigate.
       */
      await queryClient.refetchQueries({ queryKey: queryKeys.households })
    },
  })

  async function onSubmit(values: OnboardingForm) {
    try {
      await createMutation.mutateAsync({
        name: values.name.trim(),
        currency: values.currency,
      })
      toast.success(t('onboarding.toast.created'))
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, t('onboarding.toast.failed')))
    }
  }

  return {
    user,
    form,
    isCreating: createMutation.isPending,
    submit: form.handleSubmit(onSubmit),
  }
}
