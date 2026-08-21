# Goal money counts as "đã có nhiệm vụ"

- **Date**: 2026-08-20
- **Session folder**: `session/2026-08-20/goal-money-is-committed/`
- **Status**: done

## What the task is

"Đã có nhiệm vụ" on the Home screen was not counting money set aside for goals.

It was a reverse subtraction — `totalLiquid − flexible` — where `flexible` was
`lowestProjectedBalance`, which only removes near-term BILLS. `startingLiquidBalance`
summed every `usable_now` asset with no goal awareness at all (the whole forecast
module had zero references to goals). So a household with 20tr of a 22tr wallet
promised to the car was told it had 22tr flexible, and could spend money it had
already assigned.

## Changes made

**Backend** (`money-space-backend`)

- `goals/domain/goal-progress.ts` — `resolveGoalCommittedAmount(claims, assetValues)`:
  money set aside behind goals, plus what this month's pace can still draw from
  what is left (via the existing `resolveWalletShareByGoal`).
- `goals.service.ts` — `resolveGoalCommitments(householdId, assetValues)`.
- `forecast/domain/flexible-money.ts` — `computeFlexibleMoney` takes an optional
  `goalCommitments` (default 0) and returns it on the result.
- `forecast/domain/forecast.types.ts` + `forecast.ts` — `ForecastResult` now
  carries `liquidSources`, the `usable_now` rows `startingLiquidBalance` was
  summed from.
- `forecast.service.ts` — `flexibleMoney`, `financialState` and `forecastBundle`
  all pass the figure, computed from `forecast.liquidSources`.

**Frontend**

- `features/forecast/model/forecast.types.ts` — optional `goalCommitments`.
- `features/dashboard/model/home-derivations.ts` — the flexible slice subtracts
  goal money (floored at 0; the bar is a split of what exists).
- `features/dashboard/ui/components/financial-picture-section.tsx` — the hero
  figure subtracts it too, **unclamped**, so the two cannot disagree.

## Key decisions

- **Both halves count (the user asked for "cả A và B")**: money already set aside
  AND this month's contribution.
- **They must not double-count.** A wallet with 28.8tr holding 20tr set aside can
  feed a 20tr pace by at most the 8.8tr still free — the rest of that pace would
  come out of money already counted. Adding the raw figures on the real database
  gave **140tr against 109.8tr of actual money**, with all three wallets over.
  The fix reuses `resolveWalletShareByGoal`, which is free-room-only by
  construction and already handles priority and the declared shares.
- **Liquidity comes from the forecast, not a second query.** The value map is
  built from `ForecastResult.liquidSources`, so the attribution cannot disagree
  with the total it attributes. Gold behind a goal adds nothing — it was never in
  the liquid total.
- **`liquidSources` is carried on the result** rather than reloaded: an earlier
  attempt called `loadInput` again and broke the "serves … from one load" test,
  which is a real per-request query regression, not a test detail.
- **Clamping differs by surface, deliberately**: the composition bar floors the
  flexible slice at 0 (it is a split of what exists); the hero figure stays
  negative-capable, because that is the signal the product exists to surface.

## Mobile app parity notes

- Read `flexibleMoney.goalCommitments` and subtract it from
  `lowestProjectedBalance` for both the hero figure and the committed/flexible
  split. Field is optional — treat a missing value as 0.
- Keep the clamping asymmetry: bar floored at 0, hero unclamped.
- All the arithmetic is server-side; nothing to reimplement on the client.
