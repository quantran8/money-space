# Debt interest periods — proper persistence (remove note hack)

Date: 2026-07-10

## Task

The debt form supports multi-stage interest (rate %/year + months per stage) and
auto-computes the periodic repayment. The first cut serialized the stages into a
JSON blob appended to `note` (`@@debt-interest@@{...}`) — a hack. This task
replaces that with real persistence: each stage is stored as its own row in the
existing `debt_interest_periods` table, and read back as an array.

Also part of this work stream (earlier same day): view-detail dialog + delete
action for debts, and the original 500 fix (free-form `interestType` string was
being written to a strict Prisma enum column).

## Backend changes (`money-space/backend`)

- `entities/debt.entity.ts` — new `DebtInterestPeriod` interface; `Debt` gains
  `interestPeriods?: DebtInterestPeriod[]`. Each stage carries `interestRate`,
  optional `months` (stage length; omitted = remaining term), and `start/endDate`.
- `dto/create-debt.dto.ts` — `CreateDebtDto` gains `interestPeriods?`.
- `debts.service.ts` — create maps `payload.interestPeriods` into the entity;
  update already spreads `...payload` so it flows through.
- `repositories/prisma-debts.repository.ts`:
  - `upsertDebtInterestPeriods` rewritten: soft-deletes existing rows then
    `createMany` one row per stage in a `$transaction`. Start/end dates are
    derived by walking `borrowedAt` forward by each stage's `months`; the stage
    length is stored in the row `note` as `months:N` for exact round-trip. Falls
    back to a single row from `interestRate` for backward compatibility.
    Helpers added: `encodePeriodNote`, `addMonths`.
  - list/find `include.interestPeriods` no longer `take: 1` — returns all rows,
    ordered `startDate asc`. Both `mapDebt` calls now pass the full array.
- `common/repositories/money-space.mapper.ts` — `mapDebt` gains a `periods?`
  param and builds `interestPeriods[]`; helpers `mapInterestPeriod` +
  `monthsFromPeriodNote` (decodes `months:N`).

## Frontend changes (`money-space/frontend-web`, feature `debts`)

- `model/debts.types.ts` — new `DebtInterestPeriodDto`; `DebtItem` gains
  `interestPeriods?` and `interestCalculation?`. Removed the old `rawNote`.
- `model/debts-interest.ts` — removed `encodeInterestNote`/`decodeInterestNote`
  and the `@@debt-interest@@` marker. Added `toInterestPeriodDtos` /
  `fromInterestPeriodDtos` (form <-> DTO) and `calcFromBackendEnum` (inverse of
  `calcToBackendEnum`; `reducing_balance`->fixed, `flat_rate`->reducing).
- `api/debts.repository.ts` — request/response types carry `interestPeriods`;
  `toDebtItem` reads `interestPeriods` + `interestCalculation` directly (no note
  parsing).
- `hooks/use-debts-page.ts` — submit sends `interestPeriods` (via
  `toInterestPeriodDtos`) and a plain `note`; edit rehydrates stages via
  `fromInterestPeriodDtos` and calc via `calcFromBackendEnum`.
- `ui/components/debt-detail-dialog.tsx` — reads `debt.interestPeriods` /
  `debt.interestCalculation` instead of decoding the note.

## Key decisions

- Reuse the existing `debt_interest_periods` table rather than adding a column or
  keeping the note hack. Stage length (`months`) is relative and user-facing, so
  it's stored in the row `note` as `months:N` to round-trip exactly instead of
  being re-derived from the date range.
- Stage dates are computed forward from `borrowedAt`; the last stage extends to
  `expectedFinalDueDate` when known.
- `interestRate` (averaged) and `interestType`/`interestCalculation` enums are
  still sent for backward-compat and for the list badge / summary.

## Verified

- `tsc` + eslint clean on both repos.
- Ran a Prisma script against the real DB: a 2-stage schedule (9%/2mo, 15%/5mo)
  persisted as 2 rows with correct contiguous dates
  (07-08→09-08, 09-08→02-08) and `months:N` notes; read back as an array.

## Mobile parity TODO

Port the same shape to the mobile repo: debt payload/response `interestPeriods[]`,
the multi-stage interest UI (rate + months, add/remove stage), calc-method
selector, and the auto-computed repayment estimate. No more note serialization.
