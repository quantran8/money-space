import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'
import type { ForecastResult } from '@/features/forecast/model/forecast.types'
import {
  BALANCE_TONE_CLASS,
  balanceTone,
} from '@/features/forecast/model/forecast-presentation'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

/**
 * Home section 4 — 30 Days Ahead. A compressed read of the forecast that links
 * through to `/upcoming` for the day-by-day view.
 */
export function DaysAheadSection({
  forecast,
  isLoading,
}: {
  forecast?: ForecastResult
  isLoading?: boolean
}) {
  const { t } = useTranslation()

  if (isLoading || !forecast) {
    return (
      <Card>
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      </Card>
    )
  }

  const lowestTone = balanceTone(
    forecast.lowestProjectedBalance,
    forecast.protectedReserveAmount,
  )

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title text-xl font-semibold">
          {t('home.daysAhead.title', { count: forecast.horizonDays })}
        </h2>
        <Link
          to="/upcoming"
          className="flex items-center gap-1 text-sm font-medium text-[hsl(var(--muted-foreground))] transition hover:text-foreground"
        >
          {t('home.daysAhead.viewAll')}
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Tile
          label={t('home.daysAhead.incoming')}
          value={formatVndShort(forecast.totals.upcomingIncomeAmount)}
        />
        <Tile
          label={t('home.daysAhead.outgoing')}
          value={formatVndShort(forecast.totals.upcomingOutgoingAmount)}
        />
        <Tile
          label={t('home.daysAhead.lowest')}
          // Never clamped.
          value={formatVndShort(forecast.lowestProjectedBalance)}
          valueClassName={BALANCE_TONE_CLASS[lowestTone]}
        />
      </div>
    </Card>
  )
}

function Tile({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="surface-muted rounded-3xl p-4">
      <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className={cn('money-number mt-2 text-2xl font-semibold', valueClassName)}>
        {value}
      </p>
    </div>
  )
}
