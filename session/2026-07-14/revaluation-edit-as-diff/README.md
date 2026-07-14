# Edit asset_update (revaluation) as a DIFF, adjusting the balance

- **Date**: 2026-07-14
- **Session folder**: `session/2026-07-14/revaluation-edit-as-diff/`
- **Status**: done

## What the task is

The money-event edit flow for an `asset_update` (revaluation / "Định giá lại")
record was wrong on two counts:

1. The edit modal prefilled the amount field with the asset's **current balance**
   and asked the user to type a new **absolute value**.
2. The backend then **overwrote** the asset's value with that absolute number,
   ignoring any inflow/outflow that landed after the record.

The user wants the modal to show the **diff** (the change the record represented)
for re-entry, and the backend to **apply that diff to the balance** — adjusting,
not overwriting — so later events re-base correctly.

Worked example (from the user): cash asset 5tr → revalued to 4,5tr (diff −0,5tr),
then a +2tr inflow lands (balance 6,5tr). Editing the record must show diff −0,5tr;
changing it to −1tr must make the balance at that point 4tr and the current
balance 6tr.

## Changes made

- `src/features/events/model/events-form.ts` — added `revaluationDirection:
  'increase' | 'decrease'` to `ActualRecordForm`, `actualDefaults` (`'increase'`),
  and `buildActualSchema()` (`z.enum`). Only used by the revaluation edit branch.
- `src/features/events/hooks/use-events-page.ts` —
  - **Prefill**: for `asset_update`, seed the money field with `Math.abs(raw.amount)`
    (the record's stored diff magnitude) and set `revaluationDirection` from its
    sign — instead of the linked asset's `currentValue`.
  - **Submit**: send `amount = magnitude × (increase ? +1 : −1)` (a signed diff,
    may be negative) instead of `Math.abs(absoluteValue)`.
- `src/features/events/ui/components/actual-record-form.tsx` — in the
  `isRevaluation` branch, added a **Tăng / Giảm** segmented toggle (mirrors
  `auth-tabs.tsx` styling) bound to `revaluationDirection`, and renamed the field
  label from "Giá trị mới" to "Mức thay đổi" / "Số tiền thay đổi".
- `memory/asset-valuation.md` — documented the diff-edit contract.

## Backend changes (money-space-backend, for reference)

- `MoneyEventsService.updateMoneyEvent` (`asset_update` branch): interpret
  `next.amount` as the **new signed diff** (not an absolute value); persist it and
  call the new `AssetsService.applyRevaluationDeltaEdit`.
- `AssetsService.applyRevaluationDeltaEdit`: `manualValue += (newDiff − oldDiff)`
  (adjust, never overwrite); recover `valueBeforeEvent` via
  `sumEventContributionsAfter` and re-stamp the linked history point at
  `valueBeforeEvent + newDiff`.

## Key decisions

- **Diff sign via a Tăng/Giảm toggle**, not a signed money input — the shared
  `EventMoneyInput` + `moneyPattern` (`/^\d+$/`) only accept positive digits, so a
  toggle keeps the diff's direction explicit without touching app-wide validation.
- **Adjust the balance by `newDiff − oldDiff`** rather than setting an absolute
  value — this is what makes later inflows/outflows re-base automatically instead
  of being clobbered.

## Mobile app parity notes

- Port the same modal change: show the record's diff (magnitude + Tăng/Giảm
  direction), prefilled from the event's signed `amount`, not the asset balance.
- Port the submit change: send a **signed** diff as `amount`.
- The balance-adjustment + history-point logic is backend-side; mobile only needs
  the client contract (send signed diff; the card comes back with the persisted
  signed diff).
