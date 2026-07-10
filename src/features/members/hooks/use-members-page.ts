import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useMembers } from '@/features/members/hooks/use-members'
import {
  buildInviteSchema,
  defaultInviteFormValues,
  defaultPermissionForRole,
  makeInitials,
  type InviteForm,
} from '@/features/members/model/members-form'
import type {
  HouseholdRole,
  PermissionLevel,
} from '@/features/members/model/members'
import { getErrorMessage } from '@/shared/lib/get-error-message'

export function useMembersPage() {
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

  const inviteSchema = useMemo(() => buildInviteSchema(t, members), [members, t])

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: defaultInviteFormValues,
    mode: 'onChange',
  })

  const { reset, handleSubmit } = form

  const removingMember = removeId
    ? members.find((member) => member.id === removeId)
    : undefined

  function openInvite() {
    reset(defaultInviteFormValues)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) reset(defaultInviteFormValues)
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

  return {
    // data
    members,
    isLoading,
    activeCount,
    invitedCount,
    roleLabels,
    permissionLabels,
    // list actions
    isUpdating: updateMember.isPending,
    updateRole,
    updatePermission,
    setRemoveId,
    // form
    form,
    isSubmitting: createMember.isPending,
    submit: handleSubmit(handleInvite),
    // dialogs
    formOpen,
    openInvite,
    handleFormOpenChange,
    removeId,
    removingMember,
    isRemoving: deleteMember.isPending,
    removeMember,
  }
}
