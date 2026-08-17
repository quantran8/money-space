import { apiRequest } from '@/shared/api/http'
import type {
  AcceptInviteResult,
  HouseholdInvite,
  InvitePreview,
} from '@/features/invites/model/invites.types'

type InviteListResponse = {
  householdId: string
  items: HouseholdInvite[]
  total: number
}

export type CreateInvitePayload = {
  /** Optional note of who the token was meant for; the join flow ignores it. */
  inviteeEmail?: string
  inviteePhone?: string
  /** Days until the token stops working. Backend default is 14, max 90. */
  expiresInDays?: number
}

// --- the inviter's side, scoped to the household ----------------------------

export function listInvites(householdId: string) {
  return apiRequest<InviteListResponse>(`/api/households/${householdId}/invites`)
}

export function createInvite(householdId: string, payload: CreateInvitePayload = {}) {
  return apiRequest<HouseholdInvite>(`/api/households/${householdId}/invites`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function revokeInvite(householdId: string, inviteId: string) {
  return apiRequest<{ revoked: boolean; inviteId: string }>(
    `/api/households/${householdId}/invites/${inviteId}`,
    { method: 'DELETE' },
  )
}

// --- the invitee's side, deliberately NOT under /households/:householdId ----
//
// The joiner is not a member yet, so a household-scoped path would 403 them for
// exactly the state they are trying to leave. The backend enforces this by
// route shape (`invite-tokens.controller.ts`); do not "tidy" these two under
// the household prefix.

export function previewInvite(token: string) {
  return apiRequest<InvitePreview>(`/api/invites/${token}`)
}

export function acceptInvite(token: string) {
  return apiRequest<AcceptInviteResult>(`/api/invites/${token}/accept`, {
    method: 'POST',
  })
}
