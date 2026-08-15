import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  HouseholdRole,
  MemberItem,
  PermissionLevel,
} from '@/features/members/model/members.types'

type MemberRowProps = {
  member: MemberItem
  roleLabels: Record<HouseholdRole, string>
  permissionLabels: Record<PermissionLevel, string>
  isUpdating: boolean
  onUpdateRole: (id: string, role: HouseholdRole) => void
  onUpdatePermission: (id: string, permission: PermissionLevel) => void
  onRemove: (id: string) => void
}

export function MemberRow({
  member,
  roleLabels,
  permissionLabels,
  isUpdating,
  onUpdateRole,
  onUpdatePermission,
  onRemove,
}: MemberRowProps) {
  const { t } = useTranslation()

  return (
    <article className="rounded-sunk px-3 py-3 transition-colors hover:bg-sunk sm:px-4">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr_.9fr_120px] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-sunk text-[12px] font-medium">
            {member.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[13px] font-medium">{member.name}</p>
              {member.role === 'owner' ? (
                <span className="rounded-full bg-sunk px-2 py-1 text-[10px]">
                  {roleLabels[member.role]}
                </span>
              ) : null}
              {member.status === 'invited' ? (
                <span className="rounded-full bg-attention-tint px-2 py-1 text-[10px] text-attention">
                  {t('members.list.pending')}
                </span>
              ) : null}
            </div>
            <p className="mt-1 truncate text-[11px] text-ink3">{member.email}</p>
          </div>
        </div>

        <div>
          <p className="label lg:hidden">{t('members.list.role')}</p>
          {member.role === 'owner' ? (
            <p className="mt-1.5 text-[13px] lg:mt-0">{roleLabels[member.role]}</p>
          ) : (
          <Select
            value={member.role}
            disabled={isUpdating}
            onValueChange={(value) => onUpdateRole(member.id, value as HouseholdRole)}
          >
            <SelectTrigger className="h-9 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(roleLabels) as HouseholdRole[]).map((role) => (
                <SelectItem key={role} value={role}>
                  {roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="label lg:hidden">{t('members.list.permission')}</p>
          {member.role === 'owner' ? (
            <p className="mt-1.5 text-[13px] lg:mt-0">{permissionLabels[member.permission]}</p>
          ) : (
          <Select
            value={member.permission}
            disabled={isUpdating}
            onValueChange={(value) => onUpdatePermission(member.id, value as PermissionLevel)}
          >
            <SelectTrigger className="h-9 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(permissionLabels) as PermissionLevel[]).map((permission) => (
                <SelectItem key={permission} value={permission}>
                  {permissionLabels[permission]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <span className="inline-flex items-center gap-2 text-[12px]">
            <span className={member.status === 'active' ? 'size-1.5 rounded-full bg-accent' : 'size-1.5 rounded-full bg-attention'} />
            {member.status === 'active' ? t('members.list.active') : t('members.list.pending')}
          </span>
          {member.role !== 'owner' ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(member.id)} className="text-alert hover:bg-alert-tint hover:text-alert">
              {t('common.remove')}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
