import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
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

  return (
    <div className="space-y-4 pb-3">
      <CompactPageHeader
        title={t('goals.header.title')}
        actions={
          <Button className="h-10 px-4 text-[13px]" onClick={openCreate}>
            <Plus className="size-4" />
            {t('goals.form.submit')}
          </Button>
        }
      />

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
    </div>
  )
}
