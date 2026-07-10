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
      await queryClient.invalidateQueries({ queryKey: queryKeys.households })
    },
  })

  async function onSubmit(values: OnboardingForm) {
    try {
      await createMutation.mutateAsync({
        name: values.name.trim(),
        currency: values.currency,
        inviteEmail: values.inviteEmail.trim() || undefined,
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
