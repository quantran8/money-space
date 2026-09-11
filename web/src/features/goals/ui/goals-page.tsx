import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { AppearGroup, AppearItem } from '@/components/ui/motion'
import { useQuota } from '@money-space/core/features/billing/hooks/use-quota'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useGoalsPage } from '@money-space/core/features/goals/hooks/use-goals-page'
import { GoalFormDialog } from '@/features/goals/ui/components/goal-form-dialog'
import { GoalsListSection } from '@/features/goals/ui/components/goals-list-section'
import { GoalsSummaryStrip } from '@/features/goals/ui/components/goals-summary-strip'

export function GoalsPage() {
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
  // Display only — `useGoalsPage.openCreate` is what actually refuses.
  const goalQuota = useQuota('goals')

  return (
    <AppearGroup className="s-section-gap flex flex-col pb-3">
      <CompactPageHeader
        title={t('goals.header.title')}
        actions={
          <div className="flex items-center gap-3">
            {/* Only at the ceiling. Counting from 1/2 on an empty page would
                make a limit the first thing the household reads about goals. */}
            {goalQuota?.isExhausted ? (
              <span className="hidden t-caption text-ink3 sm:inline">
                {t('goals.quota.used', {
                  used: goalQuota.used,
                  limit: goalQuota.limit,
                })}
              </span>
            ) : null}
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t('goals.form.submit')}
            </Button>
          </div>
        }
      />

      <AppearItem>
        <GoalsSummaryStrip count={goals.length} stats={stats} goals={goals} />
      </AppearItem>

      <AppearItem>
        <GoalsListSection
          goals={goals}
          primaryGoalId={primaryGoal?.id}
          isLoading={isLoading}
          onCreate={openCreate}
          onOpen={(goalId) => navigate(`/goals/${goalId}`)}
          onEdit={openEdit}
          onDelete={setDeleteId}
        />
      </AppearItem>

      <GoalFormDialog
        key={formOpen ? 'goal-form-open' : 'goal-form-closed'}
        open={formOpen}
        onOpenChange={handleFormOpenChange}
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
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('common.confirmDelete.title')}
        description={t('common.confirmDelete.description', { name: deletingGoal?.name ?? '' })}
        confirmDisabled={isDeleting}
        confirmLoadingLabel={t('common.deleting')}
        onConfirm={() => (deleteId ? handleDeleteGoal(deleteId) : undefined)}
      />
    </AppearGroup>
  )
}
