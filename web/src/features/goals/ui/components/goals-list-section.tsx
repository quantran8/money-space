import { Eye, MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Panel } from '@/components/ui/panel'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { hasProjectedDate } from '@money-space/core/features/goals/model/goal-projection.types'
import type { GoalItem } from '@money-space/core/features/goals/model/goals'
import { formatAmount, goalAmount, priorityRank } from '@money-space/core/features/goals/model/goals-form'
import { formatMonthYear } from '@money-space/core/shared/lib/format-money'

type GoalsListSectionProps = {
  goals: GoalItem[]
  primaryGoalId?: string
  isLoading?: boolean
  onCreate: () => void
  onOpen: (goalId: string) => void
  onEdit: (goalId: string) => void
  onDelete: (goalId: string) => void
}

export function GoalsListSection({
  goals,
  primaryGoalId,
  isLoading = false,
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
  const goalViews = visibleGoals.map((goal) => {
    const projection = goal.projection
    return {
      goal,
      current: goalAmount(goal.currentAmount),
      target: goalAmount(goal.targetAmount),
      desiredDate:
        goal.targetDate && goal.targetDate !== 'No deadline'
          ? formatMonthYear(goal.targetDate, locale)
          : t('goals.table.notSet'),
      projectedDate:
        projection && hasProjectedDate(projection)
          ? formatMonthYear(projection.projectedCompletionDate!, locale)
          : t('goals.demo.unknownProjection'),
      monthly:
        goal.plannedMonthlyContribution != null && goal.plannedMonthlyContribution > 0
          ? formatAmount(goal.plannedMonthlyContribution)
          : t('goals.projection.noPace'),
      paceGapMonths: projection?.paceGapMonths ?? null,
    }
  })

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

      <div className="mt-6">
        {isLoading
          ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, index) => <GoalRowSkeleton key={index} />)}</div>
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
          <p className="rounded-sunk bg-sunk px-4 py-10 text-center text-[13px] text-ink2">{t('goals.list.emptySearch')}</p>
        ) : null}

        {!isLoading && goalViews.length > 0 ? (
          <>
            <div className="hidden lg:block">
              <Table className="table-fixed text-left text-[14px]" aria-label={t('goals.table.ariaLabel')}>
                <TableHeader>
                  {/* `.label-vi`: accented headings, which mono renders poorly (§10.1). */}
                  <TableRow className="label-vi hover:bg-transparent">
                    <TableHead className="label-vi h-auto w-[23%] px-0 pb-3 pl-3 font-normal">{t('goals.table.goal')}</TableHead>
                    <TableHead className="label-vi h-auto w-[30%] px-0 pb-3 font-normal">{t('goals.table.progress')}</TableHead>
                    <TableHead className="label-vi h-auto w-[28%] px-0 pb-3 font-normal">{t('goals.table.plan')}</TableHead>
                    <TableHead className="h-auto w-[19%] px-0 pb-3 pr-2"><span className="sr-only">{t('common.actions')}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goalViews.map(({ goal, current, target, desiredDate, projectedDate, monthly, paceGapMonths }) => (
                    // Cells carry the hover band rather than the row, so the
                    // rounded ends land on the first and last cell (§11.3).
                    <TableRow key={goal.id} className="group cursor-pointer hover:bg-transparent" onClick={() => onOpen(goal.id)}>
                      <TableCell className="rounded-l-control px-0 py-4 pl-3 pr-5 align-top transition-colors group-hover:bg-sunk">
                        <GoalName goal={goal} isPrimary={goal.id === primaryGoalId} onOpen={onOpen} />
                      </TableCell>
                      <TableCell className="px-0 py-4 pr-8 align-top transition-colors group-hover:bg-sunk">
                        <GoalProgress goal={goal} current={current} target={target} />
                      </TableCell>
                      <TableCell className="px-0 py-4 pr-7 align-top transition-colors group-hover:bg-sunk">
                        <GoalPlan desiredDate={desiredDate} projectedDate={projectedDate} monthly={monthly} paceGapMonths={paceGapMonths} />
                      </TableCell>
                      <TableCell
                        className="rounded-r-control px-0 py-3 pr-2 text-right align-top transition-colors group-hover:bg-sunk"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <GoalActions goal={goal} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="space-y-2 lg:hidden" aria-label={t('goals.table.ariaLabel')}>
              {goalViews.map(({ goal, current, target, desiredDate, projectedDate, monthly, paceGapMonths }) => (
                <li
                  key={goal.id}
                  className="cursor-pointer rounded-sunk px-3 py-4 transition-colors hover:bg-sunk"
                  onClick={() => onOpen(goal.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <GoalName goal={goal} isPrimary={goal.id === primaryGoalId} onOpen={onOpen} />
                      <div className="mt-3"><GoalProgress goal={goal} current={current} target={target} /></div>
                      <div className="mt-4"><GoalPlan desiredDate={desiredDate} projectedDate={projectedDate} monthly={monthly} paceGapMonths={paceGapMonths} /></div>
                    </div>
                    <div onClick={(event) => event.stopPropagation()}>
                      <GoalMenu goalId={goal.id} goalName={goal.name} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3 px-3"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpen(goal.id)
                    }}
                  >
                    {t('goals.actions.manageAssets')}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </Panel>
  )
}

function GoalName({ goal, isPrimary, onOpen }: { goal: GoalItem; isPrimary: boolean; onOpen: (goalId: string) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onOpen(goal.id)
        }}
        className="truncate text-left text-[14px] font-medium hover:text-accent"
      >
        {goal.name}
      </button>
      {isPrimary ? <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">{t('home.mainGoal.badge')}</span> : null}
    </div>
  )
}

function GoalProgress({ goal, current, target }: { goal: GoalItem; current: number; target: number }) {
  const progress = Math.min(Math.max(goal.progress, 0), 100)
  return (
    <div>
      {/* §12.3: the fraction and the bar already say the ratio — a percentage
          beside them is a third way of saying one thing. */}
      <span className="num font-medium">{formatAmount(current)} / {formatAmount(target)}</span>
      <Progress
        value={progress}
        className="mt-2.5 h-1"
        aria-label={goal.name}
      />
    </div>
  )
}

function GoalPlan({ desiredDate, projectedDate, monthly, paceGapMonths }: { desiredDate: string; projectedDate: string; monthly: string; paceGapMonths: number | null }) {
  const { t } = useTranslation()
  const paceLabel = paceGapMonths == null || paceGapMonths === 0
    ? null
    : paceGapMonths > 0
      ? t('goals.table.lateBy', { count: paceGapMonths })
      : t('goals.table.earlyBy', { count: Math.abs(paceGapMonths) })
  return (
    <dl className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-1.5 text-[12px]">
      <dt className="text-ink3">{t('goals.table.desired')}</dt><dd className="font-mono font-medium">{desiredDate}</dd>
      <dt className="text-ink3">{t('goals.table.projected')}</dt><dd><span className={paceGapMonths != null && paceGapMonths > 0 ? 'font-mono font-medium text-attention' : 'font-mono font-medium'}>{projectedDate}</span>{paceLabel ? <span className={paceGapMonths != null && paceGapMonths > 0 ? 'ml-2 text-[11px] text-attention' : 'ml-2 text-[11px] text-ink3'}>{paceLabel}</span> : null}</dd>
      <dt className="text-ink3">{t('goals.table.monthly')}</dt><dd className="num font-medium">{monthly}</dd>
    </dl>
  )
}

function GoalActions({ goal, onOpen, onEdit, onDelete }: { goal: GoalItem; onOpen: (goalId: string) => void; onEdit: (goalId: string) => void; onDelete: (goalId: string) => void }) {
  const { t } = useTranslation()
  // A goal's one real action: choose which money counts towards it.
  return (
    <div className="inline-flex items-start gap-1">
      <Button type="button" variant="ghost" size="sm" className="h-10 px-3" onClick={() => onOpen(goal.id)}>
        {t('goals.actions.manageAssets')}
      </Button>
      <GoalMenu goalId={goal.id} goalName={goal.name} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

function GoalMenu({
  goalId,
  goalName,
  onOpen,
  onEdit,
  onDelete,
}: {
  goalId: string
  goalName: string
  onOpen: (goalId: string) => void
  onEdit: (goalId: string) => void
  onDelete: (goalId: string) => void
}) {
  const { t } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10 text-ink2" aria-label={t('goals.actions.menuFor', { name: goalName })}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* The row itself navigates, but a bare row-click is not an affordance —
            and for an asset-backed goal the detail page is where its only real
            action lives. */}
        <DropdownMenuItem onSelect={() => onOpen(goalId)}>
          <Eye className="size-4" />
          {t('goals.list.viewDetail')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(goalId)}>
          <Pencil className="size-4" />
          {t('common.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-alert focus:text-alert" onSelect={() => onDelete(goalId)}>
          <Trash2 className="size-4" />
          {t('common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function GoalRowSkeleton() {
  return <Skeleton className="h-[92px] w-full rounded-sunk" />
}
