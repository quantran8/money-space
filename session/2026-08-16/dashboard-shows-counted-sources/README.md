# Dashboard — show which sources count as usable money

- **Date**: 2026-08-16
- **Session folder**: `session/2026-08-16/dashboard-shows-counted-sources/`
- **Status**: done

## What the task is

Make Home show *which* items are counted as flexible money the household can
use. Follow-up to the per-asset "tính vào tiền linh hoạt" switch added earlier
today (`session/2026-08-16/asset-counts-as-flexible/`).

## Changes made

- `model/home-derivations.ts`
  - `buildCoverage` now filters `liquidity === 'usable_now'` (was: anything not
    `long_term`) and carries each source's `value`. That is exactly the set the
    forecast sums into `startingLiquidBalance`, so the block finally matches the
    claim its own doc-comment makes.
  - `buildMoneyLocationMap` groups `usable_now` vs `held` instead of
    `cash` vs `long_term`; `totalCash`/`totalLongTerm` → `totalUsable`/`totalHeld`.
- `components/ui/source-freshness-list.tsx` — optional `value` per row plus a
  `formatValue` prop; the row renders amount then age.
- `financial-picture-section.tsx` — passes `formatVndScale` as `formatValue`.
- `money-sources-section.tsx` — `GROUP_FILL` keyed by the new group keys.
- `i18n/resources.ts` (vi + en)
  - `home.picture.totals` — "trên tổng X **có thể dùng ngay**" (was "tiền mặt").
  - `home.coverage.summary` / `summaryNoAge` / `more` — "khoản đang tính".
  - `home.coverage.excluded` — was "Cổ phiếu, tiền mã hoá và bất động sản không
    tính vào tiền linh hoạt", which the switch can now make false. Now: "Đây là
    những khoản nhà mình đánh dấu là dùng được."
  - `home.location.group.usable_now` / `.held`.
- `memory/dashboard.md`.

## Key decisions

- **One definition of "money we can use" across the whole page.** §12.1 lists the
  counted sources and §12.4 groups by the same line. Before this, a savings book
  sat in §12.4's "Tiền mặt" group while the forecast never counted it — and after
  the switch, an asset the household explicitly turned off would have kept
  appearing there as spendable.
- **Amounts in the coverage list, not just names.** Row values come from the same
  `computeCurrentValue` the forecast uses (`getAssetRecords` and the forecast
  repository both call it), so the rows add up to the total stated above them.
  That is what makes the hero openable instead of asserted.
- **§12.4 stays two groups, not three.** A third neutral fill would have to be
  `--hair`, which is ~1.2:1 on the panel — invisible as a data mark. "Đang giữ"
  covers savings and long-term together; the breakdown lives on Tài sản, which
  the section already links to.
- **No copy may state the rule by asset type.** A single switch falsifies it.

## Mobile app parity notes

- Same rule: filter by `liquidity === 'usable_now'`, never by type.
- The coverage list needs the per-source amount; the API already carries it in
  `GET /api/assets/data-freshness` (`currentValue` per item).
