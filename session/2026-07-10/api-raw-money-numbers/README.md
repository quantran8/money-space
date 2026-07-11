# API returns raw money numbers; frontend formats

- **Date**: 2026-07-10
- **Session folder**: `session/2026-07-10/api-raw-money-numbers/`
- **Status**: done

## What the task is

Backend stopped returning pre-formatted money strings (`"3,4M"`, `"+3,4M"`) and
now returns **raw numeric VND amounts only**. The frontend must format these
numbers itself for display. (DB always stored raw `Decimal` — nothing to change
there; the formatting lived in the backend response builders and was removed.)

## Changes made

Formatter:
- `src/shared/lib/format-money.ts` — added `formatVndSigned(value)` → `"+3,4M"` /
  `"-3,4M"` for signed money-event amounts (reuses `formatVndShort`).

Dashboard:
- `src/features/dashboard/api/dashboard.repository.ts` — `DashboardOverview` money
  fields are now `number` (`liquid`, `liquidSplit.cash/account`, `savings`,
  `debt`, `netWorth`); removed `liquidDisplay` / `netWorthDisplay`; defaults → 0.
- `src/features/dashboard/ui/components/net-worth-hero.tsx` — render
  `formatVndShort(snapshot.netWorth)` instead of `snapshot.netWorthDisplay`.
- `src/features/dashboard/hooks/use-dashboard-page.ts` — breakdown tiles use
  `formatVndShort(assetGroups[n]?.value ?? 0)` (raw number) instead of
  `valueDisplay`.
- `src/features/dashboard/ui/components/recent-events-section.tsx` — render
  `formatVndSigned(event.amount)`.

Events:
- `src/features/events/model/events.types.ts` — `MoneyEventItem.amount` is now a
  signed `number`; removed `amountValue`.
- `src/features/events/api/events.repository.ts` — response items no longer carry
  `amountValue`.
- `src/features/events/ui/components/events-data-table.tsx` — render
  `formatVndSigned(event.amount)`.
- `src/features/events/model/events-form.ts` — `toMoneyEventSeed` uses the numeric
  `event.amount` directly (no `parseAmountInput`).

Assets (type cleanup only — components already format raw numbers):
- `src/features/assets/api/assets.repository.ts` — dropped `currentValueDisplay`
  (AssetRecord) and `valueDisplay` (summary groups).
- `src/features/assets/model/assets.types.ts` — dropped `Asset.currentValueDisplay`.

Goals (type cleanup + simplification):
- `src/features/goals/api/goals.repository.ts` — `GoalRecord` dropped `current` /
  `target` strings (keeps numeric `currentAmount` / `targetAmount`).
- `src/features/goals/model/goals.types.ts` — `GoalItem.current` / `target` marked
  optional + deprecated.
- `src/features/goals/model/goals-form.ts` — `goalAmount(amount)` now takes just
  the number; all call sites dropped the legacy string fallback arg.

## Key decisions

- **Number is the contract.** API money fields are raw VND numbers; the client is
  the single place that formats. Reuse `formatVndShort` (`"3,4M"`) and
  `formatVndSigned` (`"±3,4M"`).
- **Money-event `amount` keeps its sign** (inflow > 0, outflow < 0) so a single
  numeric field encodes direction; `formatVndSigned` renders the `+`/`-`.
- **Dates untouched** — this task is money values only. `date` / `due` /
  `updatedAt` labels still come formatted from the backend.
- Payments/debts repositories already consumed the numeric API `amount` and built
  their own display strings locally, so they needed no change.

## Mobile app parity notes

- Mirror the same contract in mobile: API money fields are raw numbers; format on
  the client. Port a `formatVndShort` / `formatVndSigned` equivalent.
- `MoneyEventItem.amount` is a signed number (not a string, no `amountValue`).
- Drop any `*Display` / `current` / `target` string fields from mobile response
  types; use `currentAmount` / `targetAmount` / `value` / `currentValue` /
  `netWorth` numbers.
- Backend business-logic memory: `backend/memory/money-formatting.md`.
