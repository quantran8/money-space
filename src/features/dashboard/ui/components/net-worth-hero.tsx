import { useTranslation } from 'react-i18next'

import type { DashboardOverview } from '@/features/dashboard/api/dashboard.repository'
import type { StatusVariant } from '@/features/dashboard/model/dashboard'
import { formatCompactMillions } from '@/features/dashboard/model/dashboard'
import { formatVndShort } from '@/shared/lib/format-money'

type NetWorthHeroProps = {
  snapshot: DashboardOverview
  statusVariant: StatusVariant
  totalAssets: number
  availableNow: number
  availableRemaining: number
  availableUsedRatio: number
  upcomingTotalVnd: number
  reserveMonthsLabel: string | null
  reserveGood: boolean
}

/** Whole-million figure, no unit — e.g. 620_000_000 → "620". */
function millions(value: number) {
  return String(Math.round(value / 1_000_000))
}

/**
 * Net-worth summary (mockup `#overview`): a dark focal panel with the household
 * net worth plus total-assets / debt tiles, beside a lighter "Tiền sẵn có" card
 * with a usage bar and the emergency-fund read. Colors map onto the app's
 * design-system tokens, not raw hex.
 */
export function NetWorthHero({
  snapshot,
  statusVariant,
  totalAssets,
  availableNow,
  availableRemaining,
  availableUsedRatio,
  upcomingTotalVnd,
  reserveMonthsLabel,
  reserveGood,
}: NetWorthHeroProps) {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="overview-title" className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
      {/* Net-worth focal panel */}
      <div className="rounded-[28px] bg-[hsl(var(--foreground))] p-6 text-[hsl(var(--background))] apple-shadow sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/45">
              {t('dashboard.redesign.netWorthLabel')}
            </p>
            <div className="mt-3 flex items-end gap-3">
              <span
                id="overview-title"
                className="money-number text-5xl leading-none sm:text-6xl"
              >
                {millions(snapshot.netWorth)}
              </span>
              <span className="pb-1 text-xl text-white/45">
                {t('dashboard.redesign.netWorthUnit')}
              </span>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/65">
            {t(`dashboard.redesign.netWorthStatus.${statusVariant}`)}
          </span>
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-6 text-white/50">
          {t('dashboard.redesign.netWorthNote', {
            amount: formatVndShort(availableRemaining),
          })}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-white/40">{t('dashboard.redesign.totalAssets')}</p>
            <p className="money-number mt-2 text-xl">{formatVndShort(totalAssets)} đ</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-white/40">{t('dashboard.redesign.debt')}</p>
            <p className="money-number mt-2 text-xl">{formatVndShort(snapshot.debt)} đ</p>
          </div>
        </div>
      </div>

      {/* Tiền sẵn có */}
      <div className="rounded-[28px] border border-border bg-card p-6 apple-shadow-soft sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('dashboard.redesign.available.label')}
            </p>
            <p className="money-number mt-3 text-4xl">{formatVndShort(availableNow)} đ</p>
          </div>
          <div className="rounded-xl bg-[hsl(var(--muted))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {t('dashboard.redesign.available.thisMonth')}
          </div>
        </div>

        <div
          className="mt-8 h-2 rounded-full bg-[hsl(var(--muted))]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={availableUsedRatio}
          aria-label={t('dashboard.redesign.available.label')}
        >
          <div
            className="h-2 rounded-full bg-[hsl(var(--accent))]"
            style={{ width: `${availableUsedRatio}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {t('dashboard.redesign.available.due')}
            </p>
            <p className="money-number mt-1 text-base">{formatCompactMillions(upcomingTotalVnd / 1_000_000)} đ</p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {t('dashboard.redesign.available.remaining')}
            </p>
            <p className="money-number mt-1 text-base">{formatVndShort(availableRemaining)} đ</p>
          </div>
        </div>

        {reserveMonthsLabel ? (
          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t('dashboard.redesign.reserve.title')}</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {t('dashboard.redesign.reserve.months', { months: reserveMonthsLabel })}
                </p>
              </div>
              <span
                className={
                  reserveGood
                    ? 'text-sm font-medium text-[hsl(var(--status-green))]'
                    : 'text-sm font-medium text-[hsl(var(--status-orange))]'
                }
              >
                {reserveGood
                  ? t('dashboard.redesign.reserve.good')
                  : t('dashboard.redesign.reserve.low')}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
