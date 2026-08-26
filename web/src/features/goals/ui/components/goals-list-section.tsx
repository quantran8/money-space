import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Eye,
  Flag,
  MoreVertical,
  Pencil,
  Plus,
  Repeat2,
  Search,
  SearchX,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { hasProjectedDate } from '@money-space/core/features/goals/model/goal-projection.types'
import type { GoalItem, GoalPriority } from '@money-space/core/features/goals/model/goals'
import { formatAmount, goalAmount, priorityRank } from '@money-space/core/features/goals/model/goals-form'
import { formatMonthYear } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Goals are CARDS on the canvas, not rows inside a panel.
 *
 * The table this replaces asked the reader to carry four columns across for a
 * list that is usually two or three items long — and every goal's answer ("how
 * far along, and does the plan still work") is a block, not a row of cells. As
 * cards each goal owns its own progress bar at full width, and the grid gives
 * one goal a comfortable card rather than a lonely stripe.
 *
 * `auto-fit` with a 560px cap is what keeps that true at both ends: a single
 * goal on a wide desktop stays a readable card instead of stretching to 1200px,
 * and a third goal turns the list into two columns on its own.
 */
const CARD_GRID = { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 560px))' }

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

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="t-title">{t('goals.demo.listTitle')}</h2>
          <span className="num t-caption text-ink3">
            {t('goals.countLabel', { count: goals.length })}
          </span>
        </div>
        <label className="flex min-h-11 w-full items-center gap-2 rounded-control border border-committed bg-card px-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-data-primary focus-within:shadow-[0_0_0_3px_rgba(115,164,215,0.16)] sm:w-[250px]">
          <Search className="size-[18px] shrink-0 text-ink3" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('goals.list.searchPlaceholder')}
            aria-label={t('goals.list.searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent t-body-sm outline-none placeholder:text-ink3"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="mt-5 grid items-start gap-3" style={CARD_GRID}>
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-[268px] w-full rounded-card" />
          ))}
        </div>
      ) : null}

      {!isLoading && goals.length === 0 ? (
        <div className="s-card mt-5 rounded-card bg-card py-8 text-center">
          <p className="t-body-sm text-ink2">{t('goals.list.empty')}</p>
          <Button size="sm" className="mt-4" onClick={onCreate}>
            <Plus className="size-4" />
            {t('goals.form.submit')}
          </Button>
        </div>
      ) : null}

      {!isLoading && goals.length > 0 && visibleGoals.length === 0 ? (
        <div className="mt-5 rounded-card bg-card py-8 text-center">
          <SearchX className="mx-auto size-7 text-ink3" strokeWidth={1.75} aria-hidden />
          <p className="mt-3 t-body-sm text-ink2">{t('goals.list.emptySearch')}</p>
        </div>
      ) : null}

      {!isLoading && visibleGoals.length > 0 ? (
        <div
          className="mt-5 grid items-start gap-3"
          style={CARD_GRID}
          aria-label={t('goals.table.ariaLabel')}
        >
          {visibleGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              locale={locale}
              isPrimary={goal.id === primaryGoalId}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function GoalCard({
  goal,
  locale,
  isPrimary,
  onOpen,
  onEdit,
  onDelete,
}: {
  goal: GoalItem
  locale: string
  isPrimary: boolean
  onOpen: (goalId: string) => void
  onEdit: (goalId: string) => void
  onDelete: (goalId: string) => void
}) {
  const { t } = useTranslation()
  const current = goalAmount(goal.currentAmount)
  const target = goalAmount(goal.targetAmount)
  const percent = Math.min(Math.max(goal.progress, 0), 100)
  const projection = goal.projection
  const paceGapMonths = projection?.paceGapMonths ?? null
  const isLate = paceGapMonths != null && paceGapMonths > 0

  const desiredDate =
    goal.targetDate && goal.targetDate !== 'No deadline'
      ? formatMonthYear(goal.targetDate, locale)
      : null
  const projectedDate =
    projection && hasProjectedDate(projection)
      ? formatMonthYear(projection.projectedCompletionDate!, locale)
      : null
  const monthly =
    goal.plannedMonthlyContribution != null && goal.plannedMonthlyContribution > 0
      ? formatAmount(goal.plannedMonthlyContribution)
      : null

  return (
    <article
      className="s-card cursor-pointer rounded-card bg-card transition-transform duration-150 hover:-translate-y-px"
      onClick={() => onOpen(goal.id)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {/* The card navigates on click, but a bare clickable box is not an
              affordance — the name stays a real button so the goal is reachable
              by keyboard. */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onOpen(goal.id)
            }}
            className="t-subtitle min-w-0 truncate text-left hover:text-action"
          >
            {goal.name}
          </button>
          {isPrimary ? (
            <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 t-caption-sm font-medium text-action">
              {t('home.mainGoal.badge')}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1" onClick={(event) => event.stopPropagation()}>
          <PriorityMark priority={goal.priority} />
          <GoalMenu goalId={goal.id} goalName={goal.name} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
      <p className="num mt-1 t-caption text-ink3">
        {t('goals.card.target', { amount: formatAmount(target) })}
      </p>

      {/* The one question the card answers. §12.3: the figure and the bar
          already say the ratio, so the percentage sits beside the figure as its
          reading rather than repeated under the bar. */}
      <div className="mt-7">
        <p className="t-body-sm text-ink2">{t('goals.demo.saved')}</p>
        <div className="mt-2 flex items-end justify-between gap-5">
          <span className="money-number t-figure">{formatAmount(current)}</span>
          <span className="num t-body-sm text-ink2">{percent}%</span>
        </div>
        <Progress
          value={percent}
          className="mt-4"
          aria-label={t('goals.detail.picture.progressAria', {
            current: formatAmount(current),
            target: formatAmount(target),
          })}
        />
        <p className="num mt-2 t-caption text-ink3">
          {t('goals.card.ofTarget', { amount: formatAmount(target) })}
        </p>
      </div>

      {/*
        The plan, compressed to three facts. A fact that has no value keeps its
        icon and drops its text: an empty "Dự kiến: —" row spends a full line
        saying nothing, while the greyed icon says the same thing in 44px and
        still carries the sentence in its tooltip and its label.
      */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-ink2">
        <Fact
          icon={CalendarDays}
          value={desiredDate}
          label={desiredDate ? t('goals.primary.targetDate') : t('goals.demo.noTargetDate')}
          tone="text-data-primary"
        />
        <Fact
          icon={Repeat2}
          value={monthly}
          label={monthly ? t('goals.demo.monthlyShort') : t('goals.card.noMonthly')}
          tone="text-data-primary"
        />
        <Fact
          icon={ChartNoAxesColumnIncreasing}
          value={projectedDate}
          label={projectedDate ? t('goals.table.projected') : t('goals.card.noProjection')}
          tone={isLate ? 'text-attention-ink' : 'text-data-primary'}
          valueClassName={isLate ? 'text-attention-ink' : undefined}
        />
      </div>
    </article>
  )
}

/**
 * A missing fact is an ICON, a present one is icon + value. Both keep a 44px
 * box so the row of them stays tappable and lands on one baseline.
 */
function Fact({
  icon: Icon,
  value,
  label,
  tone,
  valueClassName,
}: {
  icon: LucideIcon
  value: string | null
  label: string
  tone: string
  valueClassName?: string
}) {
  if (!value) {
    return (
      <span
        className="inline-flex size-11 items-center justify-center rounded-control text-ink3"
        role="img"
        aria-label={label}
        title={label}
      >
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
    )
  }

  return (
    <span className="inline-flex min-h-11 items-center gap-2" title={label}>
      <Icon className={cn('size-[18px] shrink-0', tone)} strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{label}: </span>
      <span className={cn('num t-body-sm font-medium', valueClassName)}>{value}</span>
    </span>
  )
}

/**
 * Priority is shown only when it CHANGES something: a high-priority goal is
 * funded first when a wallet cannot cover every goal, a low one last. `medium`
 * is the default, and a flag on every card would say nothing.
 */
function PriorityMark({ priority }: { priority: GoalPriority }) {
  const { t } = useTranslation()
  if (priority === 'medium') return null

  const label = t(`options.priority.${priority}`)
  return (
    <span
      className="inline-flex size-11 items-center justify-center rounded-control"
      role="img"
      aria-label={label}
      title={label}
    >
      <Flag
        className={cn('size-[18px]', priority === 'high' ? 'text-attention-ink' : 'text-ink3')}
        strokeWidth={1.75}
      />
    </span>
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
        <Button variant="ghost" size="icon" className="text-ink2" aria-label={t('goals.actions.menuFor', { name: goalName })}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
