import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Mail, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { PageHeader } from '@/app/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import {
  type HouseholdRole,
  type PermissionLevel,
} from '@/features/members/model/members'
import { useMembers } from '@/features/members/hooks/use-members'
import { getErrorMessage } from '@/shared/lib/get-error-message'
import { localizedEmailField } from '@/shared/lib/validation'

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
  const { t } = useTranslation()
  const { members, createMember, updateMember, deleteMember, isLoading } = useMembers()
  const [formOpen, setFormOpen] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const roleLabels: Record<HouseholdRole, string> = {
    owner: t('options.role.owner'),
    partner: t('options.role.partner'),
    viewer: t('options.role.viewer'),
  }
  const permissionLabels: Record<PermissionLevel, string> = {
    view_summary: t('options.permission.view_summary'),
    view_grouped: t('options.permission.view_grouped'),
    view_detail: t('options.permission.view_detail'),
    edit_content: t('options.permission.edit_content'),
    admin: t('options.permission.admin'),
  }

  const activeCount = members.filter((member) => member.status === 'active').length
  const invitedCount = members.filter((member) => member.status === 'invited').length

  const inviteSchema = useMemo(
    () =>
      z.object({
        email: localizedEmailField(t).refine(
          (value) => !members.some((member) => member.email === value.trim()),
          { message: t('validation.duplicateEmail') },
        ),
        role: z.enum(['partner', 'viewer']),
      }),
    [members, t],
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

  const removingMember = removeId ? members.find((member) => member.id === removeId) : undefined

  function openInvite() {
    reset({ email: '', role: 'partner' })
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) reset({ email: '', role: 'partner' })
  }

  async function handleInvite(values: InviteForm) {
    try {
      const email = values.email.trim()
      await createMember.mutateAsync({
        name: email.split('@')[0],
        email,
        initials: makeInitials(email),
        role: values.role,
        permission: defaultPermissionForRole[values.role],
        status: 'invited',
      })
      toast.success('Da them thanh vien.')
      handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the them thanh vien.'))
    }
  }

  function updateRole(id: string, role: HouseholdRole) {
    void updateMember
      .mutateAsync({
        memberId: id,
        payload: { role, permission: defaultPermissionForRole[role] },
      })
      .then(() => toast.success('Da cap nhat vai tro thanh vien.'))
      .catch((error) => toast.error(getErrorMessage(error, 'Khong the cap nhat vai tro.')))
  }

  function updatePermission(id: string, permission: PermissionLevel) {
    void updateMember
      .mutateAsync({ memberId: id, payload: { permission } })
      .then(() => toast.success('Da cap nhat quyen thanh vien.'))
      .catch((error) => toast.error(getErrorMessage(error, 'Khong the cap nhat quyen.')))
  }

  async function removeMember(id: string) {
    try {
      await deleteMember.mutateAsync(id)
      toast.success('Da xoa thanh vien.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the xoa thanh vien.'))
      throw error
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t('members.header.eyebrow')}
        title={t('members.header.title')}
        description={t('members.header.description')}
        actions={
          <Button onClick={openInvite}>
            <UserPlus className="mr-2 size-4" />
            {t('members.invite.submit')}
          </Button>
        }
      />

      <SummaryStrip>
        <SummaryTile
          label={t('members.strip.active')}
          value={activeCount}
          dotColor="hsl(var(--status-green))"
        />
        <SummaryTile
          label={t('members.strip.invited')}
          value={invitedCount}
          dotColor="hsl(var(--status-orange))"
        />
        <SummaryTile
          label={t('members.strip.defaultShare')}
          value={t('members.strip.defaultShareValue')}
        />
        <SummaryTile
          label={t('members.strip.lastChange')}
          value={members[0]?.lastActive ?? '—'}
          inverted
        />
      </SummaryStrip>

      <div className="grid gap-4 lg:grid-cols-12">
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
            {!isLoading && members.map((member) => (
              <div key={member.id} className="surface-muted rounded-3xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
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
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-[hsl(var(--muted-foreground))]">
                        {member.email}
                      </p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        {t('common.joined', { date: member.joinedAt })} ·{' '}
                        {t('common.activeAt', { value: member.lastActive })}
                      </p>
                    </div>
                  </div>

                  {member.role !== 'owner' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoveId(member.id)}
                      className="shrink-0 text-[hsl(var(--status-red))] hover:bg-[hsla(var(--status-red),0.08)] hover:text-[hsl(var(--status-red))]"
                    >
                      {t('common.remove')}
                    </Button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {t('members.list.role')}
                    </Label>
                    <Select
                      value={member.role}
                      disabled={member.role === 'owner' || updateMember.isPending}
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
                      {t('members.list.permission')}
                    </Label>
                    <Select
                      value={member.permission}
                      disabled={member.role === 'owner' || updateMember.isPending}
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

        <aside className="space-y-4 lg:col-span-5">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('members.quickInvite.eyebrow')}
                </p>
                <h3 className="section-title mt-1 text-xl font-semibold">
                  {t('members.quickInvite.title')}
                </h3>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserPlus className="size-5 text-[hsl(var(--accent))]" strokeWidth={1.8} />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {t('members.invite.helper')}
            </p>
            <Button className="mt-4 w-full" onClick={openInvite}>
              <Mail className="mr-2 size-4" />
              {t('members.invite.submit')}
            </Button>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-5 text-[hsl(var(--accent))]" strokeWidth={1.8} />
              <h3 className="text-lg font-semibold">{t('members.access.title')}</h3>
            </div>
            <div className="space-y-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              <p>
                <span className="font-medium text-[hsl(var(--foreground))]">
                  {t('options.role.owner')}
                </span>{' '}
                {t('members.access.owner')}
              </p>
              <p>
                <span className="font-medium text-[hsl(var(--foreground))]">
                  {t('options.role.partner')}
                </span>{' '}
                {t('members.access.partner')}
              </p>
              <p>
                <span className="font-medium text-[hsl(var(--foreground))]">
                  {t('options.role.viewer')}
                </span>{' '}
                {t('members.access.viewer')}
              </p>
            </div>

            <p className="mb-3 mt-6 text-sm font-medium text-[hsl(var(--muted-foreground))]">
              {t('members.permissionLevels.title')}
            </p>
            <div className="surface-muted rounded-3xl p-2">
              {(Object.keys(permissionLabels) as PermissionLevel[]).map((level) => (
                <div
                  key={level}
                  className="flex items-start justify-between gap-4 rounded-2xl px-3 py-3"
                >
                  <p className="shrink-0 text-sm font-semibold text-[hsl(var(--foreground))]">
                    {permissionLabels[level]}
                  </p>
                  <p className="text-right text-sm text-[hsl(var(--muted-foreground))]">
                    {t(`members.permissionLevels.${level}`)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-transparent bg-[hsl(var(--foreground))] text-white">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-white/60" strokeWidth={1.8} />
              <p className="text-sm text-white/60">{t('members.privacy.eyebrow')}</p>
            </div>
            <h3 className="section-title mt-2 text-2xl font-semibold">
              {t('members.privacy.title')}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {t('members.privacy.description')}
            </p>
          </Card>
        </aside>
      </div>

      <ResponsiveDialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t('members.invite.title')}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t('members.invite.eyebrow')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(handleInvite)} noValidate>
            <FormField label={t('members.invite.email')} error={errors.email?.message}>
              <Input
                type="email"
                placeholder={t('members.invite.emailPlaceholder')}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
            </FormField>

            <FormField label={t('members.invite.role')} error={errors.role?.message}>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.role}>
                      <SelectValue placeholder={t('members.invite.rolePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partner">{t('options.role.partner')}</SelectItem>
                      <SelectItem value="viewer">{t('options.role.viewer')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <div className="surface-muted rounded-3xl p-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {t('members.invite.helper')}
            </div>

            <ResponsiveDialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleFormOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={!isValid || createMember.isPending}>
                <Mail className="mr-2 size-4" />
                {createMember.isPending ? 'Dang gui...' : t('members.invite.submit')}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ConfirmDialog
        open={removeId !== null}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title={t('common.confirmDelete.title')}
        description={t('common.confirmDelete.description', {
          name: removingMember?.name ?? removingMember?.email ?? '',
        })}
        confirmLabel={t('common.remove')}
        confirmDisabled={deleteMember.isPending}
        confirmLoadingLabel="Dang xoa..."
        onConfirm={() => (removeId ? removeMember(removeId) : undefined)}
      />
    </div>
  )
}
