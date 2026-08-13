import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { SubSection } from '@/components/ui/sub-section'
import {
  hasProjectedDate,
  type GoalProjection,
} from '@/features/goals/model/goal-projection.types'
import { formatVndShort } from '@/shared/lib/format-money'

/**
 * The §26C projection panel.
 *
 * When `plannedMonthlyContribution` is undeclared the backend reports
 * `reason: 'no_contribution'` and there is NO honest projected date — so this
 * shows **progress only**. Inventing a date from past behaviour would be a
 * guess presented as a fact, which the product forbids.
 */
export function GoalProjectionPanel({ projection }: { projection: GoalProjection }) {
  const { t } = useTranslation()
  const showsDate = hasProjectedDate(projection)

  return (
    <Card>
      <h2 className="section-title text-xl font-semibold">{t('goals.projection.title')}</h2>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-ink2">
            {t('goals.projection.progress')}
          </p>
          <p className="money-number text-sm font-semibold">
            {formatVndShort(projection.currentAmount)} /{' '}
            {formatVndShort(projection.targetAmount)}
          </p>
        </div>
        <Progress value={projection.progressPercent} className="mt-3 h-3" />
        <p className="mt-2 text-xs text-ink2">
          {t('goals.projection.remaining', {
            amount: formatVndShort(projection.remainingAmount),
          })}
        </p>
      </div>

      {showsDate ? (
        <div className="mt-4 space-y-3">
          <SubSection title={t('goals.projection.atCurrentPace')}>
            <p className="money-number text-lg font-semibold">
              {projection.projectedCompletionDate}
            </p>
            {projection.estimatedMonthsToGoal !== null ? (
              <p className="mt-1 text-xs text-ink2">
                {t('goals.projection.months', { count: projection.estimatedMonthsToGoal })}
              </p>
            ) : null}
          </SubSection>

          {projection.requiredMonthlyContributionForTargetDate !== null ? (
            <SubSection title={t('goals.projection.toHitTargetDate')}>
              <p className="money-number text-lg font-semibold">
                {t('goals.projection.perMonth', {
                  amount: formatVndShort(
                    projection.requiredMonthlyContributionForTargetDate,
                  ),
                })}
              </p>
            </SubSection>
          ) : null}
        </div>
      ) : (
        // No declared contribution → progress only, plus a calm invitation to
        // declare one. Never a projected date.
        <p className="mt-4 text-sm leading-6 text-ink2">
          {t(`goals.projection.reason.${projection.reason}`)}
        </p>
      )}
    </Card>
  )
}
