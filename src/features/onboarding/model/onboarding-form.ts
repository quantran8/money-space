import { z } from 'zod'

import { localizedRequiredText } from '@/shared/lib/validation'

type Translate = (key: string, params?: Record<string, unknown>) => string

export type HouseholdCurrency = 'VND' | 'USD' | 'THB'

export const currencyOptions: HouseholdCurrency[] = ['VND', 'USD', 'THB']

export type OnboardingForm = {
  name: string
  currency: HouseholdCurrency
  inviteEmail: string
}

export const onboardingDefaultValues: OnboardingForm = {
  name: '',
  currency: 'VND',
  inviteEmail: '',
}

export function buildOnboardingSchema(t: Translate) {
  return z.object({
    name: localizedRequiredText(t, t('onboarding.form.nameLabel'), 40),
    currency: z.enum(['VND', 'USD', 'THB']),
    // Optional invite email — validated only when non-empty.
    inviteEmail: z
      .string()
      .trim()
      .refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
        message: t('validation.invalidEmail'),
      }),
  })
}
