import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import {
  formatVndShort,
  liquidityColors,
  liquidityOrder,
  type AssetLiquidity,
} from '@/lib/assets'

type AssetCompositionChartProps = {
  /** Total value per liquidity bucket, in VND. */
  totals: Record<AssetLiquidity, number>
}

type Slice = {
  liquidity: AssetLiquidity
  label: string
  value: number
  color: string
}

export function AssetCompositionChart({ totals }: AssetCompositionChartProps) {
  const { t } = useTranslation()

  const slices = useMemo<Slice[]>(
    () =>
      liquidityOrder
        .map((liquidity) => ({
          liquidity,
          label: t(`options.liquidity.${liquidity}`),
          value: totals[liquidity],
          color: liquidityColors[liquidity],
        }))
        .filter((slice) => slice.value > 0),
    [totals, t],
  )

  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  if (total <= 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        {t('assets.charts.empty')}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative h-[240px] w-full sm:w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius={70}
              outerRadius={100}
              // 2px surface gap between adjacent segments (dataviz spacer rule).
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.liquidity} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const slice = payload[0].payload as Slice
                const share = Math.round((slice.value / total) * 100)
                return (
                  <div className="rounded-[14px] border border-border bg-card px-3 py-2 text-sm shadow-md">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-medium text-foreground">{slice.label}</span>
                    </div>
                    <p className="money-number mt-1 text-foreground">
                      {formatVndShort(slice.value)} · {share}%
                    </p>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Hero total in the donut hole */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">{t('assets.summary.total')}</span>
          <span className="money-number text-2xl font-semibold text-foreground">
            {formatVndShort(total)}
          </span>
        </div>
      </div>

      {/* Legend + direct labels (identity never color-alone) */}
      <ul className="flex-1 space-y-2">
        {slices.map((slice) => {
          const share = Math.round((slice.value / total) * 100)
          return (
            <li key={slice.liquidity} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="money-number text-sm font-medium text-foreground">
                  {formatVndShort(slice.value)}
                </span>
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                  {share}%
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
