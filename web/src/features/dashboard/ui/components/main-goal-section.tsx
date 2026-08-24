import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader } from '@/components/ui/panel'
import { hasProjectedDate } from '@money-space/core/features/goals/model/goal-projection.types'
import type { GoalItem } from '@money-space/core/features/goals/model/goals.types'
import { goalAmount } from '@money-space/core/features/goals/model/goals-form'
import { formatMonthYear, formatVndScale } from '@money-space/core/shared/lib/format-money'

/**
 * Home section 3 — Mục tiêu chính (§12.3).
 *
 * Exactly one goal. The PROJECTED DATE outranks the progress bar: "20% saved"
 * says far less than "at this pace, Nov 2029 instead of Jun 2029".
 *
 * When no monthly contribution has been declared there is no honest projected
 * date, so this shows progress only — deriving a date from past behaviour would
 * present a guess as a fact (§2.16, goal-projection.types.ts).
 */
export function MainGoalSection({
  goal,
  goalCount,
}: {
  goal: GoalItem
  goalCount: number
}) {
  const { t } = useTranslation()

  const current = goalAmount(goal.currentAmount)
  const target = goalAmount(goal.targetAmount)
  const percent = target > 0 ? Math.round((current / target) * 100) : 0
  const projection = goal.projection

  return (
    <Panel>
      <PanelHeader
        title={t('home.mainGoal.title')}
        action={
          <Link to="/goals" className="text-[13px] text-action">
            {t('home.mainGoal.viewAll', { count: goalCount })}
          </Link>
        }
      />

      <div className="mt-7 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[15px] font-medium">{goal.name}</p>
            <span className="sunk rounded-full px-2 py-0.5 font-mono text-[10px] text-ink2">
              {t('home.mainGoal.badge')}
            </span>
          </div>

          <div className="mt-3.5 flex items-baseline justify-between gap-3">
            <span className="num text-[22px] font-medium tracking-[-.03em]">
              {formatVndScale(current)} / {formatVndScale(target)}
            </span>
            <span className="num font-mono text-[11px] text-ink3">{percent}%</span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--hair)' }}>
            <div
              className="seg h-full rounded-full"
              style={{ width: `${Math.min(Math.max(percent, 0), 100)}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>

        <dl className="space-y-4 lg:pt-1">
          {goal.targetDate ? (
            <Row label={t('home.mainGoal.targetDate')} value={formatMonthYear(goal.targetDate)} />
          ) : null}

          {projection && hasProjectedDate(projection) ? (
            <Row
              label={t('home.mainGoal.atCurrentPace')}
              value={formatMonthYear(projection.projectedCompletionDate!)}
            />
          ) : (
            <Row label={t('home.mainGoal.atCurrentPace')} value={t('home.mainGoal.noProjection')} muted />
          )}

          {projection?.requiredMonthlyContributionForTargetDate ? (
            <Row
              label={t('home.mainGoal.requiredPace')}
              value={t('home.mainGoal.perMonth', {
                amount: formatVndScale(projection.requiredMonthlyContributionForTargetDate),
              })}
              strong
            />
          ) : projection?.onPaceForTargetDate ? (
            <Row label={t('home.mainGoal.requiredPace')} value={t('home.mainGoal.onPace')} muted />
          ) : null}
        </dl>
      </div>
    </Panel>
  )
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string
  value: string
  strong?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-baseline gap-4">
      <dt className="flex-1 text-[14px] text-ink2">{label}</dt>
      <dd
        className={`num text-[14px] ${strong ? 'font-medium' : ''} ${muted ? 'text-ink3' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}
