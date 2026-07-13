import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberRow } from '@/features/members/ui/components/member-row'
import type {
  HouseholdRole,
  MemberItem,
  PermissionLevel,
} from '@/features/members/model/members'

type MembersListSectionProps = {
  members: MemberItem[]
  isLoading: boolean
  activeCount: number
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
  activeCount,
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
    <Card className="lg:col-span-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('members.list.eyebrow')}
          </p>
          <h2 className="section-title mt-1 text-2xl font-semibold">
            {t('members.list.title', { active: activeCount, invited: invitedCount })}
          </h2>
        </div>
        <Users className="size-5 text-[hsl(var(--accent))]" strokeWidth={1.8} />
      </div>

      <div className="space-y-3">
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
    </Card>
  )
}

function MemberRowSkeleton() {
  return (
    <div className="surface-muted rounded-3xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48 rounded-full" />
            <Skeleton className="h-3 w-40 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
