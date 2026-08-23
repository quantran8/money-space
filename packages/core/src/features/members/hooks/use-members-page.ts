import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { notify } from '#/shared/notify'

import { useMembers } from '#/features/members/hooks/use-members'
import { currentMemberId } from '#/features/members/model/members.types'
import { useAssets } from '#/features/assets/hooks/use-assets'
import { queryKeys } from '#/shared/api/query-keys'
import { getErrorMessage } from '#/shared/lib/get-error-message'
import { useAppStore } from '#/shared/stores/household-store'
import { useAuthStore } from '#/shared/stores/auth-store'

/**
 * State for the members list.
 *
 * There is no invite form here any more. Adding someone is a QR code
 * (`useHouseholdInvite`), which means the new member arrives through
 * `POST /api/invites/:token/accept` with their own identity attached — rather
 * than as a placeholder row created from an email the inviter typed for them.
 */
export function useMembersPage() {
  const { t } = useTranslation()
  const { members, household, updateMember, deleteMember, isLoading } = useMembers()
  const userId = useAuthStore((state) => state.user?.id)
  const queryClient = useQueryClient()
  const setActiveHouseholdId = useAppStore((state) => state.setActiveHouseholdId)

  const [removeId, setRemoveId] = useState<string | null>(null)

  /**
   * How many money sources each person is responsible for.
   *
   * This replaces the role and access-level columns: the members list now
   * answers "who is responsible for what" instead of "who is allowed what".
   */
  const { assets } = useAssets()
  const holdsByMember = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const asset of assets) {
      if (!asset.holderMemberId) continue
      counts[asset.holderMemberId] = (counts[asset.holderMemberId] ?? 0) + 1
    }
    return counts
  }, [assets])

  /**
   * Who may remove whom.
   *
   * The creator's row is what the backend's household guard resolves against,
   * so `DELETE /members/:id` refuses it outright — offering the action on that
   * row could only ever produce an error toast. Handing the role over is a
   * separate flow (`POST /households/:id/transfer-steward`).
   *
   * Everyone else gets one door out and it is their own: a non-creator can
   * leave, and cannot remove the other person. Taking someone else out of the
   * shared picture is the creator's call, not something either partner can do
   * to the other.
   */
  const ownerMemberId = household?.createdBy
    ? members.find((member) => member.profileId === household.createdBy)?.id
    : undefined
  const viewerMemberId = currentMemberId(members, userId)
  const isViewerOwner = !!ownerMemberId && ownerMemberId === viewerMemberId

  const activeCount = members.filter((member) => member.status === 'active').length
  const invitedCount = members.filter((member) => member.status === 'invited').length

  const removingMember = removeId
    ? members.find((member) => member.id === removeId)
    : undefined

  /** True when the pending removal is the signed-in member leaving. */
  const isLeaving = !!removeId && removeId === viewerMemberId

  async function removeMember(id: string) {
    const leaving = id === viewerMemberId
    try {
      await deleteMember.mutateAsync(id)
      if (leaving) {
        // The membership row is what made this household visible, so the stored
        // id and the cached list both have to go before the caller navigates —
        // `RequireHousehold` reads that list, and a stale one would send the
        // user straight back into a household they just left.
        setActiveHouseholdId(null)
        await queryClient.invalidateQueries({ queryKey: queryKeys.households })
      }
      notify.success(leaving ? t('members.list.left') : t('members.list.removed'))
    } catch (error) {
      notify.error(
        getErrorMessage(
          error,
          leaving ? t('members.list.leaveFailed') : t('members.list.removeFailed'),
        ),
      )
      throw error
    }
  }

  return {
    // data
    members,
    isLoading,
    activeCount,
    invitedCount,
    holdsByMember,
    ownerMemberId,
    viewerMemberId,
    isViewerOwner,
    // list actions
    isUpdating: updateMember.isPending,
    setRemoveId,
    removeId,
    removingMember,
    isLeaving,
    isRemoving: deleteMember.isPending,
    removeMember,
  }
}
