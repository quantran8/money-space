import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
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
