# List tables — shadcn Table sweep + row navigation

- **Date**: 2026-08-21
- **Session folder**: `session/2026-08-21/debts-list-table/`
- **Status**: done

## What the task is

From a screenshot of the debt list: drop the per-row "Chi tiết" link and make the row
itself navigate to the detail page; remove the "Người thân" and "8,3 tr" sub-lines.
Then, on follow-up: rebuild the list on shadcn's `Table` component, and apply the
same treatment to the asset list, the asset detail page's `relatedEvents` table, and
then across the rest of the app's hand-rolled tables.

## Changes made

- `src/features/debts/ui/components/debt-list-item.tsx` — rewritten as a `TableRow` /
  `TableCell`. The "Chi tiết" link is gone; the whole row navigates. The lender-type
  and next-payment-amount sub-lines are gone.
- `src/features/debts/ui/components/debts-list-section.tsx` — the hand-built grid
  header and the row wrapper became `Table` / `TableHeader` / `TableBody`. Loading and
  empty states are now `colSpan` rows inside the table.
- `src/features/debts/ui/debt-detail-page.tsx` — gained a "Loại bên cho vay" field.
- `src/i18n/resources.ts` — added `debts.detail.loan.lenderType` (vi + en); removed the
  orphaned `debts.demo.lenderType.*` blocks in both locales.
- `src/features/assets/ui/components/asset-list.tsx` — same conversion: the parallel
  grid header/row became one `Table`. The asset TYPE moved under the name rather than
  keeping a column, and the row's `role="button"` + manual `onKeyDown` was replaced by
  a real `<button>` on the name.
- `src/features/assets/ui/asset-detail-page.tsx` — the `relatedEvents` block was a
  hand-rolled `<table class="table-dense">`; now the shared primitives. Its mobile
  card list is KEPT — four columns genuinely do not fit a phone, and there the cards
  are a real reflow rather than a fallback for a horizontal scroll. Also fixed four
  hero `.label`s carrying accented Vietnamese, and removed dead code (an unused
  `Calculator` import and an unused `openWhatIf` selector) that `tsc -b` surfaced.

## Key decisions

- **The header/row misalignment in the screenshot was a real bug, not a rendering
  artefact.** The header and the row each declared their own
  `grid-cols-[1.2fr_1fr_…]`, and they had drifted: the header carried neither the
  row's `gap-x-4` nor its final column width, so every heading sat slightly left of
  its column and the narrow ones ran together ("DƯ NỢKỲ TỚI", "LÃI SUẤTPHỤ TRÁCH").
  Moving to a real `<table>` makes header and body share ONE set of column widths by
  construction, so that class of bug cannot recur — which is the strongest argument
  for the follow-up request, beyond consistency.
- **Row click plus a real button on the name.** A `<tr>` cannot be focused or
  announced as a control, so an `onClick` alone would leave keyboard and screen-reader
  users with no route to the detail page. The name is a `<button>`; the row handles
  the pointer. The menu cell stops propagation — opening a menu is not a request to
  navigate.
- **Lender type moved rather than deleted.** "Người thân" left the row as asked, but a
  loan from a relative is not the same kind of obligation as one from a bank, and the
  detail page had no such field. It now sits beside the lender name — one click away,
  which is where a qualifier belongs once the row is a summary.
- **`min-w-[900px]` on the table**, so eight columns SCROLL inside the component's
  `overflow-x-auto` container on a narrow screen instead of squeezing to unreadable
  widths. The old grid stacked on mobile; a table cannot, so scrolling is the
  replacement.
- Headers use `.label-vi`, not `TableHead`'s default `.label`: they are accented
  Vietnamese, and mono renders diacritics poorly (§10.1).

### The rest of the sweep

Converted to the shared `Table` primitive:

- `goals/ui/components/goal-monthly-progress-section.tsx` (+ its `MonthRow`)
- `assets/ui/components/asset-goal-usage-section.tsx` — its rows navigate to the goal,
  so they also gained the button-on-the-name keyboard route
- `dashboard/ui/components/upcoming-section.tsx`
- `dashboard/ui/components/assets-section.tsx`
- `dashboard/ui/components/debts-section.tsx`

Deliberately NOT converted, and why:

- `goals/ui/components/goals-list-section.tsx` and
  `forecast/ui/components/forecast-timeline.tsx`. Both are already real `<table>`s,
  but they use `table-fixed` with tuned percentage widths, `align-top` cells holding
  composite sub-components, per-cell rounded hover, and (in the timeline's case)
  several `<tbody>` groups for month grouping plus a deliberate stack-below-`lg`.
  Forcing them onto the primitive's defaults (`align-middle`, uniform `px-4`, one
  body) would mean fighting it in every cell for no gain. They got the `.label-vi`
  header fix only.

`table-dense` no longer appears anywhere in `src/features`.

Also restored diacritics on three more stripped labels now rendering in the sans face
(`assets.detail.goals.columns.*` → "Mục tiêu" / "Đang tính" / "Góp mỗi tháng") and
deleted the orphaned `goals.allocations.columns.*` block left over from the earlier
two-column rewrite.

### A verification note worth keeping

`npx tsc --noEmit` in this repo checks NOTHING: the root `tsconfig.json` has
`"files": []` and only references the two project configs, so a bare invocation
silently passes. The real gate is `npm run build` (`tsc -b`), exactly as CLAUDE.md
says. This surfaced when editing `debt-detail-page.tsx` invalidated the build cache
and revealed two pre-existing `noUnusedLocals` errors that a bare `--noEmit` had never
reported. A forced full `tsc -b --force` over the whole project now passes clean.

## Mobile app parity notes

- The row-navigates behaviour and the removal of the redundant "Chi tiết" affordance
  should port; on touch the row target matters more than on desktop.
- Do NOT port `min-w-[900px]` — a phone list should stack, not scroll horizontally.
  The web table scrolls only because a `<table>` cannot reflow.
- `debts.demo.lenderType.*` was removed; mobile should read `debts.form.lenderType.*`.
