import { Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/ui/empty-state'
import { MoneyCompositionRing } from '@/components/ui/money-composition-ring'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import type { AssetGoalClaim } from '@money-space/core/features/goals/api/goals.repository'
import { useAssetGoalUsage } from '@money-space/core/features/goals/hooks/use-asset-goal-usage'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

const TICK_BACKGROUND =
  'repeating-linear-gradient(to right, currentColor 0 2px, transparent 2px 6px)'

/** Asset-level allocation followed by each goal's contribution plan. */
export function AssetGoalUsageSection({ assetId }: { assetId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, assetValue, committedAmount, unassignedAmount, isLoading } =
    useAssetGoalUsage(assetId)

  if (isLoading) {
    return (
      <Panel>
        <PanelHeader title={t('assets.detail.goals.sectionTitle')} />
        <Skeleton className="s-head-body h-80 w-full rounded-control" />
      </Panel>
    )
  }

  const isOverdrawn = assetValue < 0
  const share = (value: number) =>
    assetValue > 0 ? (Math.max(value, 0) / assetValue) * 100 : 0
  const freePercent = Math.round(share(unassignedAmount))

  return (
    <Panel>
      <PanelHeader
        title={t('assets.detail.goals.sectionTitle')}
        meta={t('assets.detail.goals.goalCount', { count: items.length })}
      />

      <div className="s-head-body grid items-center gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
        <div className="flex justify-center lg:justify-start">
          {isOverdrawn ? (
            <div className="flex size-[152px] items-center justify-center rounded-full border-[18px] border-committed text-center md:size-[180px]">
              <div>
                <p className="t-body-sm text-ink2">
                  {t('assets.detail.goals.ratioUnavailable')}
                </p>
                <p className="mt-1 t-caption text-ink3">
                  {t('assets.detail.goals.ratioUnavailableSub')}
                </p>
              </div>
            </div>
          ) : (
            <MoneyCompositionRing
              className="shrink-0 sm:grid-cols-1"
              segments={[
                {
                  key: 'free',
                  label: t('assets.detail.goals.allocationFree'),
                  amount: unassignedAmount,
                  percent: freePercent,
                  percentLabel: `${freePercent}%`,
                  tone: 'flexible',
                },
                {
                  key: 'committed',
                  label: t('assets.detail.goals.allocationCommitted'),
                  amount: committedAmount,
                  percent: Math.round(share(committedAmount)),
                  tone: 'committed',
                },
              ]}
              ariaLabel={t('assets.detail.goals.aria', {
                claimed: formatVndShort(committedAmount),
                free: formatVndShort(unassignedAmount),
              })}
              centerLabel={t('assets.detail.goals.ringCenter')}
              formatAmount={formatVndShort}
              legend={false}
            />
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <AllocationMetric
            label={t('assets.detail.goals.allocationFree')}
            value={formatVndShort(unassignedAmount)}
            tone="data"
          />
          <AllocationMetric
            className="border-t border-divider pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0"
            label={t('assets.detail.goals.allocationCommitted')}
            value={formatVndShort(committedAmount)}
            tone="committed"
          />
        </div>
      </div>

      {isOverdrawn ? (
        <div className="mt-7 border-t border-divider pt-4">
          <p className="t-body-sm text-attention-ink">
            {t('assets.detail.goals.overdrawnWarning', {
              value: formatVndShort(Math.abs(assetValue)),
            })}
          </p>
        </div>
      ) : null}

      <div className="mt-7 border-t border-divider pt-7">
        <h3 className="t-subtitle">{t('assets.detail.goals.panelTitle')}</h3>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Target} className="mt-5">
          {t('assets.detail.goals.empty')}
        </EmptyState>
      ) : (
        <ul className="mt-7">
          {items.map((item, index) => (
            <li
              key={item.allocationId}
              className={cn(
                'py-5 first:pt-0 last:pb-0 md:py-6',
                index > 0 && 'border-t border-divider',
              )}
            >
              <GoalContribution
                item={item}
                onOpen={() => navigate(`/goals/${item.goalId}`)}
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function AllocationMetric({
  label,
  value,
  tone,
  className,
}: {
  label: string
  value: string
  tone: 'data' | 'committed'
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'size-2.5 rounded-full',
            tone === 'data' ? 'bg-data-primary' : 'bg-committed',
          )}
          aria-hidden
        />
        <span className="t-body-sm text-ink2">{label}</span>
      </div>
      <p className="num mt-2 t-metric">{value}</p>
    </div>
  )
}

function GoalContribution({ item, onOpen }: { item: AssetGoalClaim; onOpen: () => void }) {
  const { t } = useTranslation()
  const contributedThisMonth = Math.max(item.countedValue - item.currentValue, 0)
  const monthlyPlan = Math.max(item.monthlyContribution ?? 0, 0)
  const progress =
    monthlyPlan > 0 ? Math.min((contributedThisMonth / monthlyPlan) * 100, 100) : 0
  const remaining = Math.max(monthlyPlan - contributedThisMonth, 0)
  const progressLabel = Math.round(progress)

  return (
    <div>
      <div className="flex items-start justify-between gap-5">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 items-center gap-4 rounded-control text-left outline-none focus-visible:ring-2 focus-visible:ring-action"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-wash text-data-primary">
            <Target className="size-5" strokeWidth={1.7} aria-hidden />
          </span>
          <span className="truncate t-subtitle">{item.goalName}</span>
        </button>

        <div className="shrink-0 text-right">
          <p className="t-caption text-ink3">{t('assets.detail.goals.totalHeld')}</p>
          <p className="num mt-1 t-metric">{formatVndShort(item.countedValue)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[.8fr_.8fr_1.4fr]">
        <GoalMetric
          label={t('assets.detail.goals.initial')}
          value={formatVndShort(item.currentValue)}
        />
        <GoalMetric
          className="border-t border-divider pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0"
          label={t('assets.detail.goals.monthlyPlan')}
          value={formatVndShort(monthlyPlan)}
        />

        <div className="border-t border-divider pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="t-caption text-ink3">{t('assets.detail.goals.thisMonth')}</p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="num t-subhead">{formatVndShort(contributedThisMonth)}</span>
                <span className="num t-caption text-ink3">/ {formatVndShort(monthlyPlan)}</span>
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="num t-body-sm">{progressLabel}%</p>
              <p className="num mt-1 t-caption text-ink3">
                {remaining > 0
                  ? t('assets.detail.goals.remainingContribution', {
                      value: formatVndShort(remaining),
                    })
                  : t('assets.detail.goals.planComplete')}
              </p>
            </div>
          </div>

          <div
            className="relative mt-3 h-3.5 w-[220px] max-w-full overflow-hidden"
            role="progressbar"
            aria-label={t('assets.detail.goals.monthlyProgress')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressLabel}
          >
            <span
              className="absolute inset-0 text-committed"
              style={{ backgroundImage: TICK_BACKGROUND }}
            />
            <span
              className="absolute inset-y-0 left-0 text-data-primary"
              style={{ width: `${progress}%`, backgroundImage: TICK_BACKGROUND }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function GoalMetric({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="t-caption text-ink3">{label}</p>
      <p className="num mt-1 t-subhead">{value}</p>
    </div>
  )
}
