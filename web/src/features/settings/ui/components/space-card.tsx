import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader } from '@/components/ui/panel'
import { SpaceIdentity } from '@/features/settings/ui/components/space-identity'
import { MembersListSection } from '@/features/members/ui/components/members-list-section'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'
import type { Settings } from '@money-space/core/features/settings/model/settings-form'

type SpaceCardProps = {
  form: UseFormReturn<Settings>
  members: MemberItem[]
  isLoadingMembers: boolean
  invitedCount: number
  holdsByMember: Record<string, number>
  ownerMemberId?: string
  viewerMemberId?: string
  isViewerOwner: boolean
  isSavingName: boolean
  onSaveName: () => void
  onInvite: () => void
  onRemoveMember: (memberId: string) => void
}

/**
 * Who this space is: what it is called, what it holds, who is in it, and the
 * plan it is on. One card — separate panels made the same subject read as
 * unrelated settings.
 */
export function SpaceCard({
  form,
  members,
  isLoadingMembers,
  invitedCount,
  holdsByMember,
  ownerMemberId,
  viewerMemberId,
  isViewerOwner,
  isSavingName,
  onSaveName,
  onInvite,
  onRemoveMember,
}: SpaceCardProps) {
  const { t } = useTranslation()
  const sourceCount = Object.values(holdsByMember).reduce((sum, count) => sum + count, 0)

  return (
    <Panel>
      <PanelHeader title={t('settings.household.spaceTitle')} />

      <div className="s-head-body">
        <SpaceIdentity
          form={form}
          memberCount={members.length}
          sourceCount={sourceCount}
          isSaving={isSavingName}
          onSave={onSaveName}
        />
      </div>

      <div className="divider my-6" />

      <MembersListSection
        asBlock
        members={members}
        isLoading={isLoadingMembers}
        invitedCount={invitedCount}
        holdsByMember={holdsByMember}
        ownerMemberId={ownerMemberId}
        viewerMemberId={viewerMemberId}
        isViewerOwner={isViewerOwner}
        onInvite={onInvite}
        onRemoveMember={onRemoveMember}
      />
    </Panel>
  )
}
