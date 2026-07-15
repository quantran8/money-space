import { useTranslation } from 'react-i18next'

import type { GoalItem } from '@/features/goals/model/goals'
import {
  formatAmount,
  suggestedPace,
  type GoalStats,
} from '@/features/goals/model/goals-form'

type GoalsSummaryStripProps = {
  count: number
  stats: GoalStats
  goals: GoalItem[]
}

export function GoalsSummaryStrip({ count, stats, goals }: GoalsSummaryStripProps) {
  const { t } = useTranslation()
  const remaining = Math.max(stats.target - stats.saved, 0)
  const monthlyPace = goals.reduce((sum, goal) => sum + suggestedPace(goal), 0)
  const progress = stats.target > 0 ? Math.round((stats.saved / stats.target) * 100) : 0

  return (
    <section className="overflow-hidden rounded-[28px] bg-[#1d1d1f] p-6 text-white shadow-[0_14px_38px_rgba(0,0,0,0.08)] sm:p-8">
      <div className="grid gap-8 xl:grid-cols-[1.1fr_1fr] xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-white/45">{t('goals.strip.target')}</p>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/55">
              {t('goals.countLabel', { count })}
            </span>
          </div>
          <p className="money-number mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
            {formatAmount(stats.target)}
          </p>
          <p className="mt-5 text-sm text-white/45">
            {t('goals.strip.progressDescription', {
              saved: formatAmount(stats.saved),
              progress,
            })}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3 sm:gap-3">
          <SummaryMetric
            label={t('goals.strip.saved')}
            value={formatAmount(stats.saved)}
            note={t('goals.strip.progressShare', { progress })}
          />
          <SummaryMetric
            label={t('goals.strip.remaining')}
            value={formatAmount(remaining)}
            note={t('goals.strip.acrossGoals', { count })}
          />
          <SummaryMetric
            label={t('goals.strip.monthlyPace')}
            value={formatAmount(monthlyPace)}
            note={t('goals.strip.monthlyPaceNote')}
          />
        </div>
      </div>
    </section>
  )
}

function SummaryMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border-l border-white/10 pl-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className="money-number mt-3 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-white/30">{note}</p>
    </div>
  )
}
