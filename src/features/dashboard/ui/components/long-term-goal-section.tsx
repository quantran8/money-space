import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { GoalItem } from '@/features/goals/model/goals.types'

type LongTermGoalSectionProps = {
  goals: GoalItem[]
}

/** Alternating bar color per goal row, from the design-system tokens. */
const BAR_COLOR = ['hsl(var(--accent))', 'hsl(var(--foreground))']

/** Whole-million figure for the "80 / 120 triệu" caption. */
function millions(value: number | undefined) {
  return Math.round((value ?? 0) / 1_000_000)
}

/**
 * "Tiến độ hiện tại" (mockup `#goals`): the household's shared goals, each with
 * a have/target caption and a progress bar.
 */
export function LongTermGoalSection({ goals }: LongTermGoalSectionProps) {
  const { t } = useTranslation()
  const visible = goals.slice(0, 2)

  return (
    <div className="rounded-[28px] border border-border bg-card p-6 apple-shadow-soft xl:col-span-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('dashboard.redesign.goals.eyebrow')}
          </p>
          <h3 className="section-title mt-1 text-xl font-semibold">
            {t('dashboard.redesign.goals.title')}
          </h3>
        </div>
        <Link
          to="/goals"
          className="text-sm font-medium text-[hsl(var(--muted-foreground))] transition hover:text-foreground"
        >
          {t('dashboard.redesign.goals.detail')}
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t('dashboard.redesign.goals.empty')}
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {visible.map((goal, index) => {
            const progress = Math.min(100, Math.max(0, goal.progress ?? 0))
            return (
              <div key={goal.id}>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-medium">{goal.name}</p>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {t('dashboard.redesign.goals.progress', {
                        current: millions(goal.currentAmount),
                        target: millions(goal.targetAmount),
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{progress}%</p>
                </div>
                <div
                  className="mt-3 h-2 rounded-full bg-[hsl(var(--muted))]"
                  role="progressbar"
                  aria-label={goal.name}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: BAR_COLOR[index % BAR_COLOR.length],
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
