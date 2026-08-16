import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberRow } from '@/features/members/ui/components/member-row'
import type { MemberItem } from '@/features/members/model/members.types'

type MembersListSectionProps = {
  members: MemberItem[]
  isLoading: boolean
  invitedCount: number
  /** Money sources each member is responsible for, keyed by member id. */
  holdsByMember: Record<string, number>
  onInvite: () => void
  onRemoveMember: (memberId: string) => void
}

export function MembersListSection({
  members,
  isLoading,
  invitedCount,
  holdsByMember,
  onInvite,
  onRemoveMember,
}: MembersListSectionProps) {
  const { t } = useTranslation()

  /* A solo household gets a more prominent invitation prompt; once there are
   * multiple members, the compact header action keeps the same flow available.
   */
  const isSolo = !isLoading && members.length < 2

  return (
    <Panel>
      <PanelHeader
        title={t('household.merged.membersTitle')}
        action={
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-ink3">
              {t('members.list.count', { count: members.length })}
            </span>
            {!isLoading && !isSolo ? (
              <Button type="button" variant="secondary" size="sm" onClick={onInvite}>
                {t('members.invite.action')}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mt-7 space-y-1">
        {isLoading
          ? Array.from({ length: 2 }).map((_, index) => <MemberRowSkeleton key={index} />)
          : null}
        {!isLoading &&
          members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              holdsCount={holdsByMember[member.id] ?? 0}
              onRemove={onRemoveMember}
            />
          ))}
      </div>

      {isSolo ? (
        <div className="sunk mt-5 flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-5 text-ink2">{t('members.list.soloPrompt')}</p>
          <Button type="button" className="h-10 shrink-0 px-4 text-[13px]" onClick={onInvite}>
            {t('members.invite.action')}
          </Button>
        </div>
      ) : (
        <div className="sunk mt-5 px-4 py-3.5">
          <p className="text-[12px] leading-5 text-ink2">
            {invitedCount > 0
              ? t('members.list.invitedCount', { count: invitedCount })
              : t('household.merged.membersHelp')}
          </p>
        </div>
      )}
    </Panel>
  )
}

function MemberRowSkeleton() {
  return (
    <div className="grid gap-4 rounded-sunk px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
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
