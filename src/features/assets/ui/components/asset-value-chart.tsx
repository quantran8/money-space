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
  chartAxis,
  chartGrid,
  chartSeparator,
  liquidityColors,
} from '@/shared/constants/colors'
import { formatVndShort } from '@/shared/lib/format-money'
import type { AssetLiquidity } from '@/features/assets/model/assets'
import type { AssetValuePoint } from '@/features/assets/hooks/use-asset-detail'

type AssetValueChartProps = {
  points: AssetValuePoint[]
  liquidity: AssetLiquidity
}

function formatDay(date: string, locale: string) {
  const parsed = new Date(date)
  return parsed.toLocaleDateString(locale.startsWith('vi') ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: 'short',
  })
}

export function AssetValueChart({ points, liquidity }: AssetValueChartProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? 'vi'
  const color = liquidityColors[liquidity]

  const data = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        day: formatDay(point.isoDate, locale),
      })),
    [points, locale],
  )

  if (data.length < 2) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-ink2">
        {t('assets.detail.chart.empty')}
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="fill-asset-value" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke={chartGrid} strokeWidth={1} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: chartAxis }}
            dy={6}
          />
          <YAxis
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: chartAxis }}
            tickFormatter={(value: number) => formatVndShort(value)}
          />
          <Tooltip
            cursor={{ stroke: chartGrid, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as (typeof data)[number]
              return (
                <div className="rounded-panel bg-panel px-3 py-2 text-sm">
                  <p className="mb-1.5 text-xs font-medium text-ink2">{label}</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-ink2">
                      {t('assets.detail.chart.value')}
                    </span>
                    <span className="money-number text-ink">
                      {formatVndShort(point.value)}
                    </span>
                  </div>
                </div>
              )
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#fill-asset-value)"
            isAnimationActive={false}
            activeDot={{
              r: 4,
              stroke: chartSeparator,
              strokeWidth: 2,
              fill: color,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
