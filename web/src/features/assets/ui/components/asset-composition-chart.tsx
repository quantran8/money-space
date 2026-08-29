import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { liquidityOrder, type AssetLiquidity } from '@money-space/core/features/assets/model/assets'
import { liquidityColors } from '@money-space/core/shared/constants/colors'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

type AssetCompositionChartProps = {
  /** Total value per liquidity bucket, in VND. */
  totals: Record<AssetLiquidity, number>
  /**
   * Fill per bucket, for the arc and its legend swatch alike.
   *
   * Defaults to `liquidityColors` so existing call sites keep the palette they
   * had. Pass `liquidityRampColors` for the single-hue ramp, or any other
   * complete set — the component never reaches for a colour of its own, so a
   * caller that supplies this owns the whole encoding.
   */
  colors?: Record<AssetLiquidity, string>
}

type Slice = {
  liquidity: AssetLiquidity
  label: string
  value: number
  color: string
}

export function AssetCompositionChart({
  totals,
  colors = liquidityColors,
}: AssetCompositionChartProps) {
  const { t } = useTranslation()

  const slices = useMemo<Slice[]>(
    () =>
      liquidityOrder.map((liquidity) => ({
          liquidity,
          label: t(`options.liquidity.${liquidity}`),
          value: totals[liquidity],
          color: colors[liquidity],
        })),
    [totals, colors, t],
  )

  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  /* Empty buckets stay in the legend — a household reading "0" for illiquid
     learns something — but they must not reach the arc. With rounded caps a
     zero-value segment still renders its corner radius, so it would appear as
     a stray nub holding open a gap of its own. */
  const arcSlices = slices.filter((slice) => slice.value > 0)

  if (total <= 0) {
    return (
      <div className="flex h-[240px] items-center justify-center t-body-sm text-muted-foreground">
        {t('assets.charts.empty')}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      {/* No tooltip: the legend beside the ring already states every label,
          amount and share, so a hover card can only repeat it — and inside a
          176px ring it lands on top of the centre total, which is what made
          the two sets of figures overlap. The v5 ring (02-components §15)
          carries no tooltip for the same reason. */}
      <div className="relative mx-auto h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          {/* Zeroed: PieChart's default 5px margin on every side would shrink
              the ring inside its box and leave the centre total sitting in a
              hole that no longer matches the arc. */}
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={arcSlices}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              /* The gap and the rounded caps: each bucket reads as its own
                 token rather than as a slice of a divided disc, which is what
                 keeps this a composition and not a pie. A card-coloured stroke
                 would only re-cut the segments the rounding just released, so
                 the padding angle is left to do the separating on its own. */
              paddingAngle={arcSlices.length > 1 ? 2 : 0}
              cornerRadius={6}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {arcSlices.map((slice) => (
                <Cell key={slice.liquidity} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Hero total in the donut hole */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="t-caption text-muted-foreground">{t('assets.summary.total')}</span>
          <span className="money-number mt-1 t-subhead font-medium text-foreground">
            {formatVndShort(total)}
          </span>
        </div>
      </div>

      {/* Legend + direct labels (identity never color-alone) */}
      <ul className="min-w-0 flex-1 space-y-4">
        {slices.map((slice) => {
          const share = Math.round((slice.value / total) * 100)
          return (
            <li key={slice.liquidity} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 t-body-sm text-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="money-number t-body-sm font-medium text-foreground">
                  {formatVndShort(slice.value)}
                </span>
                <span className="w-9 text-right t-caption tabular-nums text-muted-foreground">
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
