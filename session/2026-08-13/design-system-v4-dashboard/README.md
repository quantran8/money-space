# Design system v4.0 — token layer + Home rewrite

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/design-system-v4-dashboard/`
- **Status**: done

## What the task is

Rebuild the dashboard to match a provided HTML demo, and bring the component
layer in line with the rewritten `family-finance-v3.1/design.md` (**v4.0**).

v4.0 is a visual-direction change, not a content change: the product IA, copy
rules and behaviour from v3.x stay, but every surface, colour, font and
component pattern is replaced. The old system was white-first with bordered
cards, soft shadows and an Apple-blue accent; v4.0 is **white panels on a tinted
page ground, layered by lightness, with no borders, no shadows and almost no
dividers** (§2.1–2.4), a saturated banking green accent, and Be Vietnam Pro +
IBM Plex Mono (§10.1).

Scope agreed with the user: migrate the **whole app**, and where the API does not
yet supply data the demo shows, render the real structure with an **empty state**
rather than mock numbers.

## Changes made

### Token layer

- `src/index.css` — rewritten. Defines the `ledger` (shipped) and `archive`
  (alternate) palettes as raw-hex CSS variables, maps every shadcn token onto
  them so existing screens keep working during migration, and replaces the old
  Apple utilities with the v4.0 ones: `.panel`, `.sunk`, `.num`, `.label`,
  `.nav-item`, `.table-dense`, `.seg`. Adds a `prefers-reduced-motion` block
  (§24) and a global `:focus-visible` outline.
- `index.html` — `lang="vi"` (the app is Vietnamese-first), `class="ledger"`,
  and the two web fonts.

### New shared primitives

- `src/components/ui/panel.tsx` — `Panel`, `PanelHeader`, `PanelSplit`, `Sunk`,
  `TotalRow`, `Label`. The §7.1/§7.2/§11.1–11.2 layout rhythm in one place.
- `src/components/ui/status-chip.tsx` — §11.6 dot + text.
- `src/components/ui/money-composition-bar.tsx` — §11.4 three-segment bar + legend.
- `src/components/ui/source-coverage-strip.tsx` — §11.5 freshness strip.

### Home

- `src/features/dashboard/model/home-derivations.ts` — **new**. All the pure
  logic: money composition, coverage, the running-balance timeline, the balance
  sparkline, money-location rows.
- `src/features/dashboard/ui/dashboard-page.tsx` — rewritten in the §9.1 order.
- New sections: `financial-picture-section`, `upcoming-section`,
  `main-goal-section`, `money-sources-section`, `activity-log-section`.
- **`assets-section` + `debts-section`** — the paired Tài sản | Nợ block, the
  one page-level two-column split (§9.2). Added by a second session working in
  parallel (see "Concurrency" below), along with `buildAssetRows` /
  `buildDebtRows` and the `useDebts` fan-out.
- Deleted (orphaned by the rewrite): `money-location-section`,
  `days-ahead-section`, `whatif-cta-section`. `flexible-money-section` and
  `financial-state-section` were **kept** — onboarding's "first picture" step
  still imports them.
- `dashboard-skeleton.tsx` — heights/radii now match the real sections so the
  layout does not shift on load.
- `use-dashboard-page.ts` — now composes the whole fan-out and gates the
  skeleton on all of it (see decisions).

### Shell

- `app-shell.tsx` — 240px sidebar per §7.4: no background of its own, no right
  border, what-if CTA under the logo, nav grouped Bức tranh / Quyết định / Nhà
  mình, household cluster at the foot. Removed the floating what-if FAB.
- `mobile-bottom-nav.tsx` — v4.0 tokens, §18 icons, 44px touch targets.

### Cross-cutting fixes

- **~75 files** rewritten off `hsla(var(--token), α)` / `hsl(var(--token))`.
  These *silently broke* the moment tokens became hex instead of HSL triplets —
  every tinted badge background would have rendered as nothing. Replaced with
  new named tint tokens (`--accent-tint`, `--attention-tint`, `--alert-tint`).
- `src/shared/constants/colors.ts` — liquidity chart palette re-derived (below).
- `src/i18n/resources.ts` — new `home.*` v4.0 copy and a `time.*` block (§10.5),
  both `vi` and `en`. Nav labels aligned to §16.3 vocabulary.
- `card.tsx`, `summary-strip.tsx`, `sub-section.tsx` and the shadcn primitives
  migrated to panel/sunk surfaces.

## Key decisions

- **The compat shim is deliberate.** `index.css` maps `--card`→`--panel`,
  `--muted`/`--secondary`→`--sunk`, `--primary`→`--accent`, etc. This let the
  whole app switch palette in one commit instead of breaking every unmigrated
  screen. It should be **deleted** once no component references the old names.
- **`--status-blue` and `--status-green` collapse onto `--accent`.** v4.0 has no
  blue and no separate green (§5.2). Any place that used green-vs-blue to mean
  two different things now reads as one colour — call sites were reviewed, but
  this is worth knowing.
- **Liquidity charts stopped using hue.** The old palette gave each bucket its
  own saturated colour (green/blue/orange), which broke §5.4 twice: amber is
  reserved for `attention`, and a neutral breakdown must not consume the colour
  budget. It is now a weight ramp — `accent` → `protect` → `committed` — the
  same encoding as the composition bar.
- **Home's skeleton is gated on the whole fan-out**, not per-section. The hero,
  the low point and the coverage strip are three readings of the same inputs;
  letting them arrive independently would let someone read a number before the
  strip that qualifies it exists (§2.15).
- **"Committed" money is derived, not fetched** — `total − protected − flexible`.
  This makes the three segments sum to the total by construction, so the bar
  cannot show a misleading gap.
- **Total cash excludes `long_term`.** Long-term holdings are not cash and must
  not inflate the "Tổng tiền mặt" line (§12.4).
- **The activity log renders an empty state.** No API supplies it. Per §2.14 it
  must only ever log *picture-level* changes (a balance update, a new upcoming
  item) and never individual purchases — logging those would turn the product
  into the expense tracker it explicitly is not (§0.2).
- **The `Phụ trách` column has no data yet** and renders a neutral placeholder.
  When it is wired, it must ask who is *responsible for* a source, never who
  spent from it (§16.4).

## Money formatting (§10.4)

Three formatters, and picking the wrong one is the easy mistake:

- `formatVndScale` — **outside** tables. Carries the short unit: `48,2 tr`,
  `1,81 tỷ`.
- `formatVndCell` / `formatVndCellSigned` — **inside** table cells. Bare number,
  no unit: `36,1`, `+32,0`, `−12,1`.
- `formatMoney` (and its `formatVndShort` alias, ~33 callers) — the
  currency-aware helper used off Home. Same scale, long unit words:
  `130,0 triệu`, `1,81 tỷ`.

All three now share `millions()` / `billions()`, so they cannot drift apart
again. The old `decimal()` helper — the source of the missing-trailing-zero
bug — is deleted rather than left for someone to reach for.

`formatMoney` also lost its **`nghìn` tier**: it used to render `500,0 nghìn`,
but §10.4 goes straight from triệu to whole đồng, so sub-million values are now
`500.000đ`. And its billions branch went from one decimal to two — it was
showing `1,8 tỷ` where the spec and §20 both show `1,81 tỷ`, rounding away tens
of millions.

Deliberately NOT changed: `amountToRaw` in `debts-form.ts`, which feeds form
inputs and must stay a bare integer string. The three `formatMoney` callers in
the debts feature are all display paths, so they take the spec formatting.

§10.4 is explicit: *"Trong bảng: bỏ đơn vị ở từng ô, ghi ở header hoặc chú thích
cuối bảng. Ngoài bảng: luôn kèm đơn vị."* So every money column on Home declares
its unit once in the header (`Số tiền, tr` / `Còn lại, tr` / `Số dư, tr` /
`Giá trị, tr` / `Dư nợ, tr`) and the cells below are bare. The §20 example tables
confirm it — they show `−12,1`, `+32,0`, `36,1` with no unit anywhere.

Two consequences worth knowing:

- **Cells never switch to `tỷ`.** Everything in a column stays in triệu, so a
  billion-scale row reads `1.810,0` rather than jumping to `1,81 tỷ` — a unit
  change mid-column destroys the comparison the column exists to support.
- **Always exactly one decimal** (`130,0`, not `130`). In a `tabular-nums`
  column the decimal points only align if every row has one, and a bare `130`
  beside `118,7` implies a precision it does not have. This fixed a real bug:
  `formatMoney`'s `maximumFractionDigits: 1` was dropping the trailing zero, so
  the hero rendered `130 triệu` where the spec and demo both show `130,0`.
- The `Kỳ tới` cell in the debts table **keeps** its unit — it is prose
  ("15/09 · 8,9 tr"), not a bare money column.

Deliberately NOT ported from the demo: its "Đơn vị: triệu đồng" caption. The
unit now lives in each column header, which §10.4 offers as the alternative to a
footnote, and a single fixed caption would be wrong for a table whose columns
could differ.

## Concurrency

Two Claude sessions worked in this repo simultaneously. The second added the
Tài sản | Nợ pair (§9.2) to `dashboard-page.tsx`, `home-derivations.ts`,
`use-dashboard-page.ts` and `resources.ts` while this session was migrating the
token layer and the shell. The two sets of changes were reconciled and verified
together: `tsc -b` clean, `vite build` green, `check-copy` passing, and both
sessions' i18n keys present in `vi` and `en`.

Worth knowing for the next person: `dashboard-page.tsx`'s docstring was narrowed
by that session from "total assets / total debt are deliberately absent" to
"**net worth as hero** is deliberately absent". That is the more accurate
reading — §9.1 does list the pair on Home; what §2.6/§5.3 exclude is net worth
as the hero number, and §2.13 excludes debt as a *hero metric*, not as a panel.

## Known gaps

- The activity-log feed and the per-source holder both need backend support.
- The three heavy detail pages (`goal-detail`, `asset-detail`, `debt-detail`)
  and the dense form dialogs still carry v3.x radii/spacing. They render
  correctly on the new palette via the shim but have not been restyled to the
  §11 patterns.
- Recharts colours are passed as inline JS props, so the six chart files needed
  hand migration and should be re-checked visually against real data.
- `npm run lint` reports 14 pre-existing problems (6 errors) in
  `use-events-page.ts`, `use-goals-page.ts`, `use-assets-page.ts` and others —
  all `react-hooks/set-state-in-effect`, all in files untouched by this task.

## Mobile app parity notes

- **Port**: the token set (§6), the five-section Home order (§9.1), everything in
  `home-derivations.ts` (pure, no DOM), the §10.5 timestamp ladder, and the rule
  that the coverage strip sits directly under the hero and is never hidden.
- **Do NOT port**: the 240px sidebar and `.nav-item` CSS (mobile uses the 5-item
  bottom nav, §8), `.table-dense` hover states, and the `hsla`→tint-token fix,
  which is a web-CSS-specific repair.
- Mobile opens what-if as a **bottom sheet**, not a modal (§15), and its CTA may
  be sticky — but it must remain the same single action as Home's (§9.3).
