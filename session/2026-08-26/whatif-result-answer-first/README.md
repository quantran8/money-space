# What-if result UI — answer-first

- **Date**: 2026-08-26
- **Session folder**: `session/2026-08-26/whatif-result-answer-first/`
- **Status**: done

## What the task is

Rebuild the what-if result UI to match a supplied HTML demo ("Oursight —
What-if visual first"). The demo is answer-first: one hero figure, the change
from today beside it, a three-metric row, then the affected items — and the
result takes over the dialog rather than sitting under the form.

Two scope calls made with the user before building:

- **The chart was dropped.** The demo's centrepiece is a balance-over-time
  line, but `WhatIfResult` carries no daily series. The engine has it
  (`ForecastResult.days: ForecastDay[]`) — `forecast.service.ts` simply never
  puts it on the response. Adding it is a backend + core-types change; the user
  chose to leave it out for now. Everything else in the demo shipped.
- **Result replaces the form** (the demo's own behaviour), rather than a
  two-pane desktop layout.

## Changes made

- `web/src/features/whatif/ui/components/whatif-result-blocks.tsx` — rewritten.
  The before → after `Row` is gone: the after-side lowest balance now leads at
  `t-hero` tinted by `RESULT_TYPE_CLASS`, with its date beneath and the delta
  as a `t-subhead` secondary figure that also states where it came from. Added
  the demo's three-metric row (`MetricCell` × 3, divider-separated, stacking on
  mobile) and turned the at-risk list into the demo's
  date / name / amount grid with a count and an attention-dot note. Goal-cost,
  goal-consequence and assumptions blocks are unchanged.
- `web/src/features/whatif/ui/whatif-sheet.tsx` — once `result` exists the
  three fields are replaced by the result and the question collapses into the
  dialog description (`{context} · {amount} · {date}`). Footer follows: form
  state shows only `Xem thử`; result state shows `Thử số khác` + `Chia sẻ`.
- `packages/core/src/i18n/resources.ts` — new `whatif` keys in **both** `vi`
  and `en`: `summary`, `summaryNoLabel`, `delta.*`, `metrics.*`,
  `blocks.atRiskCount`, `blocks.atRiskNote`.

## Key decisions

- **The spend is read off `result.input.amount`, not differenced out of the two
  balances.** It is the same figure on both sides of the question; subtracting
  two engine outputs to recover it would drift with rounding.
- **`whatif.actions.update` is now unused on web but was NOT deleted** — the
  mobile sheet still renders it. Same for `blocks.atRiskNone` and
  `flexibleDelta`.
- **The delta is stated once, not as before → after.** Two same-size figures
  made the reader do the subtraction before learning anything; "where it was"
  is only ever read as a distance from where it lands.
- **Still no verdict.** `resultType` picks a colour for the hero figure and
  nothing else — no "nên / không nên mua" (Voice). `pnpm lint`'s copy check
  passes.
- The third metric is `after.flexibleMoneyToday`, not the demo's "tiền vào đã
  biết": the demo's figure has no counterpart on `WhatIfResult`, and flexible
  money is the fact already on the response that answers the same worry. It is
  labelled as money left, never as an allowance.

## Mobile app parity notes

- `mobile/src/features/whatif/ui/whatif-result-blocks.tsx` and
  `whatif-sheet.tsx` still carry the old before → after layout and are
  untouched. Porting means the same two moves: hero + delta + metric row, and
  result-replaces-form. All the copy keys it needs already exist in both
  locales.
- Web-specific and NOT to be ported: the Tailwind `sm:` grid/divider classes on
  the metric row — RN needs its own stacking.
- If the chart is picked up later it is a **backend** change first
  (`forecast.service.ts` → expose the before/after `days` series on
  `WhatIfResult`), and both apps benefit.

## Known issues (pre-existing, not from this task)

`npx tsc -b` in `frontend/web` reports 117 errors across 13 files, every one of
them a `react-hook-form` import failure. Cause: `frontend/web/node_modules/`
does not exist, so the workspace link is missing and the package cannot resolve
from `web/`. `pnpm install` refuses to repair it non-interactively
(`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`) and was not forced. No file
touched by this task is among the 13; the what-if slice and `resources.ts`
typecheck clean when the root `node_modules` is on the search path.
