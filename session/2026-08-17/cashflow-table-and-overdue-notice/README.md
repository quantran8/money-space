# Cashflow table redesign + overdue "Chưa xử lý" notice

- **Date**: 2026-08-17
- **Session folder**: `session/2026-08-17/cashflow-table-and-overdue-notice/`
- **Status**: done

## What the task is

Two things, from one conversation:

1. Rebuild the `Dòng tiền` timeline table on the Upcoming page to a supplied HTML
   mock — real `<table>`, marker as a filled chip, larger type.
2. A domain rule the user stated mid-task: **nothing is ever counted as handled
   automatically — every action must be the user's.** Every "tính vào hôm nay"
   claim had to go, and overdue items must be surfaced as unresolved.

The user then clarified the rule's exact shape (see Key decisions) and asked for
the overdue notice to live INSIDE `Ba mươi ngày tới`, not as its own section.

## Changes made

- `src/features/forecast/ui/components/forecast-timeline.tsx` — the div-grid rows
  became a real `<table>` with a `<thead>`. From `lg` up it is a true table; below
  `lg` the `<tr>` switches to `display: grid` and the cells stack, as before. No
  horizontal scroll (see Key decisions). Markers now render as a filled
  `bg-attention-tint` chip instead of bare mono text.
- `src/i18n/resources.ts` (`vi` + `en`):
  - `upcoming.markers.overdue`: "Quá hạn, tính vào hôm nay" → **"Quá hạn"**.
  - `upcoming.assumptions.codes.overdue_events_clamped_to_today`: reworded from
    "được tính vào hôm nay" to "được xếp vào hôm nay để nhà mình thấy".
  - New `home.upcoming.overdue.*` block.
- `src/features/dashboard/model/home-derivations.ts` — new `buildOverdue()`
  returning the `wasClampedFromPast` occurrences, capped at 4, with `netAmount`.
- `src/features/dashboard/ui/components/upcoming-section.tsx` — new `OverdueBlock`
  rendered in the left column under the lowest-balance figure it qualifies.
  Takes an `onCompleteOverdue` prop; renders nothing when the list is empty.
- `src/features/dashboard/ui/dashboard-page.tsx` — wires
  `completeCashflowEvent` (from `useCashflowEvents`) into `UpcomingSection`.
- `memory/forecast-and-flexible-money.md` — recorded the rule under
  "Non-negotiable client rules".

## Key decisions

- **Overdue items STAY COUNTED.** This was the user's clarification and it is the
  crux: an overdue item is still owed, so it remains inside
  `startingLiquidBalance` / `lowestProjectedBalance` / flexible money and keeps
  accumulating into what is upcoming. It persists until the user resolves it.
  What never happens automatically is marking it *done*.
  → So **no math changed.** An earlier read of the rule would have excluded
  overdue amounts from the client-side running balances; that was NOT done, and
  should not be. It would have made the `Còn lại` column disagree with the hero
  figure above it, since those scalars are computed server-side and arrive
  already including these items.
- **The fix was therefore a disclosure fix, not a calculation fix.** The amounts
  were always in the figures; the UI just never said they were unresolved. Hence
  a block that names them plus a `Đã xong` button.
- **Merged into §12.2, not a separate panel** (user's call). Correct on the
  merits too: overdue items are the same sequence and the same pot of money — a
  parallel panel would imply a second one.
- **Amber, never red.** Nothing here is a shortfall and the household may have
  good reasons an item is open. The block states what is waiting; it never says
  what anyone should do (§16, §25).
- **No horizontal scroll on mobile** (user's call). The mock uses
  `overflow-x-auto` + `min-w-[840px]`; on a phone that hides `Còn lại`, the
  column the screen exists for. Desktop matches the mock; mobile keeps stacking.
- **`bg-attention-tint`, not the mock's `--attention-soft`** — that token does not
  exist in this app. `attention-tint` is the established chip fill (same use in
  `member-row.tsx`) and is theme-aware.
- The forecast payload carries **no original due date** — `occurrence.date` is
  the clamped day-0 date. So the block deliberately prints no date, which would
  otherwise read as "when it was due".

### Follow-up — second mock: `Dòng tiền` restructure

A later mock reshaped the whole §12.2 panel. Applied:

- **Panel title is now `Dòng tiền`** (`home.cashflow.title`), with `Xem timeline`
  as the header action. `30 ngày tới` demoted to an `<h3>` sub-heading with the
  date range as its own meta line. The old bottom "Xem timeline" link now only
  renders when the table is truncated — otherwise it was the same destination
  offered twice on one panel.
- **Overdue moved to the top, full width**, on an opaque amber wash, above the
  30-day block instead of tucked inside its left column. It is the only thing in
  the section waiting on somebody; everything below it is a projection.
- **Added `--attention-soft`** (`#f6eddc` Ledger / `#f3e8d3` Archive) +
  `--color-attention-soft`. The mock used this name but the token did not exist:
  there was only `--accent-soft` (opaque green) and `--attention-tint`
  (translucent amber). This is the amber counterpart to `--accent-soft`.
- **Overdue rows gained a real due-date column**, and the action is now
  `Xác nhận`. Summary reads `N khoản · cũ nhất N ngày`.

**The due date required a join.** `occurrence.date` is useless for this: the
backend overwrites it with `asOfDate` when it clamps (verified in
`money-space-backend/src/common/utils/recurrence.ts` — `date: asOfDate`), so
every overdue row's own date is *today*. The real date is `expectedDate` on the
source cashflow event, so `buildOverdue` now takes the events and joins on
`sourceEventId`. Consequences worth knowing:

- Rows now sort **oldest first**; `oldestDays` drives the summary line.
- A row whose event is not loaded shows **no date** rather than falling back to
  `occurrence.date` — printing today's date on an overdue item would read as
  "due today", the opposite of true.
- Only a date that is genuinely `< asOfDate` counts; a completed-then-advanced
  event can have a future `expectedDate` while its clamped occurrence lingers.
- **`onComplete` still sends `row.date` (day 0), NOT `row.dueDate`.** Day 0 is
  the idempotency key the API expects; `dueDate` is display only. Getting these
  two backwards would break the double-tap guard.

## Not done / follow-up

- The backend still describes this as clamping in its assumption code name
  (`overdue_events_clamped_to_today`). The code string was left alone (it is an
  API contract); only the rendered sentence changed.

## Mobile app parity notes

- Port `buildOverdue` and the "Chưa xử lý" block; it belongs inside the 30-day
  section, under the lowest-balance figure.
- Port the copy change: an overdue item must never be described as "tính vào hôm
  nay" / "counted today".
- The resolve action is `completeCashflowEvent(eventId, { occurrenceDate })` —
  `occurrenceDate` is the idempotency key, required so a double-tap cannot
  advance a recurring series twice (§18).
- The timeline table's mobile layout is web-specific (CSS `display` swap at
  `lg`); mobile should keep its own stacked rows.
- **`buildOverdue` signature changed** to `(forecast, events, limit)` — it needs
  the cashflow events to resolve a real due date. A caller passing no events
  still works but gets dateless, unsorted rows.
- `--attention-soft` is a new design token; add it to the mobile palette (both
  Ledger and Archive) before porting the overdue block.
