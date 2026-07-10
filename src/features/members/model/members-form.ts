import { z } from 'zod'

import type {
  HouseholdRole,
  MemberItem,
  PermissionLevel,
} from '@/features/members/model/members'
import { localizedEmailField } from '@/shared/lib/validation'

export type InviteForm = {
  email: string
  role: Extract<HouseholdRole, 'partner' | 'viewer'>
}

export const defaultInviteFormValues: InviteForm = {
  email: '',
  role: 'partner',
}

export const roleTone: Record<HouseholdRole, string> = {
  owner: 'bg-[hsla(var(--accent),0.12)] text-[hsl(var(--accent))]',
  partner: 'bg-[hsla(var(--status-blue),0.1)] text-[hsl(var(--status-blue))]',
  viewer: 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]',
}

export const defaultPermissionForRole: Record<HouseholdRole, PermissionLevel> = {
  owner: 'admin',
  partner: 'edit_content',
  viewer: 'view_summary',
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
    role: z.enum(['partner', 'viewer']),
  })
}
