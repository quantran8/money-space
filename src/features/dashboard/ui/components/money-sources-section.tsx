import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type YAxisTickContentProps,
} from 'recharts'

import { Label, Panel, PanelHeader, PanelSplit } from '@/components/ui/panel'
import type {
  MoneyLocationBar,
  MoneyLocationMap,
} from '@/features/dashboard/model/home-derivations'
import { chartAxis } from '@/shared/constants/colors'
import { formatVndCell, formatVndScale } from '@/shared/lib/format-money'

/**
 * One fill per bar, darkest first, stepping down the neutral ramp by RANK.
 *
 * Still weight, not hue (§5.4): the largest source carries the accent and each
 * one below it recedes a step, so the eye lands on the concentration before it
 * reads a single figure. Amber stays reserved for `attention`.
 *
 * Tokens rather than the literal hex in the mock, so the ramp follows the active
 * palette (Ledger or Archive) instead of pinning Ledger's greens into the file.
 * Past the ramp's length every remaining bar sits at the palest step — by then
 * the rank is legible from length alone.
 */
const RANK_FILL = ['var(--accent)', 'var(--ink2)', 'var(--protect)', 'var(--committed)']

const fillForRank = (index: number): string =>
  RANK_FILL[Math.min(index, RANK_FILL.length - 1)]

/** Row pitch. Two lines of label (name + who is responsible) need this much. */
const ROW_HEIGHT = 38
/** Left lane for the source name. Names longer than it are clipped, not shrunk. */
const NAME_WIDTH = 132
/** Right lane for the amount, sized for the widest realistic figure. */
const VALUE_WIDTH = 68
/** The x-axis lane below the bars: ticks plus the unit caption. */
const AXIS_HEIGHT = 34

/**
 * Home section 4 — Tiền đang ở đâu (§12.4).
 *
 * Ranked horizontal bars, cash first. Bar length carries the same proportional
 * reading an area map would, so CONCENTRATION is still the first thing visible —
 * one long bar and a row of stubs says "nearly everything is in one account"
 * without a single number being read. What the bars add is that every source
 * keeps a full row: a source holding 0,03% still has its name and its amount at
 * full size, which is precisely the case an area map cannot label.
 *
 * The total lives beside the chart, not inside it, because a length is read as a
 * proportion and the household still needs the figure.
 *
 * v12 ranks the fills instead of grouping them, and gives the bars a real
 * x-axis. The scale is what lets the row lengths be compared as quantities
 * rather than just ordered, and once the fill steps down by rank the group
 * legend beside the total had nothing left to explain, so it is gone.
 */
export function MoneySourcesSection({ map }: { map: MoneyLocationMap }) {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader
        title={t('home.location.title')}
        action={
          <Link
            to="/networth"
            className="inline-flex min-h-11 shrink-0 items-center text-[13px] font-medium text-accent"
          >
            {t('home.location.viewAll', { count: map.totalCount })}
          </Link>
        }
      />

      {map.totalCount === 0 ? (
        <p className="mt-7 py-6 text-[13px] text-ink2">{t('home.moneyLocation.empty')}</p>
      ) : (
        <PanelSplit className="items-start lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Total only. The group legend that used to sit here explained a fill
              that no longer encodes a group — bars are now ranked by size, which
              their length already says — so it had nothing left to decode. Which
              sources count as usable is stated in §12.1, where the figure that
              depends on it lives. */}
          <div>
            <Label>{t('home.location.totalValue')}</Label>
            <p className="num mt-3 text-[32px] font-medium tracking-[-.03em]">
              {formatVndScale(map.total)}
            </p>
          </div>

          <div className="min-w-0">
            <MoneyLocationBars bars={map.bars} />

            {map.hiddenCount > 0 ? (
              <p className="mt-3 text-[12px] leading-5 text-ink3">
                {t('home.location.hidden', { count: map.hiddenCount })}
              </p>
            ) : null}
          </div>
        </PanelSplit>
      )}
    </Panel>
  )
}

function MoneyLocationBars({ bars }: { bars: MoneyLocationBar[] }) {
  const { t } = useTranslation()

  const byId = new Map(bars.map((bar) => [bar.id, bar]))

  const ariaLabel = bars
    .map((bar) => t('home.location.barAria', { name: bar.name, value: formatVndScale(bar.value) }))
    .join('. ')

  return (
    <div
      className="w-full"
      style={{ height: bars.length * ROW_HEIGHT + AXIS_HEIGHT }}
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={bars}
          layout="vertical"
          margin={{ top: 0, right: VALUE_WIDTH, bottom: 0, left: 0 }}
          barCategoryGap={10}
        >
          {/* A real scale, not a hidden one. The per-bar figure answers "how
              much is in this account"; the axis answers "how do these compare",
              which is the question the ranking is drawn to raise. The unit is
              declared once in the caption, so every figure stays a bare number
              (§10.4). */}
          <XAxis
            type="number"
            domain={[0, 'dataMax']}
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartAxis, fontSize: 10 }}
            tickFormatter={(value: number) => formatVndCell(value)}
            height={AXIS_HEIGHT}
            label={{
              value: t('home.location.barsLabel'),
              position: 'insideBottomRight',
              offset: 0,
              fill: chartAxis,
              fontSize: 10,
            }}
          />
          {/* Keyed by id, not name: two sources may legitimately share a name,
              and a duplicate category would silently merge their rows. */}
          <YAxis
            type="category"
            dataKey="id"
            width={NAME_WIDTH}
            axisLine={false}
            tickLine={false}
            tick={(props: YAxisTickContentProps) => (
              <SourceTick {...props} source={byId.get(String(props.payload.value))} />
            )}
          />

          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const bar = payload[0].payload as MoneyLocationBar
              return (
                <div className="panel px-3 py-2 shadow-sm">
                  <p className="text-[13px] font-medium">{bar.name}</p>
                  <p className="num mt-1 text-[12px] text-ink2">
                    {bar.holder ? `${bar.holder} · ` : ''}
                    {formatVndScale(bar.value)}
                  </p>
                </div>
              )
            }}
          />

          <Bar
            dataKey="value"
            radius={4}
            barSize={10}
            // A source too small to draw still gets a visible stub: seeing that
            // it is nearly nothing is the point, seeing nothing at all is a bug.
            minPointSize={3}
            isAnimationActive={false}
          >
            {bars.map((bar, index) => (
              <Cell key={bar.id} fill={fillForRank(index)} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              offset={10}
              className="num"
              fill="var(--ink)"
              fontSize={12}
              formatter={(value) => formatVndCell(Number(value))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * The row label: source name, and under it who is responsible for it. Two lines
 * rather than one long string, so a long name and a holder never fight for the
 * same lane — and the holder stays visibly secondary, which is what keeps it a
 * shared picture rather than an attribution (§0.2, §16.4).
 */
function SourceTick({ y, source }: YAxisTickContentProps & { source?: MoneyLocationBar }) {
  if (!source) return <g />

  // The lane starts at the container's left edge (the chart has no left margin),
  // so anchor to that rather than back off from the tick's own x — recharts
  // places that x at the axis line, which would push the first glyph off-canvas.
  const left = 2
  const middle = Number(y)

  return (
    <g>
      <text x={left} y={middle} dy={source.holder ? -1 : 4} fontSize={13} fill="var(--ink)">
        {clip(source.name, NAME_WIDTH - 12, 6.9)}
      </text>
      {source.holder ? (
        <text x={left} y={middle} dy={14} fontSize={11} fill="var(--ink3)">
          {clip(source.holder, NAME_WIDTH - 12, 6.1)}
        </text>
      ) : null}
    </g>
  )
}

/** Clip to the lane. SVG text has no ellipsis of its own. */
function clip(text: string, available: number, charWidth: number): string {
  const max = Math.floor(available / charWidth)
  if (max <= 1) return ''
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}
