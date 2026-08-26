import { UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberRow } from '@/features/members/ui/components/member-row'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'

type MembersListSectionProps = {
  members: MemberItem[]
  isLoading: boolean
  invitedCount: number
  /** Money sources each member is responsible for, keyed by member id. */
  holdsByMember: Record<string, number>
  /** Member id of whoever created the household; that row cannot be removed. */
  ownerMemberId?: string
  /** Member id of the signed-in person; the only row they can act on. */
  viewerMemberId?: string
  /** True when the signed-in person created the household. */
  isViewerOwner: boolean
  onInvite: () => void
  onRemoveMember: (memberId: string) => void
}

export function MembersListSection({
  members,
  isLoading,
  invitedCount,
  holdsByMember,
  ownerMemberId,
  viewerMemberId,
  isViewerOwner,
  onInvite,
  onRemoveMember,
}: MembersListSectionProps) {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader
        title={t('household.merged.membersTitle')}
        action={
          <div className="flex items-center gap-3">
            <span className="num t-caption text-ink3">
              {t('members.list.count', { count: members.length })}
            </span>
            {/* Always available, including in a solo household. A separate
                "mời thêm người" prompt used to take the button's place below the
                list, which meant the one household that most needs the action
                was the one household without it in the header. */}
            {!isLoading ? (
              <Button type="button" variant="secondary" size="sm" onClick={onInvite}>
                <UserPlus className="size-4" strokeWidth={1.75} />
                {t('members.invite.action')}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="s-head-body flex flex-col">
        {isLoading
          ? Array.from({ length: 2 }).map((_, index) => <MemberRowSkeleton key={index} />)
          : null}
        {!isLoading &&
          members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              holdsCount={holdsByMember[member.id] ?? 0}
              isOwner={member.id === ownerMemberId}
              isSelf={member.id === viewerMemberId}
              canRemoveOthers={isViewerOwner}
              onRemove={onRemoveMember}
            />
          ))}
      </div>

      {/* A plain line, not a wash strip: it is one more fact about the list
          above it, not a block of its own. */}
      {!isLoading && invitedCount > 0 ? (
        <p className="mt-5 t-caption text-ink3">
          {t('members.list.invitedCount', { count: invitedCount })}
        </p>
      ) : null}
    </Panel>
  )
}

function MemberRowSkeleton() {
  return (
    <div className="grid gap-4 rounded-control px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <Skeleton className="h-4 w-40" />
    </div>
  )
}
