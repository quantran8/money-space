import { apiRequest } from '#/shared/api/http'
import type { MemberItem } from '#/features/members/model/members.types'
import type { HouseholdSummary } from '#/shared/hooks/use-active-household'

type MemberListResponse = {
  household: HouseholdSummary
  items: MemberItem[]
  total: number
}

export type MemberPayload = {
  profileId?: string
  name: string
  email: string
  initials?: string
  joinedAt?: string
  lastActive?: string
  status?: 'active' | 'invited'
}

export function listMembers(householdId: string) {
  return apiRequest<MemberListResponse>(`/households/${householdId}/members`)
}

export function createMember(householdId: string, payload: MemberPayload) {
  return apiRequest<MemberItem>(`/households/${householdId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateMember(
  householdId: string,
  memberId: string,
  payload: Partial<MemberPayload>,
) {
  return apiRequest<MemberItem>(`/households/${householdId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteMember(householdId: string, memberId: string) {
  return apiRequest<{ deleted: boolean; memberId: string }>(
    `/households/${householdId}/members/${memberId}`,
    {
      method: 'DELETE',
    },
  )
}

/**
 * Leaving is its own endpoint, not `deleteMember` pointed at your own id.
 *
 * `DELETE /members/:memberId` is creator-only on the backend — removing
 * someone is a lifecycle operation over the shared space — so calling it to
 * leave returned 403 for exactly the people who needed it. `DELETE
 * /members/me` carries no id at all: the row is resolved from the bearer
 * token, so there is nothing here that could name someone else.
 */
export function leaveHousehold(householdId: string) {
  return apiRequest<{ left: boolean; memberId: string }>(
    `/households/${householdId}/members/me`,
    {
      method: 'DELETE',
    },
  )
}
