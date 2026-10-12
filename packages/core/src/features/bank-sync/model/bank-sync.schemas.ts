import type { TFunction } from 'i18next'
import { z } from 'zod'

import { BANK_PROVIDERS } from '#/features/bank-sync/model/bank-sync.types'

/** Mirrors the backend's `normalizeAccountNumber`: digits only, 6–19 long. */
export function normalizeAccountNumber(raw: string): string | null {
  const digits = raw.replace(/[\s.-]/g, '')
  return /^\d{6,19}$/.test(digits) ? digits : null
}

export function buildDeviceSchema(t: TFunction) {
  return z.object({
    deviceLabel: z
      .string()
      .trim()
      .min(1, t('bankSync.devices.form.labelRequired'))
      .max(60, t('bankSync.devices.form.labelTooLong')),
  })
}

export function buildSourceSchema(t: TFunction) {
  return z.object({
    providerCode: z.enum(BANK_PROVIDERS as [string, ...string[]], {
      message: t('bankSync.sources.form.providerRequired'),
    }),
    accountNumber: z
      .string()
      .refine((v) => normalizeAccountNumber(v) !== null, t('bankSync.sources.form.accountInvalid')),
    displayLabel: z.string().trim().max(60, t('bankSync.sources.form.labelTooLong')),
    assetId: z.string().min(1, t('bankSync.sources.form.walletRequired')),
  })
}

export type DeviceFormValues = z.infer<ReturnType<typeof buildDeviceSchema>>
export type SourceFormValues = z.infer<ReturnType<typeof buildSourceSchema>>
