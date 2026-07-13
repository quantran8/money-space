import { ArrowRight, ChevronRight, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { GoalItem } from '@/features/goals/model/goals.types'
import { formatVndShort } from '@/shared/lib/format-money'

type LongTermGoalSectionProps = {
  mainGoal: GoalItem | undefined
  remaining: number
}

/**
 * "Kế hoạch dài hạn" (mockup `#plan`): a cool-toned primary-goal card with a
 * progress bar, beside a supporting column showing the remaining amount and the
 * suggested next step.
 */
export function LongTermGoalSection({ mainGoal, remaining }: LongTermGoalSectionProps) {
  const { t } = useTranslation()
  const progress = mainGoal?.progress ?? 0
  const target = mainGoal?.targetAmount ?? 0
  const current = mainGoal?.currentAmount ?? 0

  return (
    <section aria-labelledby="plan-title">
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--accent))]">
            {t('dashboard.sections.longTerm.eyebrow')}
          </p>
          <h2 id="plan-title" className="section-title mt-2 text-2xl font-semibold sm:text-3xl">
            {t('dashboard.sections.longTerm.title')}
          </h2>
          <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">
            {t('dashboard.sections.longTerm.subtitle')}
          </p>
        </div>
        <Link
          to="/goals"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-medium text-[hsl(var(--accent))] transition hover:bg-[hsla(var(--accent),0.06)]"
        >
          {t('common.view')}
          <ChevronRight className="size-4" strokeWidth={1.8} />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        {/* Primary goal */}
        <div className="rounded-[26px] bg-[hsla(var(--accent),0.08)] p-5 shadow-[0_8px_26px_rgba(0,0,0,0.045)] sm:p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--accent))]">
                <Target className="size-4" strokeWidth={1.8} />
                {t('dashboard.sections.longTerm.mainGoal')}
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">
                {mainGoal?.name ?? t('dashboard.sections.longTerm.noGoal')}
              </h3>
            </div>
            <p
              className="money-number text-5xl font-semibold text-[hsl(var(--accent))]"
              aria-label={t('dashboard.sections.longTerm.progressLabel', { value: progress })}
            >
              {progress}%
            </p>
          </div>

          <div
            className="mt-10 h-2.5 overflow-hidden rounded-full bg-card"
            role="progressbar"
            aria-label={mainGoal?.name ?? t('dashboard.sections.longTerm.noGoal')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-[hsl(var(--accent))]"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">
              {t('dashboard.sections.longTerm.have', { value: formatVndShort(current) })}
            </span>
            <span className="font-medium">
              {t('dashboard.sections.longTerm.target', { value: formatVndShort(target) })}
            </span>
          </div>
        </div>

        {/* Supporting column */}
        <div className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-[26px] bg-card">
          <div className="p-5">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('dashboard.sections.longTerm.remaining')}
            </p>
            <p className="money-number mt-2 text-3xl font-semibold">
              {formatVndShort(remaining)} đ
            </p>
          </div>
          <div className="p-5">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('dashboard.sections.longTerm.nextStep')}
            </p>
            <p className="mt-2 text-[15px] font-semibold">
              {t('dashboard.sections.longTerm.nextStepValue')}
            </p>
            <Link
              to="/goals"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[hsl(var(--foreground))] px-4 text-sm font-semibold text-[hsl(var(--background))] transition hover:opacity-90"
            >
              {t('dashboard.sections.longTerm.start')}
              <ArrowRight className="size-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
