import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { roleTone } from '@/features/members/model/members-form'
import type {
  HouseholdRole,
  MemberItem,
  PermissionLevel,
} from '@/features/members/model/members'

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
    <div className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
            {member.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{member.name}</p>
              <Badge className={roleTone[member.role]}>{roleLabels[member.role]}</Badge>
              {member.status === 'invited' ? (
                <Badge className="bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]">
                  {t('members.list.pending')}
                </Badge>
              ) : (
                <Badge className="bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]">
                  {t('members.list.active')}
                </Badge>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-[hsl(var(--muted-foreground))]">
              {member.email}
            </p>
          </div>
        </div>

        {member.role !== 'owner' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemove(member.id)}
            className="shrink-0 border-[hsla(var(--status-red),0.25)] text-[hsl(var(--status-red))] hover:bg-[hsla(var(--status-red),0.06)] hover:text-[hsl(var(--status-red))]"
          >
            {t('common.remove')}
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t('members.list.role')}</Label>
          <Select
            value={member.role}
            disabled={member.role === 'owner' || isUpdating}
            onValueChange={(value) => onUpdateRole(member.id, value as HouseholdRole)}
          >
            <SelectTrigger className="rounded-xl bg-muted/45">
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
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('members.list.permission')}
          </Label>
          <Select
            value={member.permission}
            disabled={member.role === 'owner' || isUpdating}
            onValueChange={(value) => onUpdatePermission(member.id, value as PermissionLevel)}
          >
            <SelectTrigger className="rounded-xl bg-muted/45">
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
        </div>
      </div>
    </div>
  )
}
