import { MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoneyInput } from '@/components/ui/number-input'
import { Panel } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { hasProjectedDate } from '@/features/goals/model/goal-projection.types'
import type { GoalItem } from '@/features/goals/model/goals'
import { formatAmount, goalAmount, priorityRank } from '@/features/goals/model/goals-form'
import { formatMonthYear } from '@/shared/lib/format-money'

type WalletOption = { value: string; label: string }

type GoalsListSectionProps = {
  goals: GoalItem[]
  primaryGoalId?: string
  isLoading?: boolean
  contributions: Record<string, string>
  onContributionChange: (goalId: string, value: string) => void
  contributionSources: Record<string, string>
  onContributionSourceChange: (goalId: string, assetId: string) => void
  walletOptions: WalletOption[]
  onAddContribution: (goalId: string) => void
  isContributing: boolean
  onCreate: () => void
  onOpen: (goalId: string) => void
  onEdit: (goalId: string) => void
  onDelete: (goalId: string) => void
}

export function GoalsListSection({
  goals,
  primaryGoalId,
  isLoading = false,
  contributions,
  onContributionChange,
  contributionSources,
  onContributionSourceChange,
  walletOptions,
  onAddContribution,
  isContributing,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
}: GoalsListSectionProps) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const visibleGoals = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale)
    return [...goals]
      .filter((goal) => !needle || `${goal.name} ${goal.note}`.toLocaleLowerCase(locale).includes(needle))
      .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.progress - a.progress)
  }, [goals, locale, query])

  return (
    <Panel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="section-title text-[16px]">{t('goals.demo.listTitle')}</h2>
        <label className="sunk flex h-10 items-center gap-2 px-3 sm:w-[250px]">
          <Search className="size-4 text-ink3" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('goals.list.searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink3"
          />
        </label>
      </div>

      <div className="mt-7 space-y-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => <GoalRowSkeleton key={index} />)
          : null}
        {!isLoading && goals.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-ink2">{t('goals.list.empty')}</p>
            <Button size="sm" className="mt-4" onClick={onCreate}>
              <Plus className="size-4" />
              {t('goals.form.submit')}
            </Button>
          </div>
        ) : null}
        {!isLoading && goals.length > 0 && visibleGoals.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-ink2">{t('goals.list.emptySearch')}</p>
        ) : null}

        {!isLoading
          ? visibleGoals.map((goal) => {
              const current = goalAmount(goal.currentAmount)
              const target = goalAmount(goal.targetAmount)
              const deadline = goal.targetDate && goal.targetDate !== 'No deadline'
                ? formatMonthYear(goal.targetDate, locale)
                : t('goals.list.noDeadline')
              const projection = goal.projection
              const projectedDate = projection && hasProjectedDate(projection)
                ? formatMonthYear(projection.projectedCompletionDate!, locale)
                : t('goals.demo.unknownProjection')
              const requiredMonthly = projection?.requiredMonthlyContributionForTargetDate

              return (
                <article key={goal.id} className="rounded-sunk px-3 py-4 transition-colors hover:bg-sunk sm:px-4">
                  <div className="grid gap-5 lg:grid-cols-[minmax(180px,1fr)_1.4fr_1fr_100px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[14px] font-medium">{goal.name}</h3>
                        {goal.id === primaryGoalId ? (
                          <span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-medium text-accent">
                            {t('home.mainGoal.badge')}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[11px] text-ink3">
                        {goal.targetDate && goal.targetDate !== 'No deadline'
                          ? t('goals.demo.targetDate', { date: deadline })
                          : t('goals.demo.noTargetDate')}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="num text-[12px] text-ink2">
                          {formatAmount(current)} / {formatAmount(target)}
                        </span>
                        <span className="font-mono text-[11px] text-ink3">{goal.progress}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunk">
                        <div className="h-full min-w-px bg-accent" style={{ width: `${goal.progress}%` }} />
                      </div>
                    </div>

                    <div>
                      <p className="label">{t('goals.projection.atCurrentPace')}</p>
                      <p className="mt-1.5 text-[13px] font-medium">{projectedDate}</p>
                      <p className="mt-1 text-[11px] text-ink2">
                        {requiredMonthly
                          ? t('goals.demo.needMonthly', { amount: formatAmount(requiredMonthly) })
                          : goal.targetDate && goal.targetDate !== 'No deadline'
                            ? t('goals.projection.noPace')
                            : t('goals.demo.setTargetDate')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-1 lg:justify-end">
                      <button type="button" onClick={() => onOpen(goal.id)} className="text-[12px] font-medium text-accent">
                        {t('assets.demo.detail')}
                      </button>
                      <GoalMenu
                        goalId={goal.id}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        actionsLabel={t('common.actions')}
                        editLabel={t('common.edit')}
                        deleteLabel={t('common.delete')}
                      />
                    </div>
                  </div>

                  <details className="mt-3 rounded-sunk bg-sunk px-4 py-3 lg:ml-[28%]">
                    <summary className="cursor-pointer list-none text-[12px] font-medium text-ink2">
                      {t('goals.actions.contributeHelp')}
                    </summary>
                    <form
                      className="mt-3 flex flex-wrap items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        onAddContribution(goal.id)
                      }}
                    >
                      <MoneyInput
                        value={contributions[goal.id] ?? ''}
                        onChange={(raw) => onContributionChange(goal.id, raw)}
                        placeholder={t('goals.actions.contributePlaceholder')}
                        className="h-9 min-w-[10rem] flex-1"
                        aria-label={t('goals.actions.contribute')}
                      />
                      <Select
                        value={contributionSources[goal.id] ?? ''}
                        onValueChange={(value) => onContributionSourceChange(goal.id, value)}
                        disabled={walletOptions.length === 0}
                      >
                        <SelectTrigger className="h-9 w-40" aria-label={t('goals.actions.source')}>
                          <SelectValue placeholder={walletOptions.length === 0 ? t('goals.actions.sourceEmpty') : t('goals.actions.sourcePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {walletOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="submit" size="sm" disabled={isContributing || !contributionSources[goal.id]}>
                        <Plus className="size-4" />
                        {isContributing ? t('goals.actions.contributing') : t('goals.actions.contribute')}
                      </Button>
                    </form>
                  </details>
                </article>
              )
            })
          : null}
      </div>
    </Panel>
  )
}

function GoalMenu({
  goalId,
  onEdit,
  onDelete,
  actionsLabel,
  editLabel,
  deleteLabel,
}: {
  goalId: string
  onEdit: (goalId: string) => void
  onDelete: (goalId: string) => void
  actionsLabel: string
  editLabel: string
  deleteLabel: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={actionsLabel}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(goalId)}>
          <Pencil className="size-4" />
          {editLabel}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-alert focus:text-alert" onSelect={() => onDelete(goalId)}>
          <Trash2 className="size-4" />
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function GoalRowSkeleton() {
  return <Skeleton className="h-[92px] w-full rounded-sunk" />
}
