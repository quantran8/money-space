import { ChevronRight, Landmark, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { DashboardOverview } from '@/features/dashboard/api/dashboard.repository'
import { formatVndShort } from '@/shared/lib/format-money'

type MoneySectionProps = {
  snapshot: DashboardOverview
  /** Total assets (net worth + debt) and open-debt count for the right card. */
  totalAssets: number
  longTermValue: number
  debtCount: number
}

/**
 * "Tiền nhà mình" (mockup `#money`): two side-by-side cards that keep the
 * liquidity picture and the longer assets/debt picture visually separate.
 */
export function MoneySection({
  snapshot,
  totalAssets,
  longTermValue,
  debtCount,
}: MoneySectionProps) {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="money-title">
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
            {t('dashboard.sections.money.eyebrow')}
          </p>
          <h2 id="money-title" className="section-title mt-2 text-2xl font-semibold sm:text-3xl">
            {t('dashboard.sections.money.title')}
          </h2>
          <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">
            {t('dashboard.sections.money.subtitle')}
          </p>
        </div>
        <Link
          to="/assets"
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-medium text-[hsl(var(--accent))] transition hover:bg-[hsla(var(--accent),0.06)]"
        >
          {t('common.view')}
          <ChevronRight className="size-4" strokeWidth={1.8} />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        {/* Liquidity */}
        <div className="rounded-[24px] bg-card p-5 shadow-[0_8px_26px_rgba(0,0,0,0.045)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[hsla(var(--accent),0.1)] text-[hsl(var(--accent))]">
              <Wallet className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {t('dashboard.sections.money.liquidity')}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {t('dashboard.sections.money.liquidityCaption')}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 divide-x divide-[hsl(var(--border))]">
            <div className="pr-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('dashboard.sections.money.liquid')}
              </p>
              <p className="money-number mt-2 text-3xl font-semibold">
                {formatVndShort(snapshot.liquid)} đ
              </p>
              <p className="mt-2 text-xs leading-5 text-[hsl(var(--status-green))]">
                {t('dashboard.sections.money.liquidPositive')}
              </p>
            </div>
            <div className="pl-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('dashboard.sections.money.reserve')}
              </p>
              <p className="money-number mt-2 text-3xl font-semibold">
                {formatVndShort(snapshot.savings)} đ
              </p>
              <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                {snapshot.savings > 0
                  ? t('assets.strip.reserve')
                  : t('dashboard.sections.money.reserveEmpty')}
              </p>
            </div>
          </div>
        </div>

        {/* Assets & debt */}
        <div className="rounded-[24px] bg-card p-5 shadow-[0_8px_26px_rgba(0,0,0,0.045)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <Landmark className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {t('dashboard.sections.money.assetsDebt')}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {t('dashboard.sections.money.assetsDebtCaption')}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 divide-x divide-[hsl(var(--border))]">
            <div className="pr-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('dashboard.sections.money.totalAssets')}
              </p>
              <p className="money-number mt-2 text-3xl font-semibold">
                {formatVndShort(totalAssets)} đ
              </p>
              <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                {t('dashboard.sections.money.longTermCaption', {
                  value: formatVndShort(longTermValue),
                })}
              </p>
            </div>
            <div className="pl-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('dashboard.sections.money.debt')}
              </p>
              <p className="money-number mt-2 text-3xl font-semibold">
                {formatVndShort(snapshot.debt)} đ
              </p>
              <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                {t('dashboard.sections.money.debtCount', { count: debtCount })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
