import { Save } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { HouseholdOverviewCard } from '@/features/household/ui/components/household-overview-card'
import { useHouseholdInvite } from '@money-space/core/features/invites/hooks/use-household-invite'
import { useMembersPage } from '@money-space/core/features/members/hooks/use-members-page'
import { useSettingsPage } from '@money-space/core/features/settings/hooks/use-settings-page'
import { deleteHousehold } from '@money-space/core/features/settings/api/settings.repository'
import { useActiveHousehold } from '@money-space/core/shared/hooks/use-active-household'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { CategoriesCard } from '@/features/settings/ui/components/categories-card'
import { DataCard } from '@/features/settings/ui/components/data-card'
import { InviteQrDialog } from '@/features/invites/ui/components/invite-qr-dialog'
import { MembersListSection } from '@/features/members/ui/components/members-list-section'

/**
 * `/household` — "Gia đình" (Phase 10).
 *
 * A **composition slice**: it owns no data logic of its own. It mounts the
 * existing members components beside the reserve card, an assets summary and
 * freshness, so the household's shared setup lives in one place instead of
 * being split across `/members` and `/settings`. `/members` redirects here.
 */
export function HouseholdPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeHouseholdId } = useActiveHousehold()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const {
    members,
    isLoading,
    invitedCount,
    holdsByMember,
    ownerMemberId,
    viewerMemberId,
    isViewerOwner,
    setRemoveId,
    removeId,
    removingMember,
    isLeaving,
    isRemoving,
    removeMember,
  } = useMembersPage()

  /**
   * Adding a member is a QR code now, not an email form: the two people are
   * normally in the same room, and a mail round-trip was the slowest possible
   * way to close that gap.
   */
  const invite = useHouseholdInvite()

  // Sharing defaults + reminders moved here from /settings (Phase 10).
  const {
    isLoading: isSettingsLoading,
    form: settingsForm,
    isSaving: settingsSaving,
    submit: submitSettings,
  } = useSettingsPage()

  return (
    <div className="space-y-4">
      {/* Saving sits level with the title, not at the bottom of the settings
          card: the two selects below are the only thing it commits, and a
          button buried inside one card of five reads as that card's footer. */}
      <CompactPageHeader
        title={t('household.header.title')}
        actions={
          !isSettingsLoading ? (
            <Button
              type="button"
              className="h-10 px-4 text-[13px]"
              disabled={settingsSaving}
              onClick={() => void submitSettings()}
            >
              <Save className="size-4" strokeWidth={1.75} />
              {t('settings.header.save')}
            </Button>
          ) : null
        }
      />

      {!isSettingsLoading ? <HouseholdOverviewCard form={settingsForm} /> : null}

      <MembersListSection
        members={members}
        isLoading={isLoading}
        invitedCount={invitedCount}
        holdsByMember={holdsByMember}
        ownerMemberId={ownerMemberId}
        viewerMemberId={viewerMemberId}
        isViewerOwner={isViewerOwner}
        onInvite={invite.openQr}
        onRemoveMember={setRemoveId}
      />

      <CategoriesCard />

      <DataCard onDelete={() => setConfirmDeleteOpen(true)} />

      <InviteQrDialog
        open={invite.open}
        onOpenChange={invite.handleOpenChange}
        invite={invite.invite}
        joinUrl={invite.joinUrl}
        isPreparing={invite.isPreparing}
        error={invite.error}
        isRenewing={invite.isRenewing}
        onRenew={() => void invite.renew()}
        onCopyLink={() => void invite.copyLink()}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={t('settings.data.delete')}
        description={t('settings.data.deleteDescription')}
        confirmLabel={t('settings.data.deleteAction')}
        onConfirm={async () => {
          if (!activeHouseholdId) return
          try {
            await deleteHousehold(activeHouseholdId)
            navigate('/onboarding')
          } catch (error) {
            toast.error(getErrorMessage(error, t('settings.data.deleteAction')))
          }
        }}
      />

      {/* Leaving and removing run through the same endpoint, so they share this
          dialog — but not its words: one ends your own access, the other ends
          someone else's. After leaving there is no household left to render, so
          the page hands over to onboarding rather than bouncing off a 404. */}
      <ConfirmDialog
        open={removeId !== null}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title={isLeaving ? t('members.list.leaveConfirm.title') : t('common.confirmDelete.title')}
        description={
          isLeaving
            ? t('members.list.leaveConfirm.description')
            : t('common.confirmDelete.description', {
                name: removingMember?.name ?? removingMember?.email ?? '',
              })
        }
        confirmLabel={isLeaving ? t('members.list.leave') : t('common.remove')}
        confirmDisabled={isRemoving}
        onConfirm={async () => {
          if (!removeId) return
          const leaving = isLeaving
          await removeMember(removeId)
          if (leaving) navigate('/onboarding')
        }}
      />
    </div>
  )
}
