# Lãi/lỗ hôm nay so với hôm qua (market-priced assets)

- **Date**: 2026-09-15
- **Session folder**: `session/2026-09-15/day-over-day-change/`
- **Status**: done

## What the task is

Market-priced holdings reprice every day and nothing on screen said so. The only
profit figure was against the **cost basis** — a long-run number that barely
moves. Added a **day-over-day change**: what a holding has done since its last
recorded point, on the asset detail page, on every list row, and as one
portfolio total, on web and mobile.

Backend work (the derived fields) lives in the backend repo; this log covers the
frontend and the decisions the mobile port needs.

## Changes made

**Shared (`packages/core`)**

- `features/assets/model/assets.types.ts` — new `AssetValueChange` /
  `AssetValueChangeTotal`; `valueChange?` on `Asset`.
- `features/assets/api/assets.repository.ts` — `valueChange` on `AssetRecord`,
  `valueChangeTotal` on the summary response.
- `features/assets/model/assets.ts` — `computePositionFxToVnd`,
  `computeCostBasis`, `computeCostBasisProfitLoss` (extracted from the two
  detail pages), plus `isPreviousDayOf` and `toneForValueChange`.
- `shared/lib/format-money.ts` — `formatPercent` / `formatPercentSigned`.
- `features/assets/hooks/use-assets-page.ts` — exposes `valueChangeTotal`.

**Web**

- `features/assets/ui/asset-detail-page.tsx` — a third hero metric; local
  `percentText` and the inline cost-basis maths deleted in favour of core.
- `features/assets/ui/components/asset-source-row.tsx` — a signed percent under
  the row amount, suppressed on a sold holding.
- `features/assets/ui/components/assets-summary-strip.tsx` — a day-change line
  beside the two operands, with the partial-total caveat.
- `features/networth/ui/networth-page.tsx` — passes it only on the assets tab.

**Mobile**

- `src/components/ui/summary-strip.tsx`, `grouped-row.tsx` — a `positive` tone;
  `GroupedRow` gains `valueMetaTone` so the delta line can carry colour while a
  running balance stays `ink3`.
- `app/assets/[assetId].tsx` — day-change tile, **cost-basis FX bug fixed**,
  `round1` removed in favour of `formatPercentSigned`.
- `src/features/assets/components/assets-list-section.tsx` — delta in
  `valueMeta`; sold wins the slot.
- `src/features/assets/components/assets-summary.tsx`, `app/(tabs)/networth.tsx`
  — the portfolio line, assets tab only.

**Copy** — `assets.detail.hero.{dayChange,changeSince}` and
`assets.summary.{dayChange,changeSince,dayChangePartial}`, vi + en.

## Key decisions

- **The baseline is the last recorded point, NOT yesterday.** Weekends and a
  skipped nightly run leave it days old, so the payload carries `previousDate`
  and the label switches to "Thay đổi từ {{date}}" whenever `isPreviousDayOf`
  says no. A three-day move must never be labelled yesterday's.
- **Colour is two-sided here, and ONLY here.** Green up, red down. This
  deliberately overrides the assets feature's alert-only rule (§5.2), because a
  signed delta shown as its own number is indistinguishable at a glance from its
  opposite when both are ink. `currentValue`, `costBasis` and the cost-basis P/L
  keep the old rule — the boundary is written into `toneForValueChange`.
- **Null renders nothing.** No baseline (created today, auto-price off, cron
  skipped the household) means no line — never "0%" or "+0đ". The portfolio
  total states `missingCount` rather than presenting a partial sum as complete.
- **Percent in a list row, đồng on a card.** A percent compares across rows of
  very different sizes; the detail card uses exact đồng because a 70.000đ day
  rounds to "0,0 tr" and reads as nothing having happened.
- **Sold beats the delta** in both list rows. A live green figure on a closed
  holding claims it is still moving.
- **`share` moved off the mobile strip.** `SummaryStrip` fits two tiles per row,
  so a fourth tile would have wrapped it onto a third row. Share now sits on the
  meta line below with the two percentages.

## Bug found and closed

`mobile/app/assets/[assetId].tsx` computed `costBasis` as
`purchasePrice * quantity` with **no FX conversion**, then compared it against a
đồng `currentValue`. At ~26.000 VND/USD every USD-quoted holding (crypto,
foreign currency) reported a catastrophic false loss. The correct derivation
existed only in the web file; extracting it to core fixed mobile as a
consequence. Kept as its own commit.

## Mobile app parity notes

Already done in this repo's `mobile/` — the list below is what a separate mobile
codebase would need.

- Add the `positive` tone to `SummaryStrip` and `GroupedRow`, plus
  `valueMetaTone` on `GroupedRow` (the delta is coloured; a running balance is
  not).
- Read `asset.valueChange` and `summary.valueChangeTotal`; never compute either
  client-side.
- Gate the portfolio line on the assets tab: the strip is shared with debts.
- **Do not port** the web's `formatVndExact` for the mobile cost basis. Mobile
  uses `formatVndShort` on that strip, matching its neighbours — a pre-existing
  divergence from the web, left deliberately unfixed here so the change stayed
  about the new figure. Worth revisiting on its own.
- `RowMeta`, not `RowMetaMono`, for the percentage line: it carries Vietnamese
  labels, and mono must never touch accented text.
