# Home — Tài sản | Nợ paired section

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/home-assets-debts-sections/`
- **Status**: done

## What the task is

The v4.0 Home was missing the **Tài sản | Nợ** block that the design demo and
`design.md` §9.1/§9.2 both call for. Home rendered Financial Picture → 30 ngày
tới → Mục tiêu chính → Tiền đang ở đâu → Nhật ký, skipping section 4.

## Changes made

- `src/features/dashboard/model/home-derivations.ts` — added `buildAssetRows`
  and `buildDebtRows` plus the `AssetHoldingRow`, `DebtRow`, `DebtSummary`
  types. Both are pure, matching the file's existing shape.
- `src/features/dashboard/ui/components/assets-section.tsx` — **new**. Mục ·
  Loại · Giá trị, capped at 4 rows, closing on a "Tổng tài sản, gồm tiền mặt"
  `TotalRow`.
- `src/features/dashboard/ui/components/debts-section.tsx` — **new**. Khoản ·
  Kỳ tới · Dư nợ, plus a repayment progress bar for the largest debt and a
  "Tổng dư nợ còn lại" `TotalRow`.
- `src/features/dashboard/hooks/use-dashboard-page.ts` — pulled `useDebts` into
  the fan-out (and into the skeleton gate), exports `assetSummary` /
  `debtSummary`.
- `src/features/dashboard/ui/dashboard-page.tsx` — renders the pair in a
  `grid lg:grid-cols-2 lg:items-start` between Mục tiêu chính and Tiền đang ở
  đâu. Docstring corrected (see below).
- `src/i18n/resources.ts` — `home.assets.*` and `home.debts.*` in **both** `vi`
  and `en`.

## Key decisions

- **`Kỳ tới` is joined from the forecast timeline** (`ForecastOccurrence.debtId`),
  not recomputed from each debt's own schedule. A second, independently derived
  schedule would let this section and "Ba mươi ngày tới" disagree about the same
  payment, with no way for the household to tell which is right (§2.7). A debt
  whose next payment falls outside the 30-day horizon shows no `Kỳ tới` rather
  than a backfilled guess.
- **No net worth on Home.** Both totals are shown; their difference is not.
  §5.3 puts net worth on the Tài sản page, and §2.6 rules it out as a hero
  because it does not help today's decision.
- **The old docstring was wrong and was corrected.** It listed "total assets"
  and "total debt" under *deliberately absent*, which contradicts §9.1. The
  spec excludes net-worth-**as-hero**, not the sections — the note was narrowed
  to say that.
- **Progress bar covers the largest debt only**, in neutral `ink3`, never
  accent. Averaging progress across debts of different sizes describes none of
  them; accent colour would turn a normal mortgage balance into a verdict (§16).
- **Money columns use `formatVndCell`; money outside tables uses
  `formatVndScale`** (§10.4: "Trong bảng: bỏ đơn vị ở từng ô, ghi ở header hoặc
  chú thích cuối bảng. Ngoài bảng: luôn kèm đơn vị"). So:
  - `Giá trị, tr` / `Dư nợ, tr` — unit in the HEADER, bare numbers in the cells.
  - `Kỳ tới` keeps its unit ("15/09 · 8,9 tr") — it is prose, not a bare money
    column.
  - Both `TotalRow`s keep theirs — a total is a sunk block outside the table
    (§11.2).

  Two corrections to an earlier reading of mine, both from the concurrent v4.0
  session, both right:
  1. I first kept units in the cells and argued a caption would contradict a
     "tỷ" cell. It only contradicts because units were in the cells at all —
     which is the thing §10.4 tells tables not to do. The §20 example tables
     show bare cells (`−12,1`, `36,1`).
  2. **Cells must never switch to tỷ.** `formatVndScale` flips above a billion;
     in a column that breaks the magnitude comparison the column exists for.
     `formatVndCell` holds everything in triệu, so a real-estate row renders
     `1.810,0` and still reads against `209,7` above it. The assets table is
     precisely where this would have bitten.
- **Row caps are disclosed** ("và N mục khác") so a capped table never reads as
  if the total came from the visible rows (§2.16).
- `lg:items-start`, not equal-height — the two panels are read as a pair, not
  compared row by row (§13).

## Mobile app parity notes

- Port both sections and the two derivations. `buildAssetRows` /
  `buildDebtRows` are pure and should move over unchanged.
- Per §9.3 the **mobile order has no Tài sản | Nợ block** — mobile is
  Financial Picture → 30 ngày tới → Mục tiêu chính → Tiền đang ở đâu → Cần cập
  nhật. The side-by-side pairing is web-specific; if these sections appear on
  mobile at all they must stack, and the ordering decision should be taken
  against §9.3 rather than copied from web.
- The i18n keys (`home.assets.*`, `home.debts.*`) are shared and should be
  copied verbatim into the mobile resources.

## Verification

- `npm run build` (tsc -b + vite) — passes.
- `node scripts/check-copy.mjs` — passes, no banned vocabulary.
- `npm run lint` — 6 errors / 8 warnings, **all pre-existing** in
  `goals/use-goals-page.ts`, `events/use-events-page.ts`,
  `assets/use-assets-page.ts`, `assets/use-asset-sale.ts`,
  `assets.repository.ts`, `components/ui/data-table.tsx`,
  `components/ui/motion.tsx`. No dashboard file is implicated.

## Note

Another Claude Code session was editing the same dashboard files concurrently
(the v4.0 migration). It was notified of the `src/i18n/resources.ts` overlap.
