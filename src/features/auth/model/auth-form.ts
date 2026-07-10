import { z } from 'zod'

import { localizedEmailField, localizedRequiredText } from '@/shared/lib/validation'

type Translate = (key: string, params?: Record<string, unknown>) => string

export type AuthTab = 'login' | 'signup'

export type LoginForm = {
  email: string
  password: string
  remember: boolean
}

export type SignupForm = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

export const loginDefaultValues: LoginForm = {
  email: '',
  password: '',
  remember: true,
}

export const signupDefaultValues: SignupForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
}

const MIN_PASSWORD_LENGTH = 8

export function buildLoginSchema(t: Translate) {
  return z.object({
    email: localizedEmailField(t),
    password: z.string().min(1, t('auth.validation.requiredPassword')),
    remember: z.boolean(),
  })
}

export function buildSignupSchema(t: Translate) {
  return z
    .object({
      fullName: localizedRequiredText(t, t('auth.fields.fullName'), 60),
      email: localizedEmailField(t),
      password: z
        .string()
        .min(MIN_PASSWORD_LENGTH, t('auth.validation.passwordTooShort', { min: MIN_PASSWORD_LENGTH })),
      confirmPassword: z.string().min(1, t('auth.validation.requiredConfirm')),
      agreeTerms: z.boolean(),
    })
    .superRefine((values, ctx) => {
      if (values.confirmPassword !== values.password) {
        ctx.addIssue({
          path: ['confirmPassword'],
          code: 'custom',
          message: t('auth.validation.passwordMismatch'),
        })
      }
      if (!values.agreeTerms) {
        ctx.addIssue({
          path: ['agreeTerms'],
          code: 'custom',
          message: t('auth.validation.mustAgree'),
        })
      }
    })
}
