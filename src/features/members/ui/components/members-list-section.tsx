import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberRow } from '@/features/members/ui/components/member-row'
import type {
  HouseholdRole,
  MemberItem,
  PermissionLevel,
} from '@/features/members/model/members.types'

type MembersListSectionProps = {
  members: MemberItem[]
  isLoading: boolean
  invitedCount: number
  roleLabels: Record<HouseholdRole, string>
  permissionLabels: Record<PermissionLevel, string>
  isUpdating: boolean
  onUpdateRole: (id: string, role: HouseholdRole) => void
  onUpdatePermission: (id: string, permission: PermissionLevel) => void
  onRemove: (id: string) => void
}

export function MembersListSection({
  members,
  isLoading,
  invitedCount,
  roleLabels,
  permissionLabels,
  isUpdating,
  onUpdateRole,
  onUpdatePermission,
  onRemove,
}: MembersListSectionProps) {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader
        title={t('household.merged.membersTitle')}
        meta={t('members.list.count', { count: members.length })}
      />

      <div className="mt-7 space-y-1">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => <MemberRowSkeleton key={index} />)
          : null}
        {!isLoading &&
          members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              roleLabels={roleLabels}
              permissionLabels={permissionLabels}
              isUpdating={isUpdating}
              onUpdateRole={onUpdateRole}
              onUpdatePermission={onUpdatePermission}
              onRemove={onRemove}
            />
          ))}
      </div>

      <div className="sunk mt-5 flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-5 text-ink2">
          {invitedCount > 0
            ? t('members.list.invitedCount', { count: invitedCount })
            : t('household.merged.membersHelp')}
        </p>
        <span className="text-[12px] text-ink3">{t('household.merged.permissionNote')}</span>
      </div>
    </Panel>
  )
}

function MemberRowSkeleton() {
  return (
    <div className="grid gap-4 rounded-sunk px-4 py-3 lg:grid-cols-[1.2fr_.8fr_.9fr_120px] lg:items-center">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-4 w-24" />
    </div>
  )
}
