import { useTranslation } from 'react-i18next'

import { useGoalsPage } from '@money-space/core/features/goals/hooks/use-goals-page'
import { useNavigate } from '@money-space/core/shared/navigation'

import { Button, ConfirmDialog, Screen, Sections } from '@/components/ui'
import { GoalFormSheet } from '@/features/goals/ui/goal-form-sheet'
import { GoalsListSection } from '@/features/goals/ui/goals-list-section'
import { GoalsSummaryStrip } from '@/features/goals/ui/goals-summary-strip'

/**
 * Mục tiêu — every goal the household is working towards.
 *
 * All of it comes from core's `useGoalsPage`: the list, the totals, the form
 * and its schema, and every mutation. This file is composition only.
 *
 * The summary sits above the list because it answers the question the tab was
 * opened with ("how are we doing overall"), and the list answers the follow-up.
 */
export default function GoalsScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    goals,
    isLoading,
    stats,
    primaryGoal,
    assetOptions,
    contestedWalletIds,
    walletGoalNames,
    form,
    isEditing,
    isSavingGoal,
    submit,
    formOpen,
    openCreate,
    openEdit,
    handleFormOpenChange,
    deleteId,
    setDeleteId,
    deletingGoal,
    isDeleting,
    handleDeleteGoal,
  } = useGoalsPage()

  return (
    <Screen
      title={t('goals.header.title')}
      right={
        <Button className="px-4" onPress={openCreate}>
          {t('common.add')}
        </Button>
      }
    >
      <Sections>
        <GoalsSummaryStrip count={goals.length} stats={stats} goals={goals} />

        <GoalsListSection
          goals={goals}
          primaryGoalId={primaryGoal?.id}
          isLoading={isLoading}
          onCreate={openCreate}
          onOpen={(goalId) => navigate(`/goals/${goalId}`)}
          onEdit={openEdit}
          onDelete={setDeleteId}
        />
      </Sections>

      <GoalFormSheet
        open={formOpen}
        onClose={() => handleFormOpenChange(false)}
        form={form}
        assetOptions={assetOptions}
        contestedWalletIds={contestedWalletIds}
        walletGoalNames={walletGoalNames}
        isEditing={isEditing}
        isSubmitting={isSavingGoal}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title={t('common.confirmDelete.title')}
        consequence={t('common.confirmDelete.description', { name: deletingGoal?.name ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        loading={isDeleting}
        onConfirm={() => {
          if (!deleteId) return
          // The hook re-throws so the dialog can stay open on failure; the
          // toast has already said what went wrong.
          void handleDeleteGoal(deleteId)
            .then(() => setDeleteId(null))
            .catch(() => {})
        }}
      />
    </Screen>
  )
}
