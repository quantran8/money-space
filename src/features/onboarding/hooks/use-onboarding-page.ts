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
      // Awaited ON PURPOSE: the submit flow navigates into the app immediately
      // after, and `RequireHousehold` reads this list. Landing before it has
      // refreshed bounces the user straight back to /onboarding.
      await queryClient.invalidateQueries({ queryKey: queryKeys.households })
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
