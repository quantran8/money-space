import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useGoalsPage } from '@/features/goals/hooks/use-goals-page'
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
    priorityLabels,
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

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t('goals.header.eyebrow')}
        title={t('goals.header.title')}
        description={t('goals.header.description')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            {t('goals.form.submit')}
          </Button>
        }
      />

      <GoalsSummaryStrip count={goals.length} stats={stats} goals={goals} />

      <GoalsListSection
        goals={goals}
        isLoading={isLoading}
        priorityLabels={priorityLabels}
        contributions={contributions}
        onContributionChange={setContribution}
        contributionSources={contributionSources}
        onContributionSourceChange={setContributionSource}
        walletOptions={walletOptions}
        onAddContribution={addContribution}
        isContributing={isContributing}
        onCreate={openCreate}
        onOpen={(goalId) => navigate(`/goals/${goalId}`)}
        onEdit={openEdit}
        onDelete={setDeleteId}
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
        confirmLoadingLabel="Dang xoa..."
        onConfirm={() => (deleteId ? handleDeleteGoal(deleteId) : undefined)}
      />
    </div>
  )
}
