import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createMember,
  deleteMember,
  listMembers,
  updateMember,
  type MemberPayload,
} from '@/features/members/api/members.repository'
import type { MemberItem } from '@/features/members/model/members.types'
import { queryKeys } from '@/shared/api/query-keys'
import { useActiveHousehold } from '@/shared/hooks/use-active-household'

const EMPTY_MEMBERS: MemberItem[] = []

export function useMembers() {
  const queryClient = useQueryClient()
  const household = useActiveHousehold()
  const activeHouseholdId = household.activeHouseholdId

  const query = useQuery({
    queryKey: activeHouseholdId ? queryKeys.members(activeHouseholdId) : ['members', 'inactive'],
    queryFn: () => listMembers(activeHouseholdId!),
    enabled: !!activeHouseholdId,
  })

  const invalidate = async () => {
    if (!activeHouseholdId) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.members(activeHouseholdId) })
  }

  return {
    household: query.data?.household ?? household.activeHousehold,
    members: query.data?.items ?? EMPTY_MEMBERS,
    activeHouseholdId,
    ...query,
    createMember: useMutation({
      mutationFn: (payload: MemberPayload) => createMember(activeHouseholdId!, payload),
      onSuccess: invalidate,
    }),
    updateMember: useMutation({
      mutationFn: ({ memberId, payload }: { memberId: string; payload: Partial<MemberPayload> }) =>
        updateMember(activeHouseholdId!, memberId, payload),
      onSuccess: invalidate,
    }),
    deleteMember: useMutation({
      mutationFn: (memberId: string) => deleteMember(activeHouseholdId!, memberId),
      onSuccess: invalidate,
    }),
  }
}
