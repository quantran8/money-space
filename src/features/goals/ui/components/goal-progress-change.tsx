import { useTranslation } from 'react-i18next'

import { useGoalProgressChange } from '@/features/goals/hooks/use-goal-progress-change'
import { formatAmount } from '@/features/goals/model/goals-form'
import { cn } from '@/shared/lib/utils'

/**
 * One line under the progress bar saying why the figure moved.
 *
 * A goal backed by gold reprices on its own: a household that saw 50% yesterday
 * and 48% today changed nothing, and without a word on screen the number looks
 * arbitrary. A number nobody can explain is a number nobody trusts.
 *
 * The tempting alternative — freeze the asset at what it was worth when it was
 * assigned — is worse than the problem. A goal claiming 250tr of gold that would
 * fetch 240tr today does not reassure the household, it misleads them; and it is
 * the same stored-figure-floating-free-of-its-asset that `earmark` was. So the
 * figure keeps following the assets, and this supplies what was missing.
 *
 * Renders nothing when nothing moved — a line reading "no change" is noise on a
 * surface that should stay quiet unless it has something to report.
 *
 * A fall uses `--attention`, never `--alert`: the market moving is information,
 * not an error, and never the household's fault (design.md §16).
 */
export function GoalProgressChange({ goalId }: { goalId: string }) {
  const { t } = useTranslation()
  const { change } = useGoalProgressChange(goalId)

  if (!change) return null

  const fell = change.delta < 0
  // Yesterday needs no date; anything older does, or "hôm qua" would quietly
  // describe a fortnight of movement.
  const isYesterday = change.previousDate === isoDaysAgo(1)
  const since = isYesterday
    ? t('goals.detail.change.yesterday')
    : t('goals.detail.change.on', {
        date: formatDayMonth(change.previousDate),
      })

  return (
    <p className="mt-3 text-[13px] leading-relaxed text-ink2">
      {t('goals.detail.change.line', {
        since,
        previous: formatAmount(change.previousAmount),
        current: formatAmount(change.currentAmount),
      })}
      {change.reasons.length > 0 ? (
        <>
          {' · '}
          <span className={cn(fell && 'text-attention')}>
            {change.reasons
              .map((reason) =>
                t(
                  reason.delta < 0
                    ? 'goals.detail.change.reasonDown'
                    : 'goals.detail.change.reasonUp',
                  {
                    asset: reason.assetName,
                    amount: formatAmount(Math.abs(reason.delta)),
                  },
                ),
              )
              .join(', ')}
          </span>
        </>
      ) : null}
    </p>
  )
}

/** `YYYY-MM-DD` for N days before today, in local time. */
function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** `2026-08-12` → `12/8`, the form the rest of the app uses. */
function formatDayMonth(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${Number(day)}/${Number(month)}`
}
