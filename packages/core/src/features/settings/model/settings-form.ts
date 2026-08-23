import { z } from 'zod'

import { supportedLanguages } from '#/i18n/config'
import type { AppLanguage } from '#/i18n/config'
import { localizedRequiredText } from '#/shared/lib/validation'

/*
 * There is deliberately no household-wide sharing default here any more.
 *
 * `shareAssets` / `shareUpcoming` / `hidePrivateNotes` were three controls that
 * never persisted — `updateHouseholdConfig` PATCHes only `currency` — so the
 * user's choice was silently discarded. In a product whose proposition is "you
 * decide what to share", a sharing control that lies is the worst bug on offer.
 *
 * They were also the wrong shape: a household-scoped default is one partner
 * setting a policy for both, which is structurally the asymmetry this model
 * removes at the record level. Sharing is chosen per record, by whoever is
 * looking at it. `DEFAULT_VISIBILITY_LEVEL` in `asset-classification.ts` is the
 * only default a new record needs.
 */

export type Settings = {
  householdName: string
  currency: 'VND' | 'USD' | 'EUR'
  updateFrequency: 'weekly' | 'biweekly' | 'monthly'
  language: AppLanguage
  reminderPayments: boolean
  reminderUpdate: boolean
}

export function isCurrency(value: string): value is Settings['currency'] {
  return value === 'VND' || value === 'USD' || value === 'EUR'
}

export function isFrequency(value: string): value is Settings['updateFrequency'] {
  return value === 'weekly' || value === 'biweekly' || value === 'monthly'
}

export function buildSettingsSchema(t: (key: string, params?: Record<string, unknown>) => string) {
  return z.object({
    householdName: localizedRequiredText(t, t('settings.household.name'), 60),
    currency: z.enum(['VND', 'USD', 'EUR']),
    updateFrequency: z.enum(['weekly', 'biweekly', 'monthly']),
    language: z.enum(supportedLanguages),
    reminderPayments: z.boolean(),
    reminderUpdate: z.boolean(),
  })
}
