import { z } from 'zod'

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * Money amount: a plain, separator-free string of digits stored in form state
 * (the UI groups it with "." for display). A value of "0" is not accepted.
 */
const moneyPattern = /^\d+$/

export const moneyAmount = z
  .string()
  .trim()
  .min(1, 'Vui long nhap so tien')
  .refine((value) => moneyPattern.test(value) && Number(value) > 0, {
    message: 'So tien khong hop le',
  })

/** Optional money amount — empty string is allowed and treated as "0". */
export const optionalMoneyAmount = z
  .string()
  .trim()
  .refine((value) => value === '' || moneyPattern.test(value), {
    message: 'So tien khong hop le',
  })

export const localizedMoneyAmount = (t: Translate) =>
  z
    .string()
    .trim()
    .min(1, t('validation.requiredMoney'))
    .refine((value) => moneyPattern.test(value) && Number(value) > 0, {
      message: t('validation.invalidMoney'),
    })

export const localizedOptionalMoneyAmount = (t: Translate) =>
  z.string().trim().refine((value) => value === '' || moneyPattern.test(value), {
    message: t('validation.invalidMoney'),
  })

export const requiredText = (label: string, max = 80) =>
  z
    .string()
    .trim()
    .min(1, `Vui long nhap ${label}`)
    .max(max, `${label} toi da ${max} ky tu`)

export const localizedRequiredText = (t: Translate, label: string, max = 80) =>
  z
    .string()
    .trim()
    .min(1, t('validation.required', { label }))
    .max(max, t('validation.maxLength', { label, max }))

export const optionalText = (max = 200) =>
  z.string().trim().max(max, `Toi da ${max} ky tu`)

export const localizedOptionalText = (t: Translate, max = 200) =>
  z.string().trim().max(max, t('validation.maxLengthGeneric', { max }))

export const emailField = z
  .string()
  .trim()
  .min(1, 'Vui long nhap email')
  .email('Email khong hop le')

export const localizedEmailField = (t: Translate) =>
  z
    .string()
    .trim()
    .min(1, t('validation.requiredEmail'))
    .email(t('validation.invalidEmail'))

export const isoDate = z
  .string()
  .min(1, 'Vui long chon ngay')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Ngay khong hop le',
  })

export const localizedIsoDate = (t: Translate) =>
  z
    .string()
    .min(1, t('validation.requiredDate'))
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: t('validation.invalidDate'),
    })
