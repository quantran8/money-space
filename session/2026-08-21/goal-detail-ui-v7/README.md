# Goal detail page — UI v7

- **Date**: 2026-08-21
- **Session folder**: `session/2026-08-21/goal-detail-ui-v7/`
- **Status**: done

## What the task is

Update the goal detail screen to match a supplied HTML mockup ("Oursight — Goal
detail v7"). The mockup keeps the existing section order and every existing data
source; what it changes is how each section presents what it already has.

## Changes made

- `src/features/goals/ui/goal-detail-page.tsx` — priority moved from the hero panel
  up beside the goal name; the header's "add source" button removed (the action now
  lives in the Sources panel, where it applies). The hero became a two-column split:
  the progress figure, percentage and shortfall on the left, the target and the
  projected date on the right. Progress bar thinned to 4px.
- `src/features/goals/ui/components/goal-scheduled-outflows-section.tsx` — rewritten
  as a collapsible. Collapsed it shows a one-line summary (date, wallet, amount, and
  where the goal lands after). Expanded it shows a before/after pair of columns plus
  the named bills.
- `src/features/goals/ui/components/goal-allocations-section.tsx` — rewritten. The
  single card list became two columns: "Tài sản đã dành" (holdings, totalled as a
  value) and "Đóng góp định kỳ" (recurring, totalled as a per-month rate). Rows are
  now quiet hover rows rather than icon cards.
- `src/features/goals/ui/components/goal-road-section.tsx` — layout inverted to
  answer-left / chart-right, and **the chart was rebuilt as a real two-line time
  series**. It now plots ACTUAL progress (per-month `endAmount` from the frozen
  snapshots) against the PLANNED line (the declared pace climbing from the goal's
  starting point), both against the same months. The vertical gap at the current
  month is drawn as a dashed connector and stated as a figure ("So với kế hoạch
  −16,4 tr"). Previously the chart drew two forward-looking rays from today, which
  could show a pace but never whether it had been kept.
- `src/features/goals/ui/components/goal-monthly-progress-section.tsx` — declared rate
  added to the panel header as metadata; the record table gained a "Lịch sử đóng góp"
  heading with a completed-month count.
- `src/i18n/resources.ts` — new keys in both `vi` and `en` for all of the above.

### Follow-up round

- `goal-road-section.tsx` — chart points are now readable on **hover and click**.
  The hit areas are full-height per-month COLUMNS, not the dots: asking a pointer to
  land on a 4px circle (and a fingertip to do it at all) made the detail effectively
  unreachable. A selection draws a rule, rings the point on each line, and shows a
  readout with both values and the gap between them. Click toggles, so it works on
  touch where there is no hover.
- `goal-detail-page.tsx` — "Nhịp góp" moved ABOVE "Nguồn tạo tiến độ".
- `goal-monthly-progress-section.tsx` — the running-month card lost its `bg-sunk`
  panel; the running month is now excluded from "Lịch sử đóng góp" entirely, with an
  empty state for a goal whose first month has not closed. `MonthRow` lost its
  in-progress branches, since every row it renders is now a settled month.
- **`backend/.../goal-monthly-progress.ts` — new `isEstimate` field**, plus the
  client type, two new domain tests, and `memory/goals.md`.

### Copy and typography round

- `src/index.css` — new `.label-vi`: the label slot for VIETNAMESE text, in Be Vietnam
  Pro rather than IBM Plex Mono.
- `src/components/ui/panel.tsx` — `PanelHeader`'s `meta` slot now picks the face from
  the string: non-ASCII gets `.label-vi`, ASCII keeps mono.
- `resources.ts` + call sites — every label I had written as stripped-ASCII caps
  ("TAI SAN DA DANH", "MUC TIEU", "DE DUNG HEN CAN", the monthly table's columns…)
  restored to real Vietnamese and moved to `.label-vi`.
- Cut copy that carried nothing: the second sentence of the history empty state, the
  "Mức góp … nằm ở Nhịp góp" pointer (it pointed at the section directly above),
  the behind/ahead sentence restating the signed figure above it, the
  closed-month count restating the list, and `notEnoughHistory`'s explanation.
- The history empty state is now an icon (`CalendarClock`) + one line.

## Key decisions

- **The two source kinds were split rather than re-styled.** A holding answers "how
  much is behind this now" (a stock, moved by the market); a wallet answers "how much
  goes in each month" (a rate, set by the household). One list forced the reader to
  check each row's badge before knowing which question its number answered, and put a
  162,0tr directly above a 20,0tr that meant something else entirely. Split, the
  column heading carries the meaning, so the rows can drop their badges and icons.
- **The outflow section collapses, and defaults to collapsed.** Its summary line is
  the whole answer for anyone who just wants the damage. Left expanded, one scheduled
  bill outweighed the goal's own figures on the panel above it.
- **Before/after is stated in full on both sides** rather than as a strikethrough
  pair, so the household reads two complete pictures instead of reconstructing one
  from edits to the other.
- **No projection behaviour changed.** The finish date still comes from the DECLARED
  pace, and the outflow section still refuses to re-forecast the goal from a
  one-month dip. The projected date in the hero renders only when `hasProjectedDate`
  is true — a goal with no declared pace shows the desired date or nothing, never an
  invented one.
- **The two-line chart needed no backend change.** `GET .../monthly-progress` already
  returns `endAmount` per month — total progress at that month's close, market value
  included — which is exactly the actual line, and the same quantity the hero figure
  reports, so the line ends where the headline says it should. The client simply was
  not using it. `goal-detail-page.tsx` now feeds `useGoalMonthlyProgress` into the
  road section; the pace section already ran that query, so it costs no extra request.
- **The actual line stops at the current month.** Past it there is no record, and
  continuing it would be a forecast pretending to be history. The plan line runs the
  full timeline (capped at the target and at 14 points) because it is a plan, not a
  claim about what happened.
- **Both lines are plotted against the SAME months** — that is the only thing that
  makes the vertical distance between them mean anything. The y axis runs 0 → target,
  so the top of the chart is always the goal.
- Verified against the mockup's own scenario (260tr in 05/26 → 303,6tr in 08/26, 20tr
  pace, 400tr target): the computed gap is −16,4 tr, matching the figure the mockup
  had hardcoded. Edge cases checked: no history draws the plan line only, no declared
  pace draws the actual line only, and all points stay inside the plot box.
- **"Đã góp" was factually wrong on a new goal, so the backend gained a flag.** For a
  running month with no prior close, `delta` is `monthlyHeadroom` — an ESTIMATE of
  what the wallets could still put in — not money observed moving. `memory/goals.md`
  already documented it as "an ESTIMATE of capacity, not money observed moving", but
  the client had no way to tell the two cases apart and labelled both "Đã góp"
  (already contributed), claiming money had moved when none may have. The domain now
  emits `isEstimate`, set in exactly the one place the substitution happens, and the
  card reads "Có thể góp" with a qualifying note. An observed delta is unaffected.
- **The running month is not history.** It has no result yet, so listing it in
  "Lịch sử đóng góp" invited its row to be read as one ("thiếu 17,1tr") when the month
  is merely unfinished. It keeps its own card above, which is the right home for a
  figure that is still moving. The recent-months bar chart still includes it — that is
  a live view, not a record.
- **§10.1 is a rule about which FONT carries diacritics, not a licence to remove
  them.** I had read "mono chỉ chạm chuỗi ASCII" as "make labels ASCII", and wrote
  "TAI SAN DA DANH". That is not Vietnamese — it is Vietnamese with the language
  taken out, and the same section routes "mọi văn bản tiếng Việt" to Be Vietnam Pro.
  `.label-vi` gives an accented label the same slot in the sans face; `.label` stays
  for genuinely ASCII strings. Tracking eases from 0.15em to 0.1em because uppercase
  diacritics need vertical room more than horizontal.
- Superseded allocation keys (`badgeContribution`, `badgeHolding`, `assetHolding`,
  `assetCurrentValue`, `monthlyLabelShort`, `countedLabelShort`) are now unreferenced
  but left in `resources.ts`; removing translations is a separate cleanup.

## Mobile app parity notes

- The section ORDER and every data source are unchanged, so parity is a presentation
  port, not a logic port.
- Worth porting: the holdings/recurring split and its two totals; the collapsed
  outflow summary line; the answer-left/chart-right ordering.
- Web-specific, do not port literally: the `lg:` two-column grids and the 260px hero
  side column — on a phone these all stack, which the web code already does below
  `lg`. The hover-row treatment needs a touch equivalent.
- New i18n keys must be mirrored in the mobile resources.
- **`isEstimate` is a shared-domain change** — the mobile app must not label a
  headroom figure as "đã góp" either. See `backend/memory/goals.md`.
- The running month must be excluded from the history list on mobile too; the
  chart's column hit-testing matters even more on touch.
