# Saving-deposit interest schedule, early withdrawal & auto-crediting

- **Date**: 2026-07-11
- **Session folder**: `session/2026-07-11/saving-deposit-interest-model/`
- **Status**: done

## What the task is

Model real savings-deposit behaviour for the `saving_deposit` asset type, across frontend + backend:
- **Interest payment schedule** (`interestPayment`): cuối kỳ (`end_of_term`) vs hàng tháng (`monthly`).
- **Early withdrawal** (`nonTermRate`): withdrawing before maturity voids the contracted rate; a low
  non-term rate applies, and monthly-paid interest is clawed back from principal at settlement.
- **On-time vs early comparison** on the asset detail page, with an interactive "rút ở tháng N" slider.
- **Auto-crediting** the interest that has come due: each due period creates a money event linked to
  the deposit + an asset valuation. Destination is user-chosen: a wallet (cash/bank) or capitalized
  into principal.

## Changes made

### Frontend (this repo)
- `src/features/assets/model/assets.types.ts` — `CalculationTerm` gains `interestPayment`,
  `nonTermRate`, `interestDestination`, `receivingWalletId`; new `InterestPayment` / `InterestDestination`.
- `src/features/assets/model/assets.ts` — pure helpers `computeSavingOnTime`, `computeSavingEarly`,
  `termMonthsOf`, `savingTermYears`, `SavingBreakdown`.
- `src/features/assets/model/assets-form.ts` — form fields + defaults + `toAsset`/`fromAsset` +
  schema (require `nonTermRate` for saving; reject `> interestRate`; require wallet when dest=wallet).
- `src/features/assets/ui/components/asset-form-dialog.tsx` — interest-payment Select, non-term-rate
  input (saving only), interest-destination Select + wallet picker (saving only). New `walletOptions` prop.
- `src/features/assets/ui/components/saving-withdrawal-panel.tsx` — **new**: on-time vs early
  comparison card with a Slider + comparison Table.
- `src/components/ui/slider.tsx` — **new** shadcn Slider primitive (added `@radix-ui/react-slider`).
- `src/features/assets/ui/asset-detail-page.tsx` — renders the panel for saving deposits with a
  maturity date; Info-card rows for interest payment + non-term rate.
- `src/features/assets/hooks/use-assets-page.ts` — exposes `walletOptions`.
- `src/features/assets/ui/assets-page.tsx` — threads `walletOptions` to the dialog.
- `src/i18n/resources.ts` — vi + en keys: `assets.form.{interestPayment,nonTermRate,…,interestDestination,
  receivingWallet}`, `assets.detail.info.{interestPayment,nonTermRate}`, `assets.detail.withdrawal.*`,
  `options.interestPayment.*`, `options.interestDestination.*`.

### Backend (../backend)
- `entities/calculation-term.entity.ts` — new fields + `InterestPayment` / `InterestDestination`.
- Prisma: `non_term_rate`, `interest_destination`, `receiving_wallet_id` columns + two migrations.
  `interestPayment` reuses the existing `payoutFrequency` column.
- `money-space.mapper.ts` (read) + `prisma-assets.repository.ts` (write) — round-trip new fields.
- `money-space.utils.ts` — display helpers + `computeSavingInterestPeriods` (due-period generator).
- `money-events.service.ts` — `accrueSavingInterestForAsset` / `accrueHouseholdInterest` (idempotent).
- `assets.service.ts` — `getAssetEntity`, `writeSavingValuationAt`, `capitalizeSavingInterest`.
- `money-events.controller.ts` — `POST accrue-interest` (household) + `assets/:id/accrue-interest`.

## Key decisions

- **Display projections vs stored value are separate.** `computeCurrentValue` is unchanged (still the
  continuously-accrued value at `AS_OF`, ignores `interestPayment`). On-time/early figures are
  display-only. Auto-crediting is the separate source of dated valuation history + cash movement.
- **`interestPayment` reuses the DB `payoutFrequency` enum** — no new column for it.
- **Auto-crediting is idempotent + per-asset** (keyed by `(deposit,'interest',periodEnd)`), triggered by
  a dedicated `accrue-interest` endpoint an external worker calls — NOT a global cron (must scale to
  hundreds of thousands of users). Applies to both monthly (per-month) and end_of_term (once at maturity).
- **Accrual lives in `MoneyEventsService`** (which already imports `AssetsModule`) to avoid a module
  cycle; endpoints hang off the money-events controller.
- **Non-term rate is required only for `saving_deposit`** (optional/0 for bond/CoD/loan).
- Slider added via `@radix-ui/react-slider` + a hand-written shadcn primitive (matches `progress.tsx`).

## Mobile app parity notes

The mobile-app has a parallel `src/features/assets` (types, `assets.ts`, `assets-form.ts`,
`asset-form-sheet.tsx`, `use-assets-page.ts`, `i18n/resources.ts`). Port to match:
- Same `CalculationTerm` fields + `InterestPayment`/`InterestDestination` types.
- Same pure helpers (`computeSavingOnTime`, `computeSavingEarly`, `termMonthsOf`,
  `computeSavingInterestPeriods` if the mobile app also triggers accrual).
- Form: interest-payment picker, non-term-rate input, interest-destination + wallet picker; same
  validation. Detail screen: the on-time/early comparison + month picker.
- Same i18n keys (vi + en).
- Backend is shared — no mobile-specific backend work; the `accrue-interest` endpoints serve both.
