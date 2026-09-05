import { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react-native'

import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { useHouseholdInvite } from '@money-space/core/features/invites/hooks/use-household-invite'
import { useMembers } from '@money-space/core/features/members/hooks/use-members'
import { useMembersPage } from '@money-space/core/features/members/hooks/use-members-page'
import { deleteHousehold } from '@money-space/core/features/settings/api/settings.repository'
import { useSettingsPage } from '@money-space/core/features/settings/hooks/use-settings-page'
import { useActiveHousehold } from '@money-space/core/shared/hooks/use-active-household'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { useNavigate } from '@money-space/core/shared/navigation'
import { notify } from '@money-space/core/shared/notify'

import { ConfirmDialog, Panel, Screen, Sections, Skeleton } from '@/components/ui'
import { HouseholdIdentitySection } from '@/features/household/ui/household-identity-section'
import { InviteQrSheet } from '@/features/invites/ui/invite-qr-sheet'
import { MembersSection } from '@/features/members/ui/members-section'
import { HouseholdDataSection } from '@/features/settings/ui/household-data-section'
import { SignOutSection } from '@/features/settings/ui/sign-out-section'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

/**
 * Gia đình — the household hub.
 *
 * A **composition slice**, exactly as on the web: it owns no data logic of its
 * own. Everything here comes from core (`useMembersPage`, `useHouseholdInvite`,
 * `useSettingsPage`) and this file decides only what sits above what.
 *
 * The reading order answers the questions in the order they are asked:
 *
 *  1. **whose space is this** — the name, and the two settings that change how
 *     every number in the app reads;
 *  2. **who is in it** — the members, and the one way to add someone;
 *  3. **where else can I look** — the journal and the events list, which are
 *     full screens rather than tabs because the bar is capped at five (§13);
 *  4. **ending it** — last, because a shared finance app should not greet you
 *     with a delete button.
 *
 * There is no categories card. The web's is a 350-line inline-edit console for
 * event categories, which is a management surface, not a household question —
 * porting it here would put the hub's longest, densest panel between "who is
 * in this household" and "what changed". It belongs behind the events
 * destination when that screen grows one.
 */
export default function HouseholdScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeHouseholdId } = useActiveHousehold()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
   * Adding a member is a QR code, not an email form: the two people are
   * normally in the same room, and a mail round-trip was the slowest possible
   * way to close that gap. On a phone the code is a `moneyspace://` deep link,
   * so a scan opens this app at `/join` directly.
   */
  const invite = useHouseholdInvite()

  const {
    isLoading: isSettingsLoading,
    form: settingsForm,
    isSaving: settingsSaving,
    submit: submitSettings,
  } = useSettingsPage()

  // Only for the delete consequence. Already in cache — `useMembersPage` reads
  // the same query to work out who is responsible for what.
  const { assets } = useAssets()

  /**
   * Pull-to-refresh. The members query is the one thing on this screen that
   * another device can change out from under the reader — the partner accepts
   * an invite on their phone and this list is stale with no way to know it,
   * because the backend has no push channel. Same query key as the one
   * `useMembersPage` reads, so this is the same cache entry, not a second
   * request.
   */
  const { refetch: refetchMembers, isRefetching } = useMembers()

  /**
   * Deleting is creator-only on the server (it is one of the three lifecycle
   * operations the household guard resolves against `createdBy`), so a
   * non-creator is not shown a button that could only ever fail.
   */
  const canDeleteHousehold = isViewerOwner

  return (
    <Screen
      withAccountHeader
      title={t('nav.household')}
      onRefresh={() => void refetchMembers()}
      refreshing={isRefetching}
    >
      <Sections>
        {isSettingsLoading ? (
          <Panel>
            <Skeleton height={28} className="w-40" />
            <Skeleton height={46} className="mt-6 rounded-control" />
            <Skeleton height={46} className="mt-3 rounded-control" />
          </Panel>
        ) : (
          <HouseholdIdentitySection
            form={settingsForm}
            isSaving={settingsSaving}
            onSave={() => void submitSettings()}
          />
        )}

        <MembersSection
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

        {/* The one destination that is not a tab. Sự kiện used to be listed
            here too; it is a tab of its own now, so a second door to it would
            just be a longer route to the same screen. */}
        <Panel>
          <HubLink label={t('activity.header.title')} onPress={() => navigate('/activity')} />

          {/* ── SEAM: what-if ───────────────────────────────────────────────
              The what-if sheet is owned by another port and opens from Home
              and from the goal/upcoming detail screens (§9 of the recipes),
              which is where a household is actually weighing a decision. It is
              deliberately NOT given a door here: the hub answers "who is in
              this space and how is it set up", and a consequence preview is
              not that question. If that port decides the hub needs an entry
              point, it goes in this panel. */}
        </Panel>

        {/* Sign-out lives on this screen, not in a nav drawer: the drawer is
            gone (the tab bar is the navigation), and "who is in this space and
            how is it set up" is the question this hub answers — leaving it is
            part of that. Above the danger card so the destructive action stays
            last (§22.11). */}
        <SignOutSection />

        {canDeleteHousehold ? (
          <HouseholdDataSection
            consequence={t('settings.data.deleteConsequence', {
              members: members.length,
              sources: assets.length,
            })}
            onDelete={() => setConfirmDeleteOpen(true)}
          />
        ) : null}
      </Sections>

      <InviteQrSheet
        open={invite.open}
        onClose={() => invite.handleOpenChange(false)}
        invite={invite.invite}
        joinUrl={invite.joinUrl}
        isPreparing={invite.isPreparing}
        error={invite.error}
        isRenewing={invite.isRenewing}
        onRenew={() => void invite.renew()}
        onCopyLink={() => void invite.copyLink()}
      />

      {/* §22.11 — the honest verb, and the consequence in real numbers rather
          than "bạn có chắc không". */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={t('settings.data.delete')}
        consequence={t('settings.data.deleteConsequence', {
          members: members.length,
          sources: assets.length,
        })}
        confirmLabel={t('settings.data.deleteAction')}
        cancelLabel={t('common.cancel')}
        loading={isDeleting}
        onConfirm={() => {
          if (!activeHouseholdId) return
          setIsDeleting(true)
          void deleteHousehold(activeHouseholdId)
            .then(() => {
              setConfirmDeleteOpen(false)
              // There is no household left to render, so this hands over to
              // onboarding rather than bouncing off a 404 in the gate.
              navigate('/onboarding', { replace: true })
            })
            .catch((error: unknown) => {
              notify.error(getErrorMessage(error, t('settings.data.deleteAction')))
            })
            .finally(() => setIsDeleting(false))
        }}
      />

      {/* Leaving and removing run through the same endpoint, so they share this
          sheet — but not its words: one ends your own access, the other ends
          someone else's. */}
      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        title={isLeaving ? t('members.list.leaveConfirm.title') : t('common.confirmDelete.title')}
        consequence={
          isLeaving
            ? t('members.list.leaveConfirm.description')
            : t('common.confirmDelete.description', {
                name: removingMember?.name ?? removingMember?.email ?? '',
              })
        }
        confirmLabel={isLeaving ? t('members.list.leave') : t('common.remove')}
        cancelLabel={t('common.cancel')}
        loading={isRemoving}
        onConfirm={() => {
          if (!removeId) return
          const leaving = isLeaving
          void removeMember(removeId)
            .then(() => {
              setRemoveId(null)
              if (leaving) navigate('/onboarding', { replace: true })
            })
            // The hook already said what went wrong; the sheet stays open.
            .catch(() => {})
        }}
      />
    </Screen>
  )
}

/**
 * A door to another screen. One line, a chevron, and a full 44pt target — the
 * whole row, not just the words, because a text link on a phone is a target
 * that only looks big enough.
 */
function HubLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: TOUCH_TARGET }}
      className="-mx-2 flex-row items-center justify-between gap-3 rounded-control px-2 active:bg-wash"
    >
      <Text className="flex-1 t-body-sm text-ink">{label}</Text>
      <ChevronRight size={18} color={colors.ink3} strokeWidth={1.75} />
    </Pressable>
  )
}
