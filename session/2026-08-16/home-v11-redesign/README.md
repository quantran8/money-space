# Home v11 redesign (Tổng quan)

- **Date**: 2026-08-16
- **Session folder**: `session/2026-08-16/home-v11-redesign/`
- **Status**: done

## What the task is

Rebuild Home to the "Money Space — Tổng quan v11" mockup the user supplied, and
use **recharts** for the parts that are charts (previously hand-rolled SVG).

The mockup is four sections — Bức tranh hôm nay · Ba mươi ngày tới · Mục tiêu ·
Tiền đang ở đâu. The user confirmed the two sections it drops (Tài sản | Nợ and
Nhật ký) should come off Home, with their components left on disk.

## Changes made

- `src/features/dashboard/ui/dashboard-page.tsx` — four sections; dropped the
  Tài sản | Nợ pair, the activity log, and the `useActivity` query.
- `src/features/dashboard/hooks/use-dashboard-page.ts` — drops `useDebts` and
  `useFinancialState` (nothing renders them now), adds `useMembers` to resolve
  the holder name shown in the money map. Returns `goalTracks` + `moneyLocation`.
- `src/features/dashboard/ui/components/financial-picture-section.tsx` — section
  title, hero split into figure + unit, named source list, no status chips.
- `src/features/dashboard/ui/components/upcoming-section.tsx` — **recharts**
  `LineChart` of change-since-today (`stepAfter`, zero reference line, amber low
  point, tooltip); table limit 4 → 5; card layout below `lg`; ending-balance
  total row replaced by the "N khoản nữa · xem timeline" link.
- `src/features/dashboard/ui/components/goals-section.tsx` — **new**, replaces
  `main-goal-section.tsx` (kept on disk, no longer rendered). Up to 3 goals as
  straight tracks with the on-pace milestone tick.
- `src/features/dashboard/ui/components/money-sources-section.tsx` — table
  replaced by **recharts** ranked horizontal bars (`BarChart layout="vertical"`,
  per-source `Cell` fill by group, `minPointSize` stub, two-line Y tick with
  name + who is responsible, amount via `LabelList`). Built first as a
  `Treemap`; switched to bars on request, because with one dominant account the
  small cells had no room for a label and the bars keep every source named.
- `src/features/dashboard/model/home-derivations.ts` — `buildCoverage` rewritten
  (cash only, oldest first, capped); `buildBalanceLine` → `buildDeltaSeries`;
  new `buildGoalTracks`; `buildMoneyLocationRows` → `buildMoneyLocationMap`
  (returns `bars` ordered cash-then-long-term, capped at 6, plus `hiddenCount`);
  composition segments gain `percentLabel` + `unset`.
- `src/components/ui/source-freshness-list.tsx` — **new**; replaces
  `source-coverage-strip.tsx` (**deleted**, was Home-only).
- `src/components/ui/money-composition-bar.tsx` — legend is a 3-column grid;
  supports `<1%` / `>99%` labels and an "chưa đặt" row.
- `src/shared/lib/format-money.ts` — `splitVndScale` (figure/unit split, derived
  from `formatVndScale` so the two cannot drift).
- `src/features/dashboard/ui/components/dashboard-skeleton.tsx` — four blocks.
- `src/i18n/resources.ts` — new `units.million`, reworked `home.coverage.*`, new
  `home.goals.*`, `home.location.group/groupAria/smallest/totalValue`, new
  upcoming chart/dip/overflow keys. Both `vi` and `en` filled.
- `memory/dashboard.md` — updated to the v11 order and the new derivation rules.

Verified with `npm run build` (typecheck passes), `node scripts/check-copy.mjs`
(clean), and a throwaway fixture harness screenshotted in Chrome at 1280 and 420
wide. `npm run lint` still reports 5 pre-existing errors, all in files this task
did not touch (`use-events-page.ts`, `use-assets-page.ts`, `use-asset-sale.ts`,
`data-table.tsx`).

## Key decisions

- **The thirty-day chart plots change since today, not the balance.** A balance
  line is flat at household scale and its readability depends on how much money
  the household has; the delta gives a true zero baseline. `stepAfter`, because
  a balance holds flat and moves on the day something is paid. Chart only shows
  at ≥ 6 events.
- **The goal milestone uses only declared figures**: `target − (planned monthly ×
  months until target date)`. No contribution or no target date → no milestone.
  `behind` (amber) needs a gap of more than 10 points, so ordinary drift is not
  coloured.
- **Coverage narrowed to cash sources.** The hero is flexible money, which never
  includes long-term holdings, so a stale property valuation is not a caveat on
  it — and the block claims "N nguồn tiền mặt" in its own header.
- **Status chips dropped**, per the mockup: they stated a verdict before the
  reader had anything to check it against. `home.state.*` copy is retained.
- **Money location uses horizontal bars.** A treemap was built first and works,
  but for the realistic Vietnamese case — one bank account holding most of the
  cash — every other source becomes an unlabelled sliver. Bars keep the same
  proportional reading while giving each source a full row, so nothing has to be
  discovered by hovering. Capped at 6 rows; the group totals cover all sources.
  Fills are `--protect` / `--committed` (not `liquidityColors.usable_now`),
  because this is a fact, not a signal, and colour is reserved for action.

## Mobile app parity notes

- Port the section order, the delta-chart definition, the goal milestone formula
  and the cash-only coverage rule — these are domain rules, not web styling.
- The bar chart and the recharts line are web-specific implementations; mobile
  should reproduce the *encoding* (bar length = value, cash rows before
  long-term; delta vs today with a zero baseline), not the library.
- `home.mainGoal.*`, `home.assets.*`, `home.debts.*` and `home.activity.*` keys
  are still in `resources.ts` and still used by the components left on disk; do
  not delete them when porting.
