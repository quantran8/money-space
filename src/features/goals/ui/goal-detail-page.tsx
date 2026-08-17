import { ChevronLeft, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Panel, PanelHeader, PanelSplit, Sunk } from '@/components/ui/panel'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { useEvents } from '@/features/events/hooks/use-events'
import { useGoalsPage } from '@/features/goals/hooks/use-goals-page'
import { hasProjectedDate } from '@/features/goals/model/goal-projection.types'
import { goalAmount } from '@/features/goals/model/goals-form'
import { GoalContributionDialog } from '@/features/goals/ui/components/goal-contribution-dialog'
import { GoalFormDialog } from '@/features/goals/ui/components/goal-form-dialog'
import { useMembers } from '@/features/members/hooks/use-members'
import { formatVndScale, splitVndScale } from '@/shared/lib/format-money'

/** Goal dates are month-precision; `'No deadline'` is the legacy empty marker. */
function formatGoalDate(value: string | undefined, locale: string, fallback: string) {
  if (!value || value === 'No deadline') return fallback
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(locale, {
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [contributionOpen, setContributionOpen] = useState(false)
  const [explainOpen, setExplainOpen] = useState(false)
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'vi-VN'
  const { events, isLoading: eventsLoading } = useEvents()
  const { assets } = useAssets()
  const { members } = useMembers()
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
        .filter((event) => event.type === 'goal_contribution' && event.financialGoalId === goalId)
        .sort((a, b) => b.isoDate.localeCompare(a.isoDate)),
    [events, goalId],
  )
  const assetNames = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset.name])),
    [assets],
  )
  // `createdById` is an auth profile id; members carry it as `profileId`.
  const memberNames = useMemo(
    () => new Map(members.map((member) => [member.profileId, member.name])),
    [members],
  )

  if ((isLoading || eventsLoading) && !goal) {
    return (
      <div className="space-y-4 pb-3">
        <Sunk className="h-9 w-40 animate-pulse" />
        <Sunk className="h-52 animate-pulse rounded-panel" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="space-y-4 pb-3">
        <BackLink onClick={() => navigate('/goals')} label={t('goals.detail.back')} />
        <Panel className="py-10 text-center">
          <h1 className="section-title text-[16px]">{t('goals.detail.notFound.title')}</h1>
          <p className="mt-1 text-[13px] text-ink2">{t('goals.detail.notFound.description')}</p>
        </Panel>
      </div>
    )
  }

  const current = goalAmount(goal.currentAmount)
  const target = goalAmount(goal.targetAmount)
  const remaining = Math.max(target - current, 0)
  const progress = Math.min(Math.max(goal.progress, 0), 100)
  const savedFigure = splitVndScale(current)
  const projection = goal.projection
  const notSet = t('goals.table.notSet')
  const desiredDate = formatGoalDate(goal.targetDate, locale, notSet)
  const projectedDate =
    projection && hasProjectedDate(projection)
      ? formatGoalDate(projection.projectedCompletionDate ?? undefined, locale, notSet)
      : t('goals.demo.unknownProjection')
  const requiredMonthly = projection?.requiredMonthlyContributionForTargetDate
  const plannedMonthly = goal.plannedMonthlyContribution

  function handleContributionOpen() {
    if (!goal) return
    setContribution(goal.id, '')
    setContributionOpen(true)
  }

  return (
    <div className="space-y-4 pb-3">
      <header className="px-1 py-1 sm:px-0">
        <BackLink onClick={() => navigate('/goals')} label={t('goals.detail.back')} />

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="page-title min-w-0 truncate text-[30px] leading-tight sm:text-[36px]">
            {goal.name}
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button
              variant="secondary"
              className="h-10 px-4 text-[13px]"
              onClick={() => openEdit(goal.id)}
            >
              <Pencil className="size-4" strokeWidth={1.75} />
              {t('common.edit')}
            </Button>
            <Button className="h-10 px-4 text-[13px]" onClick={handleContributionOpen}>
              <Plus className="size-4" strokeWidth={1.75} />
              {t('goals.detail.addContribution')}
            </Button>
          </div>
        </div>
      </header>

      {/* The answer: how much is set aside, and what that means for the date. */}
      <Panel>
        <PanelSplit className="mt-0">
          <div>
            <p className="label">{t('goals.detail.picture.saved')}</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="money-number text-[44px] leading-none sm:text-[54px]">
                {savedFigure.amount}
              </span>
              <span className="mb-1 text-[15px] text-ink2">/ {formatVndScale(target)}</span>
            </div>

            <div
              className="mt-6 h-1.5 overflow-hidden rounded-full bg-committed"
              role="progressbar"
              aria-label={t('goals.detail.picture.progressAria', {
                current: formatVndScale(current),
                target: formatVndScale(target),
              })}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="seg h-full min-w-[4px] rounded-full bg-accent"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <dl className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <PictureMetric label={t('goals.detail.picture.desiredDate')} value={desiredDate} />
            <PictureMetric label={t('goals.detail.picture.atCurrentPace')} value={projectedDate} />
            <PictureMetric
              label={t('goals.detail.picture.requiredMonthly')}
              value={
                requiredMonthly != null && requiredMonthly > 0
                  ? t('goals.detail.picture.perMonth', { amount: formatVndScale(requiredMonthly) })
                  : notSet
              }
            />
          </dl>
        </PanelSplit>
      </Panel>

      <Panel>
        <PanelHeader
          title={t('goals.detail.plan.title')}
          action={
            <button
              type="button"
              className="min-h-11 text-[13px] font-medium text-accent"
              onClick={() => setExplainOpen((open) => !open)}
              aria-expanded={explainOpen}
            >
              {explainOpen ? t('goals.detail.plan.hide') : t('goals.detail.plan.explain')}
            </button>
          }
        />

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          <PlanTile
            label={t('goals.detail.plan.monthly')}
            value={
              plannedMonthly != null && plannedMonthly > 0
                ? formatVndScale(plannedMonthly)
                : t('goals.projection.noPace')
            }
          />
          <PlanTile label={t('goals.detail.plan.remaining')} value={formatVndScale(remaining)} />
          <PlanTile label={t('goals.detail.plan.priority')} value={priorityLabels[goal.priority]} />
        </div>

        {/* Every projected number has to be explainable (design.md §16). */}
        {explainOpen ? (
          <Sunk className="mt-4 px-4 py-4 text-[13px] leading-6 text-ink2">
            {projection ? (
              <>
                <p>{t(`goals.projection.reason.${projection.reason}`)}</p>
                {hasProjectedDate(projection) ? (
                  <dl className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-[180px_1fr]">
                    <dt>{t('goals.detail.plan.monthly')}</dt>
                    <dd className="num font-medium text-ink">
                      {formatVndScale(projection.plannedMonthlyContribution ?? 0)}
                    </dd>
                    <dt>{t('goals.detail.plan.remaining')}</dt>
                    <dd className="num font-medium text-ink">
                      {formatVndScale(projection.remainingAmount)}
                    </dd>
                    {projection.estimatedMonthsToGoal != null ? (
                      <>
                        <dt>{t('goals.detail.plan.estimatedMonths')}</dt>
                        <dd className="num font-medium text-ink">
                          {t('goals.projection.months', {
                            count: projection.estimatedMonthsToGoal,
                          })}
                        </dd>
                      </>
                    ) : null}
                  </dl>
                ) : null}
              </>
            ) : (
              <p>{t('goals.detail.plan.explainUnavailable')}</p>
            )}
          </Sunk>
        ) : null}
      </Panel>

      <Panel>
        <PanelHeader
          title={t('goals.detail.history.title')}
          meta={t('goals.detail.history.count', { count: contributionEvents.length })}
        />

        {contributionEvents.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="table-dense w-full min-w-[640px] text-[14px]">
              <thead>
                <tr className="label">
                  <th className="pb-3 text-left font-normal">
                    {t('goals.detail.history.columns.date')}
                  </th>
                  <th className="pb-3 text-left font-normal">
                    {t('goals.detail.history.columns.source')}
                  </th>
                  <th className="pb-3 text-left font-normal">
                    {t('goals.detail.history.columns.recordedBy')}
                  </th>
                  <th className="pb-3 text-left font-normal">
                    {t('goals.detail.history.columns.note')}
                  </th>
                  <th className="pb-3 text-right font-normal">
                    {t('goals.detail.history.columns.amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {contributionEvents.map((event) => (
                  <tr key={event.id ?? `${event.isoDate}-${event.amount}`}>
                    <td className="py-3 font-mono text-[12px] text-ink3">
                      {new Date(event.isoDate).toLocaleDateString(locale)}
                    </td>
                    <td className="py-3">
                      {(event.fromAssetId ? assetNames.get(event.fromAssetId) : undefined) ??
                        t('goals.detail.history.unknownSource')}
                    </td>
                    <td className="py-3">
                      {(event.createdById ? memberNames.get(event.createdById) : undefined) ??
                        t('goals.detail.history.unknownMember')}
                    </td>
                    <td className="py-3 text-ink2">
                      {event.note || t('goals.detail.history.defaultNote')}
                    </td>
                    <td className="num py-3 text-right font-medium text-accent">
                      +{formatVndScale(Math.abs(event.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 py-10 text-center text-[13px] text-ink2">
            {t('goals.detail.history.empty')}
          </p>
        )}
      </Panel>

      <GoalContributionDialog
        open={contributionOpen}
        onOpenChange={setContributionOpen}
        goal={goal}
        amount={contributions[goal.id] ?? ''}
        onAmountChange={(value) => setContribution(goal.id, value)}
        sourceId={contributionSources[goal.id] ?? ''}
        onSourceChange={(value) => setContributionSource(goal.id, value)}
        walletOptions={walletOptions}
        isSubmitting={isContributing}
        onSubmit={() => addContribution(goal.id)}
      />

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

function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-[13px] font-medium text-accent hover:bg-accent-soft"
      onClick={onClick}
    >
      <ChevronLeft className="size-4" strokeWidth={1.75} />
      {label}
    </button>
  )
}

function PictureMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-ink2">{label}</dt>
      <dd className="num mt-1 text-[20px] font-medium">{value}</dd>
    </div>
  )
}

function PlanTile({ label, value }: { label: string; value: string }) {
  return (
    <Sunk className="px-4 py-4">
      <p className="text-[13px] text-ink2">{label}</p>
      <p className="num mt-2 text-[22px] font-medium">{value}</p>
    </Sunk>
  )
}
