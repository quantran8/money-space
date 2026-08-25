import {
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Landmark,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type YAxisTickContentProps,
} from 'recharts'

import { Label, Panel, PanelHeader } from '@/components/ui/panel'
import type {
  HolderGroup,
  MoneyLocationBar,
  MoneyLocationMap,
} from '@money-space/core/features/dashboard/model/home-derivations'
import { chartAxis, chartGrid } from '@money-space/core/shared/constants/colors'
import { formatVndCell, formatVndScale } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * One fill per bar, strongest first, stepping down a MONOCHROME ramp by rank.
 *
 * The ramp is the data hue thinned toward the card, not a neutral grey one. It
 * used to start at `--accent` — near-black — which made the largest source read
 * as a UI element rather than as data, and put the action colour on a static
 * figure that §4 reserves for interaction.
 *
 * Still weight, not hue (§5.4): the largest source carries the full tone and
 * each one below it recedes a step, so the eye lands on the concentration
 * before it reads a single figure. Amber stays reserved for `attention`.
 *
 * `color-mix` against the tokens rather than the literal hex in the mock, so
 * the ramp follows the active palette (Ledger or Archive). Past the ramp's
 * length every remaining bar sits at the palest step — by then the rank is
 * legible from length alone.
 */
const RANK_FILL = [
  'var(--data-primary)',
  'color-mix(in srgb, var(--data-primary) 72%, var(--card))',
  'color-mix(in srgb, var(--data-primary) 48%, var(--card))',
  'color-mix(in srgb, var(--data-primary) 28%, var(--card))',
  'color-mix(in srgb, var(--data-primary) 14%, var(--card))',
]

const fillForRank = (index: number): string =>
  RANK_FILL[Math.min(index, RANK_FILL.length - 1)]

/**
 * One tone per holder, cycled by position.
 *
 * The colour is an INDEX, not a judgement: it tells the eye which avatar goes
 * with which total, nothing more. Whoever holds the most money is not marked
 * out by it — the ordering already says that, and colouring a person by their
 * balance is the one thing this block must never do (§0.2, §16.4).
 *
 * Ink counterparts throughout, since these carry both a glyph and a figure.
 */
const HOLDER_TONE = [
  { disc: 'bg-data-primary/10', ink: 'text-data-ink' },
  { disc: 'bg-positive/15', ink: 'text-positive-ink' },
  { disc: 'bg-attention/10', ink: 'text-attention-ink' },
] as const

/**
 * Row pitch. With a 22px bar this leaves a wide gutter between rows, which is
 * what keeps a ranked list from reading as a solid block — the mock's five bars
 * in ~306px of plot area.
 */
const ROW_HEIGHT = 61
/** Left lane for the source name. Names longer than it are clipped, not shrunk. */
const NAME_WIDTH = 140
/** Right lane for the amount, sized for the widest realistic figure plus "tr". */
const VALUE_WIDTH = 84
/** The x-axis lane below the bars. */
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
export function MoneySourcesSection({
  map,
  holderGroups = [],
}: {
  map: MoneyLocationMap
  /** The same sources read by who is RESPONSIBLE for them (§0.2, §16.4). */
  holderGroups?: HolderGroup[]
}) {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader
        title={t('home.location.title')}
        meta={t('home.coverage.sourceCount', { count: map.totalCount })}
      />

      {map.totalCount === 0 ? (
        <p className="mt-7 py-6 text-[13px] text-ink2">{t('home.moneyLocation.empty')}</p>
      ) : (
        <>
          {/* The total, led by a disc so the section opens on a figure rather
              than on a chart axis. Which sources count as usable is stated in
              §12.1, where the figure that depends on it lives. */}
          <div className="mt-5 flex items-start gap-4">
            <span
              className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-pill bg-data-primary/15 text-data-ink"
              aria-hidden
            >
              <Landmark className="size-5" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <Label>{t('home.location.totalValue')}</Label>
              <p className="num mt-1 text-[42px] leading-[1.05] font-medium tracking-[-.04em] text-data-ink sm:text-[48px]">
                {formatVndScale(map.total)}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-9 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)] xl:items-start xl:gap-12">
            <div className="min-w-0">
              <h3 className="mb-3 flex items-center gap-2 text-[14px] font-medium">
                <ChartNoAxesColumnIncreasing
                  className="size-4 shrink-0 text-data-primary"
                  strokeWidth={1.7}
                  aria-hidden
                />
                {t('home.location.barsTitle')}
              </h3>

              <MoneyLocationBars bars={map.bars} />

              {map.hiddenCount > 0 ? (
                <p className="mt-3 text-[12px] leading-5 text-ink3">
                  {t('home.location.hidden', { count: map.hiddenCount })}
                </p>
              ) : null}
            </div>

            {holderGroups.length > 0 ? <HolderColumn groups={holderGroups} /> : null}
          </div>
        </>
      )}
    </Panel>
  )
}

/**
 * `Ai đang nắm tài sản` — the same money, grouped by who is RESPONSIBLE for it.
 *
 * This is not an attribution of spending, and the product never makes one
 * (§0.2, §16.4). It answers a question a two-person household genuinely has —
 * which of us is looking after what — and answers it with balances only.
 *
 * Each group opens to name its own sources, so the per-person total is
 * verifiable rather than asserted. The first group is open by default: a column
 * of closed rows shows nothing at all, and the largest holder is the one whose
 * detail is most likely to be wanted.
 */
function HolderColumn({ groups }: { groups: HolderGroup[] }) {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-[14px] font-medium">
        <Users className="size-4 shrink-0 text-data-primary" strokeWidth={1.7} aria-hidden />
        {t('home.location.holderTitle')}
      </h3>

      <div>
        {groups.map((group, index) => (
          <details
            key={group.key}
            open={index === 0}
            className={cn('group py-1', index > 0 && 'border-t border-divider')}
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 py-3.5 [&::-webkit-details-marker]:hidden">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-pill',
                  HOLDER_TONE[index % HOLDER_TONE.length].disc,
                  HOLDER_TONE[index % HOLDER_TONE.length].ink,
                )}
                aria-hidden
              >
                {group.key === 'shared' ? (
                  <UsersRound className="size-4" strokeWidth={1.8} />
                ) : (
                  <UserRound className="size-4" strokeWidth={1.8} />
                )}
              </span>

              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="truncate text-[13px] font-medium">{group.name}</span>
                <span className="shrink-0 text-[12px] text-ink2">
                  {t('home.coverage.sourceCount', { count: group.sources.length })}
                </span>
              </span>

              <span
                className={cn(
                  'num shrink-0 text-[20px] font-medium',
                  HOLDER_TONE[index % HOLDER_TONE.length].ink,
                )}
              >
                {formatVndScale(group.value)}
              </span>
              <ChevronDown
                className="size-4 shrink-0 text-ink2 transition-transform group-open:rotate-180"
                strokeWidth={1.8}
                aria-hidden
              />
            </summary>

            <div className="pb-3 pl-12">
              {group.sources.map((source) => (
                <div
                  key={source.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-2"
                >
                  <p className="truncate text-[13px]">{source.name}</p>
                  <span className="num text-[13px] font-medium">
                    {formatVndScale(source.value)}
                  </span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

function MoneyLocationBars({ bars }: { bars: MoneyLocationBar[] }) {
  const { t } = useTranslation()

  const byId = new Map(bars.map((bar) => [bar.id, bar]))

  // Per-datum fill rather than <Cell>, which recharts 3 deprecates. `bars` is
  // already ranked by value, so the index IS the rank.
  const data = bars.map((bar, index) => ({ ...bar, fill: fillForRank(index) }))

  const ariaLabel = bars
    .map((bar) => t('home.location.barAria', { name: bar.name, value: formatVndScale(bar.value) }))
    .join('. ')

  return (
    <div
      className="w-full"
      // Height follows the row count rather than being fixed: the mock's 340px
      // is exactly six rows, and pinning it there would squeeze a household
      // with more sources and strand whitespace under one with fewer.
      style={{ height: bars.length * ROW_HEIGHT + AXIS_HEIGHT }}
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: VALUE_WIDTH, bottom: 0, left: 0 }}
          barCategoryGap={10}
        >
          {/* Vertical rules only. They are what turn the bars from an ordering
              into a scale — without them the eye can rank the rows but cannot
              say whether the top one is twice the second or five times it. */}
          <CartesianGrid
            horizontal={false}
            stroke={chartGrid}
            strokeDasharray="0"
          />

          {/* A real scale, not a hidden one. The per-bar figure answers "how
              much is in this account"; the axis answers "how do these compare",
              which is the question the ranking is drawn to raise. The unit
              rides on the ticks rather than in a separate caption — a caption
              anchored to the plot's bottom-right collided with the last tick
              at narrow widths. */}
          <XAxis
            type="number"
            domain={[0, 'dataMax']}
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartAxis, fontSize: 11 }}
            tickFormatter={(value: number) =>
              `${formatVndCell(value)} ${t('units.million')}`
            }
            height={AXIS_HEIGHT}
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
            radius={6}
            barSize={22}
            // A source too small to draw still gets a visible stub: seeing that
            // it is nearly nothing is the point, seeing nothing at all is a bug.
            minPointSize={3}
            isAnimationActive={false}
          >
            {/* Metadata weight, not value weight: the BAR is the value here,
                and setting the figure in full ink made every row shout as loud
                as the ranking it annotates. Outside a table each figure carries
                its own unit — see `formatVndCell` (§10.4). */}
            <LabelList
              dataKey="value"
              position="right"
              offset={10}
              className="num"
              fill="var(--ink2)"
              fontSize={12}
              fontWeight={500}
              formatter={(value) => `${formatVndCell(Number(value))} ${t('units.million')}`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * The row label: the source name, on one line.
 *
 * It used to carry who is responsible for the source on a second line. That
 * fact now has a block of its own beside this chart (`HolderColumn`), where it
 * is grouped and totalled rather than repeated once per bar — so keeping it
 * here was the same fact in two places, and it forced a row pitch tall enough
 * for two lines onto a chart that only needs one (§2.10).
 */
function SourceTick({ y, source }: YAxisTickContentProps & { source?: MoneyLocationBar }) {
  if (!source) return <g />

  // The lane starts at the container's left edge (the chart has no left margin),
  // so anchor to that rather than back off from the tick's own x — recharts
  // places that x at the axis line, which would push the first glyph off-canvas.
  const left = 2
  const middle = Number(y)

  return (
    <text
      x={left}
      y={middle}
      dy={4}
      fontSize={13}
      fontWeight={500}
      fill="var(--ink)"
    >
      {clip(source.name, NAME_WIDTH - 12, 6.9)}
    </text>
  )
}

/** Clip to the lane. SVG text has no ellipsis of its own. */
function clip(text: string, available: number, charWidth: number): string {
  const max = Math.floor(available / charWidth)
  if (max <= 1) return ''
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}
