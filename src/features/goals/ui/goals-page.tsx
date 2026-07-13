import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useGoalsPage } from '@/features/goals/hooks/use-goals-page'
import { AllocationCard } from '@/features/goals/ui/components/allocation-card'
import { GentleReminderCard } from '@/features/goals/ui/components/gentle-reminder-card'
import { GoalFormDialog } from '@/features/goals/ui/components/goal-form-dialog'
import { GoalsListSection } from '@/features/goals/ui/components/goals-list-section'
import { GoalsSummaryStrip } from '@/features/goals/ui/components/goals-summary-strip'
import { PrimaryGoalCard } from '@/features/goals/ui/components/primary-goal-card'
import { RecentUpdatesCard } from '@/features/goals/ui/components/recent-updates-card'
import { ThisMonthCard } from '@/features/goals/ui/components/this-month-card'

export function GoalsPage() {
  const { t } = useTranslation()
  const {
    goals,
    isLoading,
    stats,
    allocation,
    recent,
    primaryGoal,
    primaryRemaining,
    primaryPace,
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
    <div className="space-y-7">
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

      {!isLoading && goals.length > 0 ? (
        <GoalsSummaryStrip count={goals.length} stats={stats} />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          {primaryGoal ? (
            <PrimaryGoalCard
              goal={primaryGoal}
              remaining={primaryRemaining}
              pace={primaryPace}
            />
          ) : null}

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
            onEdit={openEdit}
            onDelete={setDeleteId}
          />
        </div>

        <aside className="space-y-4 xl:col-span-4">
          {primaryGoal ? (
            <ThisMonthCard
              goal={primaryGoal}
              pace={primaryPace}
              onSuggestContribution={setContribution}
            />
          ) : null}

          {allocation.length > 0 ? <AllocationCard allocation={allocation} /> : null}

          <RecentUpdatesCard recent={recent} />

          <GentleReminderCard />
        </aside>
      </div>

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
