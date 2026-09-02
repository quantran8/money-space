import { Text } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useGoalProgressChange } from '@money-space/core/features/goals/hooks/use-goal-progress-change'
import { formatAmount } from '@money-space/core/features/goals/model/goals-form'

import { formatDayMonth, isoDaysAgo } from '@/features/goals/lib/goal-dates'

/**
 * One line under the progress bar saying why the figure moved.
 *
 * A goal backed by gold reprices on its own: a household that saw 50% yesterday
 * and 48% today changed nothing, and with no explanation the number looks
 * arbitrary — a number nobody can explain is a number nobody trusts.
 *
 * Renders nothing when nothing moved. `change` is null both when the figure held
 * and when there is no earlier point to compare against, and a line reading "no
 * change" is noise on a surface that should stay quiet unless it has something
 * to report.
 *
 * A fall uses `--attention`, never `--alert`: the market moving is information,
 * never the household's fault.
 */
export function GoalProgressChange({ goalId }: { goalId: string }) {
  const { t } = useTranslation()
  const { change } = useGoalProgressChange(goalId)

  if (!change) return null

  const fell = change.delta < 0
  // Yesterday needs no date; anything older does, or "hôm qua" would quietly
  // describe a fortnight of movement.
  const since =
    change.previousDate === isoDaysAgo(1)
      ? t('goals.detail.change.yesterday')
      : t('goals.detail.change.on', { date: formatDayMonth(change.previousDate) })

  const reasons = change.reasons
    .map((reason) =>
      t(
        reason.delta < 0
          ? 'goals.detail.change.reasonDown'
          : 'goals.detail.change.reasonUp',
        { asset: reason.assetName, amount: formatAmount(Math.abs(reason.delta)) },
      ),
    )
    .join(', ')

  return (
    <Text className="mt-3 t-caption leading-5 text-ink2">
      {t('goals.detail.change.line', {
        since,
        previous: formatAmount(change.previousAmount),
        current: formatAmount(change.currentAmount),
      })}
      {reasons ? (
        <Text className={fell ? 'text-attention-ink' : 'text-ink2'}> · {reasons}</Text>
      ) : null}
    </Text>
  )
}
