import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { Panel, PanelHeader, PanelSplit } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORY_ICON_FALLBACK, CATEGORY_ICONS } from '@/features/events/ui/components/category-icon'
import type {
  CategoryBreakdown,
  MemberBreakdownRow,
} from '@money-space/core/features/events/model/events-form'
import { formatVndScale, formatVndShort } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Arcs the ring draws before the rest collapse into one "+N nhóm khác" segment.
 *
 * Liquidity has three fixed buckets; categories are unbounded, and a ring cut
 * into twelve is a colour wheel rather than a reading. The tail is collapsed
 * rather than dropped so the ring, the list and the total all describe the same
 * money.
 */
const VISIBLE_SLICES = 5

/** The collapsed tail's fill — deliberately the neutral, so "everything else"
 *  never out-weighs a real category it is smaller than. */
const REST_COLOR = 'var(--ink3)'

/** Fallback fill for a category the household has not given a colour. */
const DEFAULT_COLOR = 'var(--data-primary)'

type Direction = 'outflow' | 'inflow'

type Segment = {
  key: string
  label: string
  color: string
  total: number
  share: number
  /** The category's glyph, or null for the collapsed tail. */
  iconKey: string | null
  /** True for the "+N nhóm khác" row, which has no disc and no icon. */
  isRest: boolean
}

type EventsCategoryCardProps = {
  spending: CategoryBreakdown
  income: CategoryBreakdown
  /** The same month split by who is responsible. Empty renders nothing. */
  byMember: MemberBreakdownRow[]
  isLoading?: boolean
}

/**
 * What the month's money was made of, by category.
 *
 * COMPOSITION, not a verdict. It states that spending was 42% sinh hoạt and
 * stops there — no budget to compare against, no judgement of the share, and
 * nothing about who recorded any of it (§0.2, §16.4: this is a shared picture,
 * never a report on a partner).
 *
 * It reads the whole month on purpose, so it does NOT follow the person / type
 * / search filters on the timeline below. Two readings of different populations
 * sitting in one column is exactly how a page starts contradicting itself, so
 * the header says "Cả tháng" rather than leaving the reader to infer the scope.
 *
 * Direction is a toggle rather than two rings: they answer the same question of
 * two different flows, and side by side the smaller one (income, usually one or
 * two groups) reads as an afterthought padding the card.
 */
export function EventsCategoryCard({
  spending,
  income,
  byMember,
  isLoading = false,
}: EventsCategoryCardProps) {
  const { t } = useTranslation()
  const [direction, setDirection] = useState<Direction>('outflow')
  const breakdown = direction === 'outflow' ? spending : income

  return (
    <Panel>
      <PanelHeader
        title={t('events.byCategory.title')}
        meta={t('events.byCategory.meta')}
      />

      {/* The two directions, as a segmented control. Both are always offered
          even when one is empty — a control that disappears when its side has
          no data reads as a rendering fault, and the empty state says more
          than a missing button would. */}
      <div
        className="mt-5 inline-flex rounded-control bg-wash p-1"
        role="tablist"
        aria-label={t('events.byCategory.title')}
      >
        {(['outflow', 'inflow'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={direction === value}
            onClick={() => setDirection(value)}
            className={cn(
              'min-h-9 rounded-control px-3.5 t-body-sm transition-colors',
              direction === value
                ? 'bg-card font-medium text-ink'
                : 'text-ink2 hover:text-ink',
            )}
          >
            {t(`events.byCategory.${value}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="s-head-body flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-control" />
          ))}
        </div>
      ) : (
        <>
          <CategoryComposition breakdown={breakdown} />
          <MemberTotals rows={byMember} />
        </>
      )}
    </Panel>
  )
}

/**
 * The same month, by who is responsible.
 *
 * Two plain totals per person and nothing else: no net, no share of the
 * household's total, and no ordering by who spent more. Each of those would
 * turn a shared picture into a comparison between partners, which is the one
 * reading this product does not offer (§0.2, §16.4). The heading says "người
 * phụ trách" — who a record is filed under — never who spent it.
 *
 * A COLUMN per person, not a list row. A household has two or three members, and
 * a divided list built for N rows spends most of its height on the dividers and
 * padding between them; side by side, the two people fit in one band and the
 * figures — which are the whole point of the block — get the size of a figure
 * rather than of a caption. Past three the columns wrap to a second line rather
 * than compress.
 *
 * A single row is still shown: the card above splits the month by CATEGORY, so
 * one person's in/out is not a restatement of it, and a block that appears only
 * once a second member records something reads as a bug rather than as a rule.
 * Only a month with nothing recorded has nothing to say here.
 */
function MemberTotals({ rows }: { rows: MemberBreakdownRow[] }) {
  const { t } = useTranslation()
  if (rows.length === 0) return null

  return (
    <div className="s-head-body border-t border-divider pt-7">
      <h3 className="t-subtitle">{t('events.byMember.title')}</h3>

      {/* Deliberately not a bar or a ring — those encode share, and a share is
          a comparison between the people in the household. */}
      <div className="mt-5 grid gap-x-12 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <div key={row.memberId ?? '__unassigned__'} className="min-w-0">
            <p className="truncate t-body-sm text-ink2">
              {row.memberId === null ? t('events.byMember.unassigned') : row.name}
            </p>

            {/* The two directions share a row of labels and a row of figures via
                subgrid, so both figures sit on one baseline instead of drifting
                apart when one label wraps — the same construction the summary
                strip above uses. */}
            <div className="mt-3 grid grid-cols-2 grid-rows-[auto_auto] gap-x-6 gap-y-1.5">
              <MemberFigure
                label={t('events.byMember.moneyIn')}
                value={`+${formatVndShort(row.totalIncome)}`}
              />
              <MemberFigure
                label={t('events.byMember.moneyOut')}
                value={`−${formatVndShort(row.totalOutcome)}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MemberFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 grid-rows-subgrid row-span-2">
      <p className="t-caption text-ink3">{label}</p>
      {/* Both directions stay ink: colour marks what needs a look (§5.2), and
          neither a month's spending nor its income is a thing to flag. */}
      <p className="money-number t-metric">{value}</p>
    </div>
  )
}

function CategoryComposition({ breakdown }: { breakdown: CategoryBreakdown }) {
  const { t } = useTranslation()

  // The ring and the legend read the SAME array, so a segment can never appear
  // in one and not the other.
  const segments = useMemo<Segment[]>(() => {
    const visible: Segment[] = breakdown.slices.slice(0, VISIBLE_SLICES).map((slice) => ({
      key: slice.categoryId,
      label: slice.label,
      color: slice.color ?? DEFAULT_COLOR,
      total: slice.total,
      share: slice.share,
      iconKey: slice.iconKey,
      isRest: false,
    }))

    const rest = breakdown.slices.slice(VISIBLE_SLICES)
    if (rest.length === 0) return visible

    // Summed, not dropped: the arcs and the rows must add up to the total
    // stated beside them, or the card invites the reader to check arithmetic
    // that was never going to work.
    const restTotal = rest.reduce((sum, slice) => sum + slice.total, 0)
    return [
      ...visible,
      {
        key: '__rest__',
        label: t('events.byCategory.others', { count: rest.length }),
        color: REST_COLOR,
        total: restTotal,
        share: breakdown.total > 0 ? restTotal / breakdown.total : 0,
        iconKey: null,
        isRest: true,
      },
    ]
  }, [breakdown, t])

  if (segments.length === 0) {
    return (
      <p className="s-head-body t-body-sm text-ink2">
        {breakdown.direction === 'outflow'
          ? t('events.byCategory.emptyOutflow')
          : t('events.byCategory.emptyInflow')}
      </p>
    )
  }

  return (
    <PanelSplit className="items-center lg:grid-cols-[minmax(0,240px)_1fr]">
      <CategoryRing segments={segments} total={breakdown.total} />

      {/* Legend + direct labels: identity is never colour-alone (§24). */}
      <ul className="min-w-0 flex flex-col">
        {segments.map((segment, index) => (
          <LegendRow key={segment.key} segment={segment} isFirst={index === 0} />
        ))}
      </ul>
    </PanelSplit>
  )
}

function CategoryRing({ segments, total }: { segments: Segment[]; total: number }) {
  const { t } = useTranslation()
  /* A zero-value segment still renders its corner radius with rounded caps, so
     it would appear as a stray nub holding open a gap of its own. It stays in
     the legend — a household reading "0" learns something — but not in the
     arc. */
  const arcSegments = segments.filter((segment) => segment.total > 0)

  return (
    <div className="relative mx-auto h-44 w-44 shrink-0">
      {/* No tooltip: the legend beside the ring already states every label,
          amount and share, so a hover card can only repeat it — and inside a
          176px ring it lands on top of the centre total. The v5 ring
          (02-components §15) carries no tooltip for the same reason. */}
      <ResponsiveContainer width="100%" height="100%">
        {/* Zeroed: PieChart's default 5px margin on every side would shrink the
            ring inside its box and leave the centre total sitting in a hole
            that no longer matches the arc. */}
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={arcSegments}
            dataKey="total"
            nameKey="label"
            innerRadius="68%"
            outerRadius="100%"
            /* The gap and the rounded caps: each category reads as its own
               token rather than as a slice of a divided disc, which is what
               keeps this a composition and not a pie. A card-coloured stroke
               would only re-cut the segments the rounding just released, so the
               padding angle is left to do the separating on its own. */
            paddingAngle={arcSegments.length > 1 ? 2 : 0}
            cornerRadius={6}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          >
            {arcSegments.map((segment) => (
              <Cell key={segment.key} fill={segment.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* The denominator, in the donut hole. Every share in the legend is a
          share OF this. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="t-caption text-ink3">{t('events.byCategory.total')}</span>
        <span className="money-number mt-1 t-subhead font-medium">
          {formatVndScale(total)}
        </span>
      </div>
    </div>
  )
}

function LegendRow({ segment, isFirst }: { segment: Segment; isFirst: boolean }) {
  const { t } = useTranslation()
  const label = segment.isRest
    ? segment.label
    : segment.label || t('events.byCategory.uncategorized')
  // Member access, not a call — see record-card.tsx for why the lookup is
  // written this way rather than through a helper.
  const CategoryIcon =
    (segment.iconKey && CATEGORY_ICONS[segment.iconKey]) || CATEGORY_ICON_FALLBACK
  const percent = Math.round(segment.share * 100)

  return (
    <li
      className={cn(
        'flex items-center justify-between gap-3 py-3',
        !isFirst && 'border-t border-divider',
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {segment.isRest ? (
          // The collapsed tail is not a category, so it takes a plain swatch
          // rather than a disc with a glyph that would claim it is one.
          <span
            className="ml-2 size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: segment.color }}
            aria-hidden
          />
        ) : (
          /* The category's own disc, the same one the timeline row draws, so
             the two surfaces name a category identically. It doubles as the
             ring's legend swatch — one mark, not a swatch beside an icon. */
          <span
            className="grid size-9 shrink-0 place-items-center rounded-pill text-white"
            style={{ backgroundColor: segment.color }}
            aria-hidden
          >
            <CategoryIcon className="size-[18px]" strokeWidth={1.75} />
          </span>
        )}
        <span
          className={cn('min-w-0 truncate t-body-sm', segment.isRest && 'text-ink2')}
        >
          {label}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-3">
        <span
          className={cn('money-number t-body-sm', !segment.isRest && 'font-medium')}
        >
          {formatVndShort(segment.total)}
        </span>
        <span className="num w-10 text-right t-caption tabular-nums text-ink3">
          {t('events.byCategory.share', { percent })}
        </span>
      </span>
    </li>
  )
}
