# Events page redesign (Sự kiện tài chính)

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/events-page-redesign/`
- **Status**: done

## What the task is

Rebuild the web Events page to a supplied HTML mockup: month scope moved to the
page header, a "Dòng tiền" summary card led by net, and a timeline whose date
labels sit in a left gutter with icon-led rows, a search box and two filter
dropdowns.

Same session, earlier: white backgrounds for every input/dropdown, and the
Goals page rebuilt to its own mockup (logged separately).

## Changes made

- `packages/core/src/features/events/model/events-form.ts` — widened `RecordTab`
  from `'all' | 'source' | 'debt'` to also carry `income | expense | adjustment |
  asset | payment`, and added `matchesRecordTab(record, tab)` which owns the
  predicate for every value.
- `packages/core/src/features/events/hooks/use-events-page.ts` — the inline
  source/debt predicate in `filteredRecords` now calls `matchesRecordTab`.
- `packages/core/src/i18n/resources.ts` — new keys (vi + en):
  `events.history.{changes,searchPlaceholder,emptyFiltered,actor,typeIncome,
  typeExpense,typeAdjustment,typeAsset,typePayment}` and
  `events.summary.{title,moneyIn,moneyOut}`.
- `web/src/components/ui/month-picker.tsx` — optional `formatLabel` prop so a
  page-level scope control can spell the month out; the `MM/yyyy` default is
  unchanged for form fields.
- `web/src/features/events/ui/components/events-month-scope.tsx` — **new**.
  Prev / MonthPicker / next, rendered in `CompactPageHeader`'s `scope` slot.
- `web/src/features/events/ui/components/events-summary-strip.tsx` — rewritten.
  Net leads at `t-figure`, in/out follow at `t-metric`, labels carry icons, rows
  aligned with `grid-rows-subgrid`. No longer takes `month`.
- `web/src/features/events/ui/components/events-timeline-card.tsx` — rewritten.
  Month nav removed (moved to the page), `PanelHeader` + search + person/type
  filters, date-gutter groups, `Inbox` empty state, pagination only past one
  page.
- `web/src/features/events/ui/components/record-card.tsx` — rewritten. Leading
  type glyph, title, avatar + related-asset name beneath, amount + menu right.
- `web/src/features/events/ui/events-page.tsx` — wires `query` / `setQuery` from
  the hook into the timeline, passes the month scope, section rhythm on
  `.s-section-gap` / `.s-card-gap`.

## Key decisions

- **The month scopes the page, not the list.** Both cards describe the same
  month, so the control sits under the page title. The summary card no longer
  names the month at all — it was being said twice.
- **Net leads the summary.** In and out are inputs; net is the question. It is
  the only `t-figure`, and only a NEGATIVE net is tinted (`--alert-ink`) — a
  positive one stays ink, since a static metric never wears the action colour
  (§4). The old code tinted positives with `text-action`, which resolves to ink
  anyway, so nothing was lost.
- **"Loại" changed axis** from which-book (nguồn tiền / nợ) to what-kind
  (tiền vào / ra / điều chỉnh / tài sản / thanh toán), per the mockup. `source`
  and `debt` were KEPT in the union because the mobile timeline still offers
  them. Consequence: `transfer` and `debt_update` rows are reachable only under
  "Tất cả" on web.
- **`asset` covers purchase AND sale.** The mockup labelled the option "Mua tài
  sản"; a filter named after assets that hides sales is a trap, so the bucket
  matches both and the label is "Tài sản" / "Assets". This is the one copy
  deviation from the mockup.
- **The date is a gutter, not a heading.** A heading per day cost a full line on
  a month where most days hold one row.
- **The row's type is a glyph, not a text line.** The old "Điều chỉnh · TCB"
  line is gone; the type is an icon with `aria-label`/`title`, and the asset
  name moved next to the avatar.
- **Search was already in core.** `useEventsPage` exposed `query`/`setQuery` and
  filtered on title/note/owner/asset all along — the page simply never rendered
  an input.
- **Paging resets during render**, not in an effect (`pagedMonth` sentinel), so
  a month change never paints the wrong page first.

## Mobile app parity notes

- **Core is already shared and ported by construction**: `matchesRecordTab` and
  the widened `RecordTab` are in `packages/core`, and mobile keeps compiling
  because `source` / `debt` remain valid. If mobile wants the new taxonomy, it
  only needs to swap the option list in
  `mobile/src/features/events/ui/events-timeline-section.tsx`.
- The i18n keys are shared, so mobile can use them with no further work.
- **Web-specific, do NOT port as-is**: the date-gutter grid (needs the width),
  `grid-rows-subgrid` (check Hermes/RN support — RN has no subgrid, use explicit
  rows), and `MonthPicker`'s `formatLabel` (web component only).
- Mobile's `events-summary-strip.tsx` still shows received/spent/net in the old
  order; port the net-leads ordering and the negative-only tint if parity is
  wanted.
