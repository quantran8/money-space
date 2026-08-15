import { z } from 'zod'

import type { MemberItem } from '@/features/members/model/members.types'
import { localizedEmailField } from '@/shared/lib/validation'

/** Inviting someone is just their email now — there is no role to offer. */
export type InviteForm = {
  email: string
}

export const defaultInviteFormValues: InviteForm = {
  email: '',
}

export function makeInitials(nameOrEmail: string) {
  const source = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail
  const parts = source.trim().split(/[\s._-]+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((part) => part[0] ?? '')
  return (letters.join('') || source.slice(0, 2)).toUpperCase()
}

export function buildInviteSchema(
  t: (key: string, params?: Record<string, unknown>) => string,
  members: MemberItem[],
) {
  return z.object({
    email: localizedEmailField(t).refine(
      (value) => !members.some((member) => member.email === value.trim()),
      { message: t('validation.duplicateEmail') },
    ),
  })
}
