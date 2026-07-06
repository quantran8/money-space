import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  householdMembers,
  permissionLabels,
  roleLabels,
  type HouseholdRole,
  type MemberItem,
  type PermissionLevel,
} from '@/lib/mock-data'
import { emailField } from '@/lib/validation'

const roleTone: Record<HouseholdRole, string> = {
  owner: 'bg-[hsla(var(--accent),0.12)] text-[hsl(var(--accent))]',
  partner: 'bg-[hsla(var(--status-blue),0.1)] text-[hsl(var(--status-blue))]',
  viewer: 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]',
}

const defaultPermissionForRole: Record<HouseholdRole, PermissionLevel> = {
  owner: 'admin',
  partner: 'edit_content',
  viewer: 'view_summary',
}

function makeInitials(nameOrEmail: string) {
  const source = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail
  const parts = source.trim().split(/[\s._-]+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((part) => part[0] ?? '')
  return (letters.join('') || source.slice(0, 2)).toUpperCase()
}

type InviteForm = {
  email: string
  role: Extract<HouseholdRole, 'partner' | 'viewer'>
}

export function MembersPage() {
  const [members, setMembers] = useState<MemberItem[]>(householdMembers)

  const activeCount = members.filter((member) => member.status === 'active').length
  const invitedCount = members.filter((member) => member.status === 'invited').length

  const inviteSchema = useMemo(
    () =>
      z.object({
        email: emailField.refine(
          (value) => !members.some((member) => member.email === value.trim()),
          { message: 'Email này đã ở trong nhà' },
        ),
        role: z.enum(['partner', 'viewer']),
      }),
    [members],
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'partner' },
    mode: 'onChange',
  })

  function handleInvite(values: InviteForm) {
    const email = values.email.trim()

    const nextMember: MemberItem = {
      id: `m${members.length + 1}-${email}`,
      name: email.split('@')[0],
      email,
      initials: makeInitials(email),
      role: values.role,
      permission: defaultPermissionForRole[values.role],
      joinedAt: 'Vừa mời',
      lastActive: 'Chưa hoạt động',
      status: 'invited',
    }

    setMembers((current) => [...current, nextMember])
    reset({ email: '', role: 'partner' })
  }

  function updateRole(id: string, role: HouseholdRole) {
    setMembers((current) =>
      current.map((member) =>
        member.id === id
          ? { ...member, role, permission: defaultPermissionForRole[role] }
          : member,
      ),
    )
  }

  function updatePermission(id: string, permission: PermissionLevel) {
    setMembers((current) =>
      current.map((member) => (member.id === id ? { ...member, permission } : member)),
    )
  }

  function removeMember(id: string) {
    setMembers((current) => current.filter((member) => member.id !== id))
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Thành viên trong nhà"
        title="Ai đang cùng quản lý tiền nhà mình"
        description="Mời bạn đời hoặc người thân, và quyết định mỗi người thấy được bao nhiêu và làm được những gì."
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Danh sách thành viên</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                {activeCount} đang tham gia · {invitedCount} đã mời
              </h2>
            </div>
            <Users className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="rounded-[24px] border bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="surface-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{member.name}</p>
                        <Badge className={roleTone[member.role]}>{roleLabels[member.role]}</Badge>
                        {member.status === 'invited' ? (
                          <Badge className="bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]">
                            Chờ xác nhận
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-[hsl(var(--muted-foreground))]">
                        {member.email}
                      </p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        Tham gia {member.joinedAt} · Hoạt động {member.lastActive}
                      </p>
                    </div>
                  </div>

                  {member.role !== 'owner' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                      className="shrink-0 text-[hsl(var(--status-red))] hover:bg-[hsla(var(--status-red),0.08)] hover:text-[hsl(var(--status-red))]"
                    >
                      Gỡ
                    </Button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Vai trò
                    </Label>
                    <Select
                      value={member.role}
                      disabled={member.role === 'owner'}
                      onValueChange={(value) => updateRole(member.id, value as HouseholdRole)}
                    >
                      <SelectTrigger>
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
                      Quyền xem
                    </Label>
                    <Select
                      value={member.permission}
                      disabled={member.role === 'owner'}
                      onValueChange={(value) =>
                        updatePermission(member.id, value as PermissionLevel)
                      }
                    >
                      <SelectTrigger>
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
            ))}
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-5">
          <Card>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Mời người mới</p>
                <h2 className="section-title mt-1 text-2xl font-semibold">Gửi lời mời</h2>
              </div>
              <UserPlus className="size-5 text-[hsl(var(--accent))]" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(handleInvite)} noValidate>
              <FormField label="Email" error={errors.email?.message}>
                <Input
                  type="email"
                  placeholder="vidu@email.com"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
              </FormField>

              <FormField label="Vai trò" error={errors.role?.message}>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.role}>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="partner">Bạn đời</SelectItem>
                        <SelectItem value="viewer">Người xem</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <div className="surface-muted rounded-[22px] p-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Người được mời sẽ nhận email xác nhận. Bạn có thể điều chỉnh quyền xem của họ bất
                cứ lúc nào sau khi họ tham gia.
              </div>

              <Button type="submit" className="w-full" disabled={!isValid}>
                <Mail className="mr-2 size-4" />
                Gửi lời mời
              </Button>
            </form>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-5 text-[hsl(var(--accent))]" />
              <h3 className="text-lg font-semibold">Về quyền truy cập</h3>
            </div>
            <div className="space-y-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              <p>
                <span className="font-medium text-[hsl(var(--foreground))]">Chủ hộ</span> có toàn
                quyền quản lý thành viên và dữ liệu.
              </p>
              <p>
                <span className="font-medium text-[hsl(var(--foreground))]">Bạn đời</span> có thể
                thêm và sửa số liệu nhưng không đổi quyền của người khác.
              </p>
              <p>
                <span className="font-medium text-[hsl(var(--foreground))]">Người xem</span> chỉ
                nhìn được phần được chia sẻ, theo mức quyền bạn chọn.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
