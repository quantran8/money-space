import { z } from 'zod'

import { localizedRequiredText } from '#/shared/lib/validation'

type Translate = (key: string, params?: Record<string, unknown>) => string

export type HouseholdCurrency = 'VND' | 'USD' | 'THB'

export const currencyOptions: HouseholdCurrency[] = ['VND', 'USD', 'THB']

/**
 * Name and currency only.
 *
 * The optional `inviteEmail` field is gone: inviting is a QR code shown from
 * `/household` once the household exists, so asking for a partner's address here
 * collected something nothing would ever read.
 */
export type OnboardingForm = {
  name: string
  currency: HouseholdCurrency
}

export const onboardingDefaultValues: OnboardingForm = {
  name: '',
  currency: 'VND',
}

export function buildOnboardingSchema(t: Translate) {
  return z.object({
    name: localizedRequiredText(t, t('onboarding.form.nameLabel'), 40),
    currency: z.enum(['VND', 'USD', 'THB']),
  })
}
