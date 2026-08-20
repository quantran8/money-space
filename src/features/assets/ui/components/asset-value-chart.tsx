import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
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

/**
 * A moment where the household changed what it HOLDS, as opposed to the market
 * changing what the holding is worth.
 *
 * The line alone cannot tell those two apart — a step up looks identical whether
 * gold rose or two more chỉ were bought — and reading a purchase as a price rally
 * is exactly the misreading this page must not invite.
 */
export type AssetValueMarker = {
  isoDate: string
  label: string
}

type AssetValueChartProps = {
  points: AssetValuePoint[]
  liquidity: AssetLiquidity
  /** Quantity/holding changes to call out on the line. */
  markers?: AssetValueMarker[]
}

function formatDay(date: string, locale: string) {
  const parsed = new Date(date)
  return parsed.toLocaleDateString(locale.startsWith('vi') ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
  })
}

export function AssetValueChart({ points, liquidity, markers = [] }: AssetValueChartProps) {
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

  /**
   * Snap each marker to the plotted point it belongs to. A marker whose date
   * falls outside the visible range has nowhere to sit, so it is dropped rather
   * than clamped onto an edge it did not happen at.
   */
  const plottedMarkers = useMemo(() => {
    if (data.length === 0) return []
    return markers
      .map((marker) => {
        const match = data.find((point) => point.isoDate >= marker.isoDate)
        return match ? { ...marker, day: match.day, value: match.value } : null
      })
      .filter((marker): marker is AssetValueMarker & { day: string; value: number } =>
        marker !== null,
      )
  }, [data, markers])

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
        <AreaChart data={data} margin={{ top: 20, right: 12, bottom: 0, left: 4 }}>
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
            tick={{ fontSize: 11, fill: chartAxis }}
            dy={6}
            minTickGap={24}
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
              const marker = plottedMarkers.find((item) => item.day === label)
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
                  {marker ? (
                    <p className="mt-1.5 text-xs text-ink2">{marker.label}</p>
                  ) : null}
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

          {/* Hollow, ink3-stroked, and labelled — deliberately NOT in the
              accent, so a holding change never reads as part of the value line
              it interrupts. */}
          {plottedMarkers.map((marker) => (
            <ReferenceDot
              key={`${marker.isoDate}-${marker.label}`}
              x={marker.day}
              y={marker.value}
              r={4}
              fill="var(--panel)"
              stroke={chartAxis}
              strokeWidth={2}
              label={{
                value: marker.label,
                position: 'top',
                offset: 10,
                fontSize: 10,
                fill: 'var(--ink2)',
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
