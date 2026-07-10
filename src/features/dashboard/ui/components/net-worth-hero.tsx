import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { DashboardOverview } from '@/features/dashboard/api/dashboard.repository'
import type { NetWorthBreakdownItem } from '@/features/dashboard/model/dashboard'
import { NetWorthSparkline } from '@/features/dashboard/ui/components/net-worth-sparkline'
import type { AssetSnapshotPoint } from '@/features/assets/model/assets'
import { cn } from '@/shared/lib/utils'

type NetWorthHeroProps = {
  snapshot: DashboardOverview
  statusKey: string
  statusLineKey: string
  statusLabel: string
  updatedAtLabel: string
  breakdown: NetWorthBreakdownItem[]
  assetTrend: AssetSnapshotPoint[]
}

export function NetWorthHero({
  snapshot,
  statusKey,
  statusLineKey,
  statusLabel,
  updatedAtLabel,
  breakdown,
  assetTrend,
}: NetWorthHeroProps) {
  const { t } = useTranslation()

  return (
    <Card className="apple-shadow overflow-hidden rounded-[28px] p-5 md:p-7">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Left: total net worth and supporting metrics grouped together
            so the headline and its breakdown read as one block. */}
        <div className="flex min-w-0 flex-1 flex-col lg:col-span-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                statusKey === 'dashboard.status.stable' &&
                  'bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]',
                statusKey === 'dashboard.status.attention' &&
                  'bg-[hsla(var(--status-orange),0.12)] text-[hsl(var(--status-orange))]',
                statusKey === 'dashboard.status.tense' &&
                  'bg-[hsla(var(--status-red),0.1)] text-[hsl(var(--status-red))]',
              )}
            >
              {statusLabel}
            </Badge>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">{updatedAtLabel}</span>
          </div>

          <p className="mt-4 text-sm font-medium text-[hsl(var(--muted-foreground))]">
            {t('dashboard.hero.netWorthLabel')}
          </p>
          <p className="money-number mt-2 text-5xl leading-none md:text-6xl">
            {snapshot.netWorthDisplay}
            <span className="ml-2 align-baseline text-2xl text-[hsl(var(--muted-foreground))] md:text-3xl">
              đ
            </span>
          </p>
          <p className="mt-3 max-w-md text-sm md:text-base text-[hsl(var(--muted-foreground))]">
            {t(statusLineKey)}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/assets"
              className="divide-y divide-[hsl(var(--border))] overflow-hidden rounded-[24px] bg-[hsl(var(--muted))]"
            >
              {breakdown.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">{item.label}</span>
                  <strong className="money-number text-lg">{item.value} đ</strong>
                </div>
              ))}
            </Link>

            <Link
              to="/events"
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full bg-[hsl(var(--primary))] px-5 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-4" strokeWidth={1.8} />
              {t('dashboard.heroButton')}
            </Link>
          </div>
        </div>

        {/* Right: trend chart gets its own column so it reads as the
            visual companion to the headline block on larger screens. */}
        <div className="flex min-h-[190px] flex-col rounded-[24px] bg-[hsl(var(--muted))] p-4 md:p-5 lg:col-span-8">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            {t('dashboard.sections.money.trend')}
          </p>
          <div className="mt-3 flex flex-1 items-center">
            <NetWorthSparkline snapshots={assetTrend} />
          </div>
        </div>
      </div>
    </Card>
  )
}
