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
  MoneyLocationGroupKey,
  MoneyLocationMap,
} from '@/features/dashboard/model/home-derivations'
import { formatVndCell, formatVndScale } from '@/shared/lib/format-money'

/**
 * The two groups are separated by WEIGHT, not by hue (§5.4). Colour on this page
 * is reserved for what needs acting on, and where the money sits needs nothing —
 * it is a fact, not a signal. The palest fill is the long hold; cash, which is
 * what today's decision draws on, sits a step darker.
 */
const GROUP_FILL: Record<MoneyLocationGroupKey, string> = {
  usable_now: 'var(--protect)',
  held: 'var(--committed)',
}

/** Row pitch. Two lines of label (name + who is responsible) need this much. */
const ROW_HEIGHT = 38
/** Left lane for the source name. Names longer than it are clipped, not shrunk. */
const NAME_WIDTH = 132
/** Right lane for the amount, sized for the widest realistic figure. */
const VALUE_WIDTH = 68

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
 * The totals live beside the chart, not inside it, because an area or a length
 * is read as a proportion and the household still needs the figure.
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
        <PanelSplit className="lg:grid-cols-[minmax(0,300px)_1fr]">
          <div>
            <Label>{t('home.location.totalValue')}</Label>
            <p className="num mt-2 text-[30px] font-medium tracking-[-.03em]">
              {formatVndScale(map.total)}
            </p>

            <dl className="mt-6 space-y-3 text-[13px]">
              {map.groups.map((group) => (
                <div key={group.key} className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-ink2">
                    <span
                      className="h-2.5 w-2.5 rounded-[3px]"
                      style={{ background: GROUP_FILL[group.key] }}
                    />
                    {t(`home.location.group.${group.key}`, { count: group.count })}
                  </dt>
                  <dd className="num font-medium">{formatVndScale(group.value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            {/* §10.4: the unit is declared once here, so every bar's figure can
                stay a bare number and the column compares cleanly. */}
            <Label>{t('home.location.barsLabel')}</Label>
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
      className="mt-3 w-full"
      style={{ height: bars.length * ROW_HEIGHT }}
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
          <XAxis type="number" hide domain={[0, 'dataMax']} />
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
            {bars.map((bar) => (
              <Cell key={bar.id} fill={GROUP_FILL[bar.group]} />
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
