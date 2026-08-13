import { Save, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FreshnessSection } from '@/features/freshness/ui/components/freshness-section'
import { HouseholdAssetsCard } from '@/features/household/ui/components/household-assets-card'
import { HouseholdReserveCard } from '@/features/household/ui/components/household-reserve-card'
import { useMembersPage } from '@/features/members/hooks/use-members-page'
import { useSettingsPage } from '@/features/settings/hooks/use-settings-page'
import { RemindersCard } from '@/features/settings/ui/components/reminders-card'
import { SharingCard } from '@/features/settings/ui/components/sharing-card'
import { InviteFormDialog } from '@/features/members/ui/components/invite-form-dialog'
import { MembersListSection } from '@/features/members/ui/components/members-list-section'

/**
 * `/household` — "Nhà mình" (Phase 10).
 *
 * A **composition slice**: it owns no data logic of its own. It mounts the
 * existing members components beside the reserve card, an assets summary and
 * freshness, so the household's shared setup lives in one place instead of
 * being split across `/members` and `/settings`. `/members` redirects here.
 */
export function HouseholdPage() {
  const { t } = useTranslation()
  const {
    members,
    isLoading,
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

  // Sharing defaults + reminders moved here from /settings (Phase 10).
  const {
    form: settingsForm,
    isValid: settingsValid,
    isSaving: settingsSaving,
    submit: submitSettings,
  } = useSettingsPage()

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t('household.header.eyebrow')}
        title={t('household.header.title')}
        description={t('household.header.description')}
        actions={
          <Button onClick={openInvite}>
            <UserPlus className="mr-2 size-4" />
            {t('members.invite.submit')}
          </Button>
        }
      />

      <MembersListSection
        members={members}
        isLoading={isLoading}
        invitedCount={invitedCount}
        roleLabels={roleLabels}
        permissionLabels={permissionLabels}
        isUpdating={isUpdating}
        onUpdateRole={updateRole}
        onUpdatePermission={updatePermission}
        onRemove={setRemoveId}
      />

      {/*
        These two are controlled inputs with no submit of their own — on
        /settings they lived inside that page's form. They need their own
        form + save here, otherwise edits would silently go nowhere.
      */}
      <form id="household-settings-form" onSubmit={submitSettings} noValidate className="space-y-4">
        <SharingCard form={settingsForm} />

        <RemindersCard form={settingsForm} />

        <div className="flex justify-end">
          <Button
            type="submit"
            form="household-settings-form"
            disabled={!settingsValid || settingsSaving}
          >
            <Save className="mr-2 size-4" />
            {t('settings.header.save')}
          </Button>
        </div>
      </form>

      <HouseholdReserveCard />

      <HouseholdAssetsCard />

      <FreshnessSection />

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
        onConfirm={() => (removeId ? removeMember(removeId) : undefined)}
      />
    </div>
  )
}
