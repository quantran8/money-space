import { ChevronLeft, Pencil, Plus } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MoneyInput } from '@/components/ui/number-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { useEvents } from '@/features/events/hooks/use-events'
import type { MoneyEventItem } from '@/features/events/model/events.types'
import { useGoalsPage } from '@/features/goals/hooks/use-goals-page'
import type { GoalItem } from '@/features/goals/model/goals'
import {
  formatAmount,
  goalAmount,
  priorityTone,
  suggestedPace,
} from '@/features/goals/model/goals-form'
import { GoalFormDialog } from '@/features/goals/ui/components/goal-form-dialog'

type ChartPoint = {
  date: string
  label: string
  actual?: number
  plan: number
}

function validDate(value?: string) {
  if (!value || value === 'No deadline') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatGoalDate(value: string | undefined, locale: string, fallback: string) {
  const date = validDate(value)
  return date
    ? date.toLocaleDateString(locale, { month: '2-digit', year: 'numeric' })
    : fallback
}

function buildChartData(goal: GoalItem, events: MoneyEventItem[], locale: string): ChartPoint[] {
  const current = goalAmount(goal.currentAmount)
  const target = goalAmount(goal.targetAmount)
  const sorted = [...events].sort((a, b) => a.isoDate.localeCompare(b.isoDate))
  const totalContributions = sorted.reduce((sum, event) => sum + Math.abs(event.amount), 0)
  const baseline = Math.max(current - totalContributions, 0)
  const now = new Date()
  const defaultStart = new Date(now)
  defaultStart.setMonth(defaultStart.getMonth() - 6)
  const start = sorted[0] ? new Date(sorted[0].isoDate) : defaultStart
  const configuredDeadline = validDate(goal.deadline)
  const fallbackDeadline = new Date(now)
  fallbackDeadline.setMonth(fallbackDeadline.getMonth() + 4)
  const end = configuredDeadline && configuredDeadline > now ? configuredDeadline : fallbackDeadline
  const duration = Math.max(end.getTime() - start.getTime(), 1)

  const toPoint = (date: Date, actual?: number): ChartPoint => ({
    date: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString(locale, { month: 'short', year: '2-digit' }),
    actual,
    plan: Math.min(target, Math.max(0, target * ((date.getTime() - start.getTime()) / duration))),
  })

  let cumulative = baseline
  const points: ChartPoint[] = [toPoint(start, baseline)]
  for (const event of sorted) {
    cumulative += Math.abs(event.amount)
    points.push(toPoint(new Date(event.isoDate), Math.min(cumulative, current)))
  }
  points.push(toPoint(now, current))
  points.push(toPoint(end))
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </div>
  )
}

export function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [contributionOpen, setContributionOpen] = useState(false)
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const { events, isLoading: eventsLoading } = useEvents()
  const { assets } = useAssets()
  const {
    goals,
    isLoading,
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
    openEdit,
    handleFormOpenChange,
  } = useGoalsPage()

  const goal = goals.find((item) => item.id === goalId)
  const contributionEvents = useMemo(
    () =>
      events
        .filter(
          (event) =>
            event.type === 'goal_contribution' && event.financialGoalId === goalId,
        )
        .sort((a, b) => b.isoDate.localeCompare(a.isoDate)),
    [events, goalId],
  )
  const assetNames = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset.name])),
    [assets],
  )
  const chartData = useMemo(
    () => (goal ? buildChartData(goal, contributionEvents, locale) : []),
    [contributionEvents, goal, locale],
  )

  if ((isLoading || eventsLoading) && !goal) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-52 animate-pulse rounded-[28px] bg-muted" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="-ml-2 gap-1" onClick={() => navigate('/goals')}>
          <ChevronLeft className="size-4" />
          {t('goals.detail.back')}
        </Button>
        <Card className="py-10 text-center">
          <h1 className="text-lg font-semibold">{t('goals.detail.notFound.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('goals.detail.notFound.description')}
          </p>
        </Card>
      </div>
    )
  }

  const current = goalAmount(goal.currentAmount)
  const target = goalAmount(goal.targetAmount)
  const remaining = Math.max(target - current, 0)
  const pace = suggestedPace(goal)
  const deadline = formatGoalDate(goal.deadline, locale, t('goals.list.noDeadline'))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="-ml-2 w-fit gap-1"
          onClick={() => navigate('/goals')}
        >
          <ChevronLeft className="size-4" />
          {t('goals.detail.back')}
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">{t('goals.detail.eyebrow')}</p>
              <Badge className={priorityTone[goal.priority]}>
                {priorityLabels[goal.priority]}
              </Badge>
            </div>
            <h1 className="page-title mt-2 text-3xl font-semibold sm:text-4xl">{goal.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('goals.detail.deadline', { value: deadline })}
              {goal.note ? ` · ${goal.note}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => openEdit(goal.id)}>
              <Pencil className="mr-2 size-4" />
              {t('common.edit')}
            </Button>
            <Button onClick={() => setContributionOpen((open) => !open)}>
              <Plus className="mr-2 size-4" />
              {t('goals.detail.addContribution')}
            </Button>
          </div>
        </div>
      </div>

      {contributionOpen ? (
        <Card className="border-accent/20 bg-card">
          <p className="text-sm font-semibold">{t('goals.actions.contributeHelp')}</p>
          <form
            className="mt-3 flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              void addContribution(goal.id)
            }}
          >
            <MoneyInput
              value={contributions[goal.id] ?? ''}
              onChange={(value) => setContribution(goal.id, value)}
              placeholder={t('goals.actions.contributePlaceholder')}
              className="min-w-[12rem] flex-1"
            />
            <Select
              value={contributionSources[goal.id] ?? ''}
              onValueChange={(value) => setContributionSource(goal.id, value)}
              disabled={walletOptions.length === 0}
            >
              <SelectTrigger className="w-48" aria-label={t('goals.actions.source')}>
                <SelectValue placeholder={t('goals.actions.sourcePlaceholder')} />
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
              disabled={isContributing || !contributionSources[goal.id]}
            >
              {isContributing ? t('goals.actions.contributing') : t('goals.actions.contribute')}
            </Button>
          </form>
        </Card>
      ) : null}

      <section className="rounded-[28px] bg-[#1d1d1f] p-6 text-white shadow-[0_14px_38px_rgba(0,0,0,0.08)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_1fr] xl:items-end">
          <div>
            <p className="text-sm text-white/45">{t('goals.detail.progress.current')}</p>
            <p className="money-number mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
              {goal.progress}%
            </p>
            <p className="mt-5 text-sm text-white/45">
              {t('goals.detail.progress.description', {
                current: formatAmount(current),
                target: formatAmount(target),
              })}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3 sm:gap-3">
            <HeroMetric label={t('goals.strip.saved')} value={formatAmount(current)} />
            <HeroMetric label={t('goals.strip.remaining')} value={formatAmount(remaining)} />
            <HeroMetric label={t('goals.strip.monthlyPace')} value={formatAmount(pace)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('goals.detail.chart.eyebrow')}</p>
              <h2 className="section-title mt-1 text-xl font-semibold">
                {t('goals.detail.chart.title')}
              </h2>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-5 rounded-full bg-accent" />
                {t('goals.detail.chart.actual')}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-px w-5 border-t border-dashed border-muted-foreground" />
                {t('goals.detail.chart.plan')}
              </span>
            </div>
          </div>
          <GoalProgressChart data={chartData} />
        </Card>

        <Card className="xl:col-span-4">
          <p className="text-sm text-muted-foreground">{t('goals.detail.info.eyebrow')}</p>
          <h2 className="section-title mt-1 text-xl font-semibold">
            {t('goals.detail.info.title')}
          </h2>
          <div className="mt-5 divide-y divide-border">
            <InfoRow label={t('goals.detail.info.target')} value={formatAmount(target)} />
            <InfoRow label={t('goals.detail.info.deadline')} value={deadline} />
            <InfoRow
              label={t('goals.detail.info.priority')}
              value={priorityLabels[goal.priority]}
            />
            <InfoRow label={t('goals.detail.info.method')} value={t('goals.detail.info.multipleSources')} />
          </div>
        </Card>
      </section>

      <Card>
        <p className="text-sm text-muted-foreground">{t('goals.detail.history.eyebrow')}</p>
        <h2 className="section-title mt-1 text-xl font-semibold">
          {t('goals.detail.history.title')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('goals.detail.history.description')}
        </p>

        {contributionEvents.length > 0 ? (
          <div className="mt-5 divide-y divide-border">
            {contributionEvents.map((event) => (
              <div
                key={event.id ?? `${event.isoDate}-${event.amount}`}
                className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[110px_1fr_180px_130px] md:items-center"
              >
                <p className="text-xs text-muted-foreground">
                  {new Date(event.isoDate).toLocaleDateString(locale)}
                </p>
                <p className="text-sm font-medium">{event.note || t('goals.detail.history.defaultNote')}</p>
                <p className="text-sm text-muted-foreground">
                  {event.fromAssetId
                    ? assetNames.get(event.fromAssetId) ?? t('goals.detail.history.unknownSource')
                    : t('goals.detail.history.unknownSource')}
                </p>
                <p className="money-number text-sm font-semibold text-[hsl(var(--status-green))] md:text-right">
                  +{formatAmount(Math.abs(event.amount))}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            {t('goals.detail.history.empty')}
          </p>
        )}
      </Card>

      <GoalFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        isEditing={isEditing}
        isSubmitting={isSavingGoal}
        onSubmit={submit}
      />
    </div>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/10 pl-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className="money-number mt-3 text-xl font-semibold">{value}</p>
    </div>
  )
}

function GoalProgressChart({ data }: { data: ChartPoint[] }) {
  const { t } = useTranslation()
  return (
    <div className="mt-6 h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value: number) => formatAmount(value)}
          />
          <Tooltip
            formatter={(value, name) => [
              formatAmount(Number(value)),
              name === 'actual'
                ? t('goals.detail.chart.actual')
                : t('goals.detail.chart.plan'),
            ]}
            labelClassName="text-xs text-muted-foreground"
            contentStyle={{
              borderRadius: 14,
              borderColor: 'hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
          />
          <Line
            type="monotone"
            dataKey="plan"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="7 7"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="hsl(var(--accent))"
            strokeWidth={3}
            connectNulls={false}
            isAnimationActive={false}
            activeDot={{ r: 5, strokeWidth: 3, stroke: 'hsl(var(--card))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
