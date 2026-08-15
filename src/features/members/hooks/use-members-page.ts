import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useMembers } from '@/features/members/hooks/use-members'
import {
  buildInviteSchema,
  defaultInviteFormValues,
  makeInitials,
  type InviteForm,
} from '@/features/members/model/members-form'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { getErrorMessage } from '@/shared/lib/get-error-message'

export function useMembersPage() {
  const { t } = useTranslation()
  const { members, createMember, updateMember, deleteMember, isLoading } = useMembers()

  const [formOpen, setFormOpen] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  /**
   * How many money sources each person is responsible for.
   *
   * This replaces the role and access-level columns: the members list now
   * answers "who is responsible for what" instead of "who is allowed what".
   */
  const { assets } = useAssets()
  const holdsByMember = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const asset of assets) {
      if (!asset.holderMemberId) continue
      counts[asset.holderMemberId] = (counts[asset.holderMemberId] ?? 0) + 1
    }
    return counts
  }, [assets])

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
        status: 'invited',
      })
      toast.success('Da them thanh vien.')
      handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the them thanh vien.'))
    }
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
    holdsByMember,
    // list actions
    isUpdating: updateMember.isPending,
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
