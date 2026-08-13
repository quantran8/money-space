import { z } from 'zod'

import { supportedLanguages } from '@/i18n/config'
import type { AppLanguage } from '@/i18n/config'
import { localizedRequiredText } from '@/shared/lib/validation'

/**
 * Canonical §30 union — renamed in Phase 11 from `'overview' | 'grouped' |
 * 'detailed'`, which matched nothing on the backend (`detailed` was never a
 * valid value and `private` could not be expressed).
 *
 * Safe to rename outright: these two fields are **not persisted**. The settings
 * save path sends only `currency`, so no stored value can be stranded by the
 * change.
 */
export type SharingLevel = import('@/features/assets/model/asset-classification').VisibilityLevel

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

/** The MVP picker exposes three of the four stored levels — see §30. */
export const sharingLevels: SharingLevel[] = ['detail', 'summary_only', 'private']

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
    shareAssets: z.enum(['summary_only', 'grouped', 'detail', 'private']),
    shareUpcoming: z.enum(['summary_only', 'grouped', 'detail', 'private']),
    hidePrivateNotes: z.boolean(),
  })
}
