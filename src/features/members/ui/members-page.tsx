import { UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useMembersPage } from '@/features/members/hooks/use-members-page'
import { InviteFormDialog } from '@/features/members/ui/components/invite-form-dialog'
import { MembersListSection } from '@/features/members/ui/components/members-list-section'
import { MembersSidebar } from '@/features/members/ui/components/members-sidebar'
import { MembersSummaryStrip } from '@/features/members/ui/components/members-summary-strip'

export function MembersPage() {
  const { t } = useTranslation()
  const {
    members,
    isLoading,
    activeCount,
    invitedCount,
    roleLabels,
    permissionLabels,
    isUpdating,
    updateRole,
    updatePermission,
    setRemoveId,
    form,
    isSubmitting,
    submit,
    formOpen,
    openInvite,
    handleFormOpenChange,
    removeId,
    removingMember,
    isRemoving,
    removeMember,
  } = useMembersPage()

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

      <MembersSummaryStrip
        members={members}
        activeCount={activeCount}
        invitedCount={invitedCount}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <MembersListSection
          members={members}
          isLoading={isLoading}
          activeCount={activeCount}
          invitedCount={invitedCount}
          roleLabels={roleLabels}
          permissionLabels={permissionLabels}
          isUpdating={isUpdating}
          onUpdateRole={updateRole}
          onUpdatePermission={updatePermission}
          onRemove={setRemoveId}
        />

        <MembersSidebar permissionLabels={permissionLabels} onInvite={openInvite} />
      </div>

      <InviteFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        isSubmitting={isSubmitting}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={removeId !== null}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title={t('common.confirmDelete.title')}
        description={t('common.confirmDelete.description', {
          name: removingMember?.name ?? removingMember?.email ?? '',
        })}
        confirmLabel={t('common.remove')}
        confirmDisabled={isRemoving}
        confirmLoadingLabel="Dang xoa..."
        onConfirm={() => (removeId ? removeMember(removeId) : undefined)}
      />
    </div>
  )
}
