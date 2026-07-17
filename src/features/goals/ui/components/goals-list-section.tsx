import { ArrowRight, ArrowUpDown, MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/number-input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { GoalItem, GoalPriority } from '@/features/goals/model/goals'
import {
  formatAmount,
  goalAmount,
  priorityRank,
  priorityTone,
  suggestedPace,
} from '@/features/goals/model/goals-form'

type WalletOption = { value: string; label: string }
type SortMode = 'priority' | 'progress'

type GoalsListSectionProps = {
  goals: GoalItem[]
  isLoading?: boolean
  priorityLabels: Record<GoalPriority, string>
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
  isLoading = false,
  priorityLabels,
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
  const [sortMode, setSortMode] = useState<SortMode>('priority')
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'

  const visibleGoals = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale)
    return goals
      .filter((goal) => {
        if (!needle) return true
        return `${goal.name} ${goal.note}`.toLocaleLowerCase(locale).includes(needle)
      })
      .sort((a, b) =>
        sortMode === 'priority'
          ? priorityRank[a.priority] - priorityRank[b.priority] || b.progress - a.progress
          : b.progress - a.progress,
      )
  }, [goals, locale, query, sortMode])

  return (
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="section-title text-xl font-semibold">{t('goals.list.title')}</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('goals.list.searchPlaceholder')}
              className="pl-11"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => setSortMode((current) => (current === 'priority' ? 'progress' : 'priority'))}
          >
            <ArrowUpDown className="mr-2 size-4" />
            {t(`goals.list.sort.${sortMode}`)}
          </Button>
        </div>
      </div>

      <div className="mt-6 divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <GoalRowSkeleton key={index} />)
        ) : goals.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">{t('goals.list.empty')}</p>
            <Button className="mt-4" onClick={onCreate}>
              <Plus className="mr-2 size-4" />
              {t('goals.form.submit')}
            </Button>
          </div>
        ) : visibleGoals.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t('goals.list.emptySearch')}
          </p>
        ) : (
          visibleGoals.map((goal) => {
            const current = goalAmount(goal.currentAmount)
            const target = goalAmount(goal.targetAmount)
            const deadline = goal.deadline && goal.deadline !== 'No deadline'
              ? new Date(goal.deadline).toLocaleDateString(locale, {
                  month: '2-digit',
                  year: 'numeric',
                })
              : t('goals.list.noDeadline')

            return (
              <article key={goal.id} className="py-6 first:pt-0 last:pb-0">
                <div className="grid gap-4 md:grid-cols-[1.15fr_1fr_.7fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{goal.name}</h3>
                      {goal.priority === 'high' ? (
                        <Badge className={priorityTone[goal.priority]}>
                          {priorityLabels[goal.priority]}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 truncate text-xs text-muted-foreground">
                      {t('goals.list.deadline', { value: deadline })}
                      {goal.note ? ` · ${goal.note}` : ''}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>
                        {formatAmount(current)} / {formatAmount(target)}
                      </span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="mt-2 h-2" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">{t('goals.list.monthlyPace')}</p>
                    <p className="money-number mt-1 text-sm font-semibold">
                      {formatAmount(suggestedPace(goal))}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-1 md:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 text-sm"
                      onClick={() => onOpen(goal.id)}
                    >
                      <span className="hidden xl:inline">{t('goals.list.viewDetail')}</span>
                      <ArrowRight className="size-4 xl:ml-2" />
                    </Button>
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

                <details className="mt-3 rounded-2xl bg-muted/55 px-4 py-3 md:ml-[28%]">
                  <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground">
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
                        <SelectValue
                          placeholder={
                            walletOptions.length === 0
                              ? t('goals.actions.sourceEmpty')
                              : t('goals.actions.sourcePlaceholder')
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {walletOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isContributing || !contributionSources[goal.id]}
                    >
                      <Plus className="mr-1 size-4" />
                      {isContributing ? t('goals.actions.contributing') : t('goals.actions.contribute')}
                    </Button>
                  </form>
                </details>
              </article>
            )
          })
        )}
      </div>
    </Card>
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
        <DropdownMenuItem
          className="text-[hsl(var(--status-red))] focus:text-[hsl(var(--status-red))]"
          onSelect={() => onDelete(goalId)}
        >
          <Trash2 className="size-4" />
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function GoalRowSkeleton() {
  return (
    <div className="grid gap-4 py-6 first:pt-0 md:grid-cols-[1.15fr_1fr_.7fr_auto] md:items-center">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-3 w-44 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-xl" />
    </div>
  )
}
