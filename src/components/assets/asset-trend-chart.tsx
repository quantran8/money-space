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
  formatVndShort,
  liquidityColors,
  liquidityOrder,
  snapshotTotal,
  type AssetLiquidity,
  type AssetSnapshotPoint,
} from '@/lib/assets'

type AssetTrendChartProps = {
  snapshots: AssetSnapshotPoint[]
}

function formatMonth(date: string, locale: string) {
  const parsed = new Date(date)
  return parsed.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
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

  const series = liquidityOrder.map((liquidity) => ({
    key: liquidity,
    label: t(`options.liquidity.${liquidity}`),
    color: liquidityColors[liquidity],
  }))

  return (
    <div className="space-y-3">
      {/* Legend — always present for ≥2 series */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-4 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <defs>
              {series.map((s) => (
                <linearGradient
                  key={s.key}
                  id={`fill-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
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
                    {series.map((s) => (
                      <div key={s.key} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className="h-1.5 w-3 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.label}
                        </span>
                        <span className="money-number text-xs text-foreground">
                          {formatVndShort(point[s.key as AssetLiquidity])}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />

            {/* Stacked in liquidity order; 2px surface stroke separates fills */}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stackId="assets"
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                isAnimationActive={false}
                activeDot={{
                  r: 4,
                  stroke: 'hsl(var(--card))',
                  strokeWidth: 2,
                  fill: s.color,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
