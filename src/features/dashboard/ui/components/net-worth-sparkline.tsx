import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

import {
  snapshotTotal,
  type AssetSnapshotPoint,
} from '@/features/assets/model/assets'
import { formatVndShort } from '@/shared/lib/format-money'

type NetWorthSparklineProps = {
  snapshots: AssetSnapshotPoint[]
}

function formatMonth(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
  })
}

/**
 * A calm, single-series preview of total net worth over the recent months.
 *
 * This is the Home-page density of the richer stacked `AssetTrendChart` on the
 * assets page: one area, no legend (the section title names it), a recessive
 * baseline month axis and a light tooltip — enough to answer "which way is the
 * total moving?" at a glance without pulling the eye into detail.
 */
export function NetWorthSparkline({ snapshots }: NetWorthSparklineProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'vi'

  const data = useMemo(
    () =>
      snapshots.map((point) => ({
        month: formatMonth(point.date, locale),
        total: snapshotTotal(point),
      })),
    [snapshots, locale],
  )

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="fill-net-worth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.18} />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            dy={4}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <Tooltip
            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as (typeof data)[number]
              return (
                <div className="rounded-[14px] border border-border bg-card px-3 py-2 text-sm shadow-md">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-muted-foreground">
                      {t('dashboard.sections.money.assets')}
                    </span>
                    <span className="money-number font-semibold text-foreground">
                      {formatVndShort(point.total)}
                    </span>
                  </div>
                </div>
              )
            }}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            fill="url(#fill-net-worth)"
            isAnimationActive={false}
            activeDot={{
              r: 4,
              stroke: 'hsl(var(--card))',
              strokeWidth: 2,
              fill: 'hsl(var(--accent))',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
