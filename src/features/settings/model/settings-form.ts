import { z } from 'zod'

import { supportedLanguages } from '@/i18n/config'
import type { AppLanguage } from '@/i18n/config'
import { localizedRequiredText } from '@/shared/lib/validation'

export type SharingLevel = 'overview' | 'grouped' | 'detailed'

export type Settings = {
  householdName: string
  currency: 'VND' | 'USD' | 'EUR'
  updateFrequency: 'weekly' | 'biweekly' | 'monthly'
  language: AppLanguage
  reminderPayments: boolean
  reminderUpdate: boolean
  reminderAccess: boolean
  shareAssets: SharingLevel
  shareUpcoming: SharingLevel
  hidePrivateNotes: boolean
}

export const sharingLevels: SharingLevel[] = ['overview', 'grouped', 'detailed']

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
    reminderAccess: z.boolean(),
    shareAssets: z.enum(['overview', 'grouped', 'detailed']),
    shareUpcoming: z.enum(['overview', 'grouped', 'detailed']),
    hidePrivateNotes: z.boolean(),
  })
}
