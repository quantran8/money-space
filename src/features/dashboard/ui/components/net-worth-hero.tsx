import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { DashboardOverview } from '@/features/dashboard/api/dashboard.repository'
import { formatVndShort } from '@/shared/lib/format-money'

type NetWorthHeroProps = {
  snapshot: DashboardOverview
  statusLabel: string
  statusLineKey: string
  updatedAtLabel: string
  upcomingCount: number
  discussCount: number
}

/**
 * Dashboard hero (mockup `#overview`): a two-column focal surface — a dark
 * signature panel with the headline "money available now", beside a lighter
 * supporting overview with three key metrics and a calm assurance note.
 * Colors are mapped onto the app design-system tokens (hsl var), not raw hex.
 */
export function NetWorthHero({
  snapshot,
  statusLabel,
  statusLineKey,
  updatedAtLabel,
  upcomingCount,
  discussCount,
}: NetWorthHeroProps) {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="overview-title"
      className="overflow-hidden rounded-[30px] bg-card p-3 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-4"
    >
      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        {/* Signature focal surface */}
        <div className="relative overflow-hidden rounded-[24px] bg-[hsl(var(--foreground))] p-6 text-[hsl(var(--background))] sm:p-7 lg:min-h-[410px]">
          <div
            className="absolute -right-16 -top-20 size-56 rounded-full bg-white/[0.055]"
            aria-hidden
          />
          <div
            className="absolute -bottom-24 -left-20 size-64 rounded-full border border-white/10"
            aria-hidden
          />

          <div className="relative flex h-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-white/10 px-3 text-xs font-semibold">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--status-green))' }}
                />
                {statusLabel}
              </span>
              <span className="text-xs text-white/55">{updatedAtLabel}</span>
            </div>

            <div className="my-auto py-10">
              <p className="text-sm font-medium text-white/60">{t('dashboard.hero.liquidLabel')}</p>
              <p className="money-number mt-3 text-[clamp(3.4rem,8vw,6.4rem)] font-semibold leading-[0.9]">
                {formatVndShort(snapshot.liquid)}
                <span className="ml-2 text-[0.36em] tracking-normal text-white/55">đ</span>
              </p>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/65 sm:text-[15px]">
                {t('dashboard.hero.liquidCaption')}
              </p>
            </div>

            <Link
              to="/events"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--background))] px-5 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:opacity-90 sm:w-fit"
            >
              <RefreshCw className="size-4" strokeWidth={1.9} />
              {t('dashboard.heroButton')}
            </Link>
          </div>
        </div>

        {/* Supporting overview */}
        <div className="flex flex-col p-2 sm:p-3 lg:p-5">
          <div>
            <p className="text-sm font-medium text-[hsl(var(--status-green))]">
              {t('dashboard.hero.overviewEyebrow')}
            </p>
            <h1
              id="overview-title"
              className="page-title mt-3 max-w-xl text-4xl font-semibold leading-[1.04] sm:text-5xl"
            >
              {t('dashboard.hero.overviewTitle')}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-[15px]">
              {t('dashboard.hero.overviewSubtitle')}
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl bg-[hsl(var(--muted))]">
            <div className="grid sm:grid-cols-3 sm:divide-x sm:divide-[hsl(var(--border))]">
              <div className="border-b border-border px-4 py-5 sm:border-b-0">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('dashboard.hero.netWorthMetric')}
                </p>
                <p className="money-number mt-2 text-2xl font-semibold">
                  {formatVndShort(snapshot.netWorth)} đ
                </p>
              </div>
              <div className="border-b border-border px-4 py-5 sm:border-b-0">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('dashboard.hero.upcomingMetric')}
                </p>
                <p className="money-number mt-2 text-2xl font-semibold">
                  {t('dashboard.metrics.paymentsCount', { count: upcomingCount })}
                </p>
              </div>
              <div className="px-4 py-5">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('dashboard.hero.discussMetric')}
                </p>
                <p className="money-number mt-2 text-2xl font-semibold">
                  {t('dashboard.metrics.attentionCount', { count: discussCount })}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-7">
            <div className="flex items-start gap-3 rounded-2xl bg-[hsla(var(--status-green),0.06)] p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-[hsl(var(--status-green))] shadow-sm">
                <ShieldCheck className="size-[18px]" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm font-semibold">{t(statusLineKey)}</p>
                <p className="mt-1 text-sm leading-5 text-[hsl(var(--muted-foreground))]">
                  {t('dashboard.hero.assuranceLine')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
