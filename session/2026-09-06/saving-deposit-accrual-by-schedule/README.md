# Saving deposit: interest must follow the payout schedule

- **Date**: 2026-09-06
- **Session folder**: `session/2026-09-06/saving-deposit-accrual-by-schedule/`
- **Status**: done (backend + core); mobile inherits it via `packages/core`
- **Follows**: `session/2026-09-05/saving-deposit-lifecycle/`

## What the task is

User created a 100tr deposit today, trả lãi **cuối kỳ**, and it immediately showed
**101.189.041đ**. Three separate faults, found in order:

1. **The migration from the previous session had never been applied.** Creating a
   deposit 500'd with `Unknown argument 'basePrincipalAmount'`.
2. **The form default back-dated every deposit.** `startDate` defaulted to the `AS_OF`
   constant (`'2026-07-06'`) instead of today, so the deposit was 62 days old at birth
   and the app accrued interest for days it did not exist.
3. **The real bug, which the date was masking:** `computeCurrentValue` accrued
   straight-line daily for EVERY formula type, ignoring `interestPayment` entirely.

## Changes made

**Migration applied** — `base_principal_amount` added + backfilled. Notes below.

**`AS_OF` no longer a form default** — `packages/core/.../assets-form.ts`
- `todayIso()` (local parts, not `toISOString()`, which would roll over to tomorrow
  for VN's UTC+7 in the evening) and `freshAssetFormValues()`.
- `use-assets-page.ts` seeds and resets from `freshAssetFormValues()`, so the date
  resolves at each open rather than freezing at import.
- `AS_OF` keeps its read-fallback role, with a doc block saying why it is not a default.

**Valuation follows the payout schedule** — `backend/.../money-space.utils.ts`
`computeCurrentValue` and `frontend/packages/core/.../assets.ts` `computeFormulaValue`,
kept mirrored:
- **`end_of_term`** → principal until maturity, then principal + full-term interest.
- **`monthly`** → steps on the deposit's own day each month via new
  `wholeMonthsBetween(start, horizon)`, counting with `addMonthsIso`.

**Data corrected** — 3 records carried the stale start date; fixed to their asset's
creation date with maturity shifted by the same offset (term length preserved), then
`current_value` and today's valuation row recomputed under the new rule.

**Docs** — `backend/memory/asset-valuation.md`, `frontend/memory/asset-valuation.md`.

## Key decisions

- **`end_of_term` is worth its principal until it pays.** Daily accrual was not merely
  early, it was a number that will never exist: break such a passbook and the bank pays
  the NON-TERM rate (often 0,2%/năm) on elapsed days. What it is really worth before
  maturity is `computeSavingEarly`, which is exactly what the withdrawal flow pays out.
- **`monthly` steps, it does not slope** (user's explicit instruction: "lãi chỉ được cộng
  đúng vào ngày bắt đầu gửi của các tháng"). Gửi ngày 06 ⇒ nothing until the 06th of the
  next month. Counting via `addMonthsIso` means the displayed value and the credited
  payouts share one definition of "a period is due", including the 31/01 → 28/02 clamp.
- **Only `monthly` keeps the old behaviour** — confirmed with the user.
- **Existing rows were corrected rather than left** (user chose "sửa ngày gửi = ngày tạo").
  Maturity shifted with the start so a 12-month term stays 12 months.
- **`db push` was NOT used to apply the migration.** The pending diff also dropped
  `cashflow_events_household_id_category_id_idx` — pre-existing drift (in the DB, absent
  from `schema.prisma`) unrelated to this work. Applied the ALTER + backfill directly,
  then `prisma:generate`.

## Verification

- Backend `npm run build` + `npx eslint` on changed files: clean. `npm test`: 816 pass,
  the 1 failure (`vnstock-commodity.provider.spec.ts`) is **pre-existing and unrelated**.
- Frontend `pnpm build` + `pnpm lint`: 0 errors (13 pre-existing warnings).
- Stepping verified: gửi 06/09 @7% ⇒ 06/09 và 05/10 = 100.000.000đ; 06/10 = 100.583.333đ;
  06/11 = 101.166.667đ. `end_of_term` flat at 100tr until maturity day, then 107tr.
  Month clamp: gửi 31/01 ⇒ 28/02 counts as the first anniversary.
- Live data after the fix: "sổ VP" và "Tiết kiệm VCB" both read exactly 100.000.000đ.
- **Not driven in a browser** — the user tests the UI themselves.

## Still open

- **`debts-form.ts` has the same hardcoded-date bug**: `borrowedAt: '2026-07-08'` in its
  defaults. Not touched — outside what was reported.
- **`cashflow_events_household_id_category_id_idx` drift is unresolved.** The next
  `db push` anyone runs will drop it. Decide whether it belongs in `schema.prisma`.
- No test pins the payout-schedule branch. It is the kind of rule that silently regresses.

## Mobile app parity notes

**No mobile-specific work is needed for the valuation fix** — `computeFormulaValue` lives
in `packages/core` and mobile already consumes it.

The `AS_OF` form-default fix is also inherited: mobile references neither
`defaultAssetFormValues` nor `freshAssetFormValues` directly (grep over `mobile/src` is
empty) — it seeds through the shared `useAssetsPage` hook, which now uses the fresh
values. **Mobile needs no change for either fix.**
