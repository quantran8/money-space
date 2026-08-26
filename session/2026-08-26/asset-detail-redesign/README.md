# Asset detail page redesign

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/asset-detail-redesign/`
- **Status**: done

## What the task is

Rebuild the web asset detail page to a supplied HTML mockup: a value summary
with one hero figure and three secondary readings, a chart card with a
change/high/low rail, a Thông tin card pairing reference facts with a goal
allocation ring, and a history table that shows who recorded each change.

## Changes made

- `packages/core/src/features/assets/hooks/use-asset-detail.ts` — `AssetEventEntry`
  gained `createdById` (auth profile id), passed straight through from the money
  event so a caller can name who recorded it.
- `packages/core/src/i18n/resources.ts` — new keys (vi + en):
  `assets.detail.goals.{sectionTitle,freeTitle,freeNote}`,
  `assets.detail.chart.{movementTitle,change,high,low}`,
  `assets.detail.hero.valueTitle`, `assets.detail.events.{person,actor}`.
  `assets.detail.goals.ringCenter` shortened to "tự do" / "free".
- `web/src/features/events/ui/components/event-type-icon.tsx` — **new**. The
  per-event-type glyph map, keyed by the wider `MoneyEventItem['type']`, shared
  by the timeline and the asset history.
- `web/src/features/events/ui/components/record-card.tsx` — uses the shared map.
- `web/src/components/ui/money-composition-ring.tsx` — optional `legend` prop so
  a caller can supply its own legend and keep only the ring.
- `web/src/features/assets/ui/components/asset-goal-usage-section.tsx` —
  rewritten. Ring + a legend that leads with the free share, then the committed
  total, then one row per goal. The three-column table is gone.
- `web/src/features/assets/ui/asset-detail-page.tsx` — rewritten presentation
  (all the computation kept). `Card` → `Panel`/`PanelHeader`, hero value at
  `t-figure lg:t-hero`, sentence-case labels, chart out of its wash bed, a
  change/high/low rail, an info grid, and a history table with a person column.

## Key decisions

- **`.label-vi` labels became sentence case.** The summary read as a form with
  seven mono-uppercase headings over it; the mockup's `t-body-sm text-ink2` /
  `t-caption text-ink3` puts the weight back on the figures.
- **Dropped `SummaryValue` / `MetricValue`.** They split "1,81 tỷ" into figure +
  unit but never matched "48,2 tr" (the regex only knew `triệu|tỷ`), so the same
  component rendered two different shapes depending on magnitude. Plain
  `formatVndShort` everywhere now, as on Goals and Events.
- **Colour only for a loss.** Profit and a positive range delta stay ink; §4
  keeps the action colour out of static metrics, and only the negative case
  needs a look.
- **Range rail gained high/low, kept the markers.** The mockup replaces the
  quantity markers with high/low. The markers are load-bearing — a step up in
  the line is a purchase or a rally and only they say which — so they stayed as
  a fourth block, rendered only when there is something to separate.
- **Asset type moved out of the header.** The mockup's header is title +
  actions. Type is reference, so it moved into Thông tin (where it now ALWAYS
  shows, not only for non-position assets); `sold` stayed in the header because
  it changes what every figure below means.
- **The goal panel is a list, not a table.** At one or two goals the header cost
  more rows than the data, and its extra columns ("đang tính", "góp mỗi tháng")
  answer the goal's question rather than the asset's.
- **`EVENT_TYPE_ICONS[type]`, not `eventTypeIcon(type)`.** A capitalised binding
  assigned from a call trips `react-hooks/static-components`; a member access is
  the same lookup and stays legible to the rule.
- **Fixed a dead `<Trans>` wrapper**: `components` was a one-element ARRAY while
  the string uses `<1>`, so the wrapper was silently dropped. Now the object
  form, so the unit price actually gets tabular figures.

## Mobile app parity notes

- **Shared and already ported**: `AssetEventEntry.createdById` and every new
  i18n key live in `packages/core`.
- `assets.detail.hero.title`, `chart.title` and `chart.description` were left in
  place — web stopped using them, mobile may not have.
- **Web-only, do NOT port as-is**: `event-type-icon.tsx` (lucide-react, not
  `-native`), the `legend` prop plumbing on `MoneyCompositionRing` (recharts),
  and every grid/breakpoint class.
- Worth porting for parity: net/free-leads ordering, the sentence-case labels,
  loss-only colour, and showing who recorded each history row.
