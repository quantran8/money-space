import { apiRequest } from '@/shared/api/http'
import type { HouseholdRole, MemberItem, PermissionLevel } from '@/features/members/model/members.types'
import type { HouseholdSummary } from '@/shared/hooks/use-active-household'

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
  role: HouseholdRole
  permission?: PermissionLevel
  joinedAt?: string
  lastActive?: string
  status?: 'active' | 'invited'
}

export function listMembers(householdId: string) {
  return apiRequest<MemberListResponse>(`/api/households/${householdId}/members`)
}

export function createMember(householdId: string, payload: MemberPayload) {
  return apiRequest<MemberItem>(`/api/households/${householdId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateMember(
  householdId: string,
  memberId: string,
  payload: Partial<MemberPayload>,
) {
  return apiRequest<MemberItem>(`/api/households/${householdId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteMember(householdId: string, memberId: string) {
  return apiRequest<{ deleted: boolean; memberId: string }>(
    `/api/households/${householdId}/members/${memberId}`,
    {
      method: 'DELETE',
    },
  )
}
