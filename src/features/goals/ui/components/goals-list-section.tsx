import { MoreVertical, Pencil, PiggyBank, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoneyInput } from '@/components/ui/number-input'
import { Progress } from '@/components/ui/progress'
import type { GoalItem, GoalPriority } from '@/features/goals/model/goals'
import { formatAmount, goalAmount, priorityTone } from '@/features/goals/model/goals-form'

type GoalsListSectionProps = {
  goals: GoalItem[]
  priorityLabels: Record<GoalPriority, string>
  contributions: Record<string, string>
  onContributionChange: (goalId: string, value: string) => void
  onAddContribution: (goalId: string) => void
  isContributing: boolean
  onCreate: () => void
  onEdit: (goalId: string) => void
  onDelete: (goalId: string) => void
}

export function GoalsListSection({
  goals,
  priorityLabels,
  contributions,
  onContributionChange,
  onAddContribution,
  isContributing,
  onCreate,
  onEdit,
  onDelete,
}: GoalsListSectionProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('goals.list.eyebrow')}
          </p>
          <h2 className="section-title mt-1 text-2xl font-semibold">
            {t('goals.list.title')}
          </h2>
        </div>
        <PiggyBank className="size-5 text-[hsl(var(--accent))]" strokeWidth={1.8} />
      </div>

      <div className="space-y-5">
        {goals.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-8 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('goals.list.empty')}
            </p>
            <Button className="mt-4" onClick={onCreate}>
              <Plus className="mr-2 size-4" />
              {t('goals.form.submit')}
            </Button>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="surface-muted rounded-3xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{goal.name}</p>
                    <Badge className={priorityTone[goal.priority]}>
                      {priorityLabels[goal.priority]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {goal.note}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                    {formatAmount(goalAmount(goal.currentAmount))} /{' '}
                    {formatAmount(goalAmount(goal.targetAmount))}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label={t('common.actions')}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEdit(goal.id)}>
                        <Pencil className="size-4" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
                        onSelect={() => onDelete(goal.id)}
                      >
                        <Trash2 className="size-4" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Progress value={goal.progress} className="flex-1" />
                <span className="money-number text-sm font-semibold">{goal.progress}%</span>
              </div>
              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  onAddContribution(goal.id)
                }}
              >
                <MoneyInput
                  value={contributions[goal.id] ?? ''}
                  onChange={(raw) => onContributionChange(goal.id, raw)}
                  placeholder={t('goals.actions.contributePlaceholder')}
                  className="h-9 flex-1"
                  aria-label={t('goals.actions.contribute')}
                />
                <Button type="submit" variant="secondary" size="sm" className="shrink-0" disabled={isContributing}>
                  <Plus className="mr-1 size-4" />
                  {isContributing ? 'Dang cap nhat...' : t('goals.actions.contribute')}
                </Button>
              </form>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
