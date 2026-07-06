import { z } from 'zod'

/**
 * Money shorthand used across the app, e.g. "12M", "1,8M", "20M", "500K", "4.5M".
 * Accepts an optional leading +/- sign, a number (comma or dot decimal),
 * and an optional K/M/B suffix.
 */
const moneyPattern = /^[+-]?\d+([.,]\d+)?\s*[kKmMbB]?$/

export const moneyAmount = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập số tiền')
  .refine((value) => moneyPattern.test(value), {
    message: 'Số tiền không hợp lệ (ví dụ: 12M, 1,8M, 500K)',
  })

/** Optional money amount — empty string is allowed and treated as "0". */
export const optionalMoneyAmount = z
  .string()
  .trim()
  .refine((value) => value === '' || moneyPattern.test(value), {
    message: 'Số tiền không hợp lệ (ví dụ: 12M, 1,8M, 500K)',
  })

export const requiredText = (label: string, max = 80) =>
  z
    .string()
    .trim()
    .min(1, `Vui lòng nhập ${label}`)
    .max(max, `${label} tối đa ${max} ký tự`)

export const optionalText = (max = 200) =>
  z.string().trim().max(max, `Tối đa ${max} ký tự`)

export const emailField = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập email')
  .email('Email không hợp lệ')

export const isoDate = z
  .string()
  .min(1, 'Vui lòng chọn ngày')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Ngày không hợp lệ',
  })
