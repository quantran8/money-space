import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useGoalsPage } from '@/features/goals/hooks/use-goals-page'
import { GoalFormDialog } from '@/features/goals/ui/components/goal-form-dialog'
import { GoalContributionDialog } from '@/features/goals/ui/components/goal-contribution-dialog'
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
    contributions,
    setContribution,
    contributionSources,
    setContributionSource,
    addContribution,
    isContributing,
    walletOptions,
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
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null)
  const contributionGoal = goals.find((goal) => goal.id === contributionGoalId)

  function handleContributionOpen(goalId: string) {
    setContribution(goalId, '')
    setContributionGoalId(goalId)
  }

  function handleContributionOpenChange(open: boolean) {
    if (!open) setContributionGoalId(null)
  }

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
        onContribute={handleContributionOpen}
        onCreate={openCreate}
        onOpen={(goalId) => navigate(`/goals/${goalId}`)}
        onEdit={openEdit}
        onDelete={setDeleteId}
      />

      <GoalContributionDialog
        open={contributionGoalId !== null}
        onOpenChange={handleContributionOpenChange}
        goal={contributionGoal}
        amount={contributionGoalId ? contributions[contributionGoalId] ?? '' : ''}
        onAmountChange={(value) => contributionGoalId && setContribution(contributionGoalId, value)}
        sourceId={contributionGoalId ? contributionSources[contributionGoalId] ?? '' : ''}
        onSourceChange={(value) => contributionGoalId && setContributionSource(contributionGoalId, value)}
        walletOptions={walletOptions}
        isSubmitting={isContributing}
        onSubmit={() => contributionGoalId ? addContribution(contributionGoalId) : Promise.resolve(false)}
      />

      <GoalFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
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
