import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  snapshotTotal,
  type AssetSnapshotPoint,
} from '@/features/assets/model/assets'
import { formatVndShort } from '@/shared/lib/format-money'

type AssetTrendChartProps = {
  snapshots: AssetSnapshotPoint[]
}

function formatMonth(date: string, locale: string) {
  const parsed = new Date(date)
  return parsed.toLocaleDateString(locale.startsWith('vi') ? 'vi-VN' : 'en-US', {
    month: 'short',
  })
}

export function AssetTrendChart({ snapshots }: AssetTrendChartProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'vi'

  const data = useMemo(
    () =>
      snapshots.map((point) => ({
        ...point,
        month: formatMonth(point.date, locale),
        total: snapshotTotal(point),
      })),
    [snapshots, locale],
  )

  const first = data[0]?.total ?? 0
  const current = data[data.length - 1]?.total ?? 0
  const growth = first > 0 ? ((current - first) / first) * 100 : 0

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        {t('assets.charts.emptySnapshots')}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{t('assets.charts.current')}</p>
          <p className="money-number mt-1 text-2xl font-semibold">{formatVndShort(current)}</p>
        </div>
        <p
          className={
            growth >= 0
              ? 'text-sm font-medium text-[hsl(var(--status-green))]'
              : 'text-sm font-medium text-[hsl(var(--status-red))]'
          }
        >
          {growth >= 0 ? '+' : ''}
          {growth.toLocaleString(locale.startsWith('vi') ? 'vi-VN' : 'en-US', {
            maximumFractionDigits: 1,
          })}
          %
        </p>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="asset-total-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.18} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              dy={6}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value: number) => formatVndShort(value)}
            />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const point = payload[0].payload as (typeof data)[number]
                return (
                  <div className="rounded-[14px] border border-border bg-card px-3 py-2 text-sm shadow-md">
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
                    <div className="mb-1.5 flex items-center justify-between gap-4">
                      <span className="text-xs text-muted-foreground">
                        {t('assets.summary.total')}
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
              strokeWidth={3}
              fill="url(#asset-total-fill)"
              isAnimationActive={false}
              activeDot={{
                r: 5,
                stroke: 'hsl(var(--card))',
                strokeWidth: 3,
                fill: 'hsl(var(--accent))',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>{t('assets.charts.initialSnapshot', { value: formatVndShort(first) })}</span>
        <span>{t('assets.charts.snapshotCount', { count: data.length })}</span>
      </div>
    </div>
  )
}
