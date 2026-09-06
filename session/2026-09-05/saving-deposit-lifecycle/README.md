# Saving deposit: funding, withdrawal, maturity, value history

- **Date**: 2026-09-05
- **Session folder**: `session/2026-09-05/saving-deposit-lifecycle/`
- **Status**: done (backend + web); mobile deliberately not ported
- **Follows**: `session/2026-09-05/saving-deposit-form-wizard/`

## What the task is

The wizard fixed *entering* a deposit. A deposit still had no life after creation:

1. **Creating one moved no money.** Gold/crypto ask "đã có sẵn hay vừa mua"; a deposit
   never asked, so opening a 100tr passbook raised net worth by 100tr out of nothing.
2. **No way to get the money back out.** `saving_deposit` is absent from
   `SELLABLE_ASSET_TYPES`, so its detail page offered exactly one button: "Sửa".
3. **Maturity did nothing.** `AssetCalculationStatus.matured` existed in the schema and
   nothing had ever set it.
4. **The value chart was a flat line.** `writeSavingValuationAt` already wrote a dated
   point per accrued period — but accrual's only triggers were two `@Public()` endpoints
   for an external worker **that does not exist in this repo**. Nothing called them, so
   no interest had ever been credited, for anyone.

The product owner's model, chosen explicitly: **the deposit IS the account.** No second
asset — on maturity or withdrawal the same row converts and keeps its id.

## Changes made

**Backend**
- `prisma/schema.prisma` + migration `20260905120000_saving_base_principal` —
  `base_principal_amount` on `asset_calculation_terms`, backfilled from `principal_amount`.
- `common/utils/money-space.utils.ts` — `computeSavingSettlement(term, asOf)`, the single
  answer for both settlement paths, plus `SavingSettlement` / `SavingSettlementReason`.
- `modules/assets/assets.service.ts` — `convertDepositToWallet` (the primitive),
  `settleSavingDeposit` (payout + event + convert + announce), `settleMaturedDeposits`
  (per-household pass), `announceDepositSettled` (the notification seam).
- `modules/assets/saving-deposit.cron.ts` — **new**, 01:15 VN, accrue-then-settle.
- `modules/assets/assets.controller.ts` — `POST :assetId/withdraw`.
- `modules/money-events/money-events.controller.ts` — the two `@Public()` accrual
  endpoints **deleted**.
- `entities/calculation-term.entity.ts` — `basePrincipalAmount`, `status`,
  `DepositSettledEvent`; `common/audit/audit.types.ts` — `asset.deposit_settled`.
- Repository/mapper/interface plumbing for the two new term columns +
  `findHouseholdsWithActiveDeposits`.

**Core** — `assets-form.ts` (`saving_deposit` into `purchasableTypes`; `purchaseCostOf`
keyed on valuation mode), `assets.repository.ts` (+`withdrawSavingDeposit`),
`use-assets.ts` (+mutation), `i18n/resources.ts` (`assets.withdraw.*`,
`assets.form.deposit.acquisition*` / `payFrom*`, vi + en).

**Web** — `saving-deposit-form-dialog.tsx` (funding on step 2 + a review row),
`saving-withdraw-dialog.tsx` (**new**), `asset-detail-page.tsx` (the "Tất toán" action).

**Docs** — `backend/memory/asset-valuation.md`, `frontend/memory/{asset-valuation,assets}.md`.

## Key decisions

- **The deposit becomes the wallet; no second asset.** Keeping the id is what keeps the
  value history unbroken from "gửi 100tr" through every monthly step to "105,2tr dùng
  được", and it matches how the household already thinks about a passbook.
- **Settlement cannot go through `updateAsset`.** `assertIdentityUnchanged` refuses every
  type change and must keep refusing them — that guard is what stops someone re-typing
  cash into a stock. `convertDepositToWallet` is the one sanctioned exception, and it is a
  settlement rather than an edit.
- **`liquidity` is derived, never hardcoded to `usable_now`.** The
  `assets_liquidity_matches_type` CHECK rejects a contradictory row, and a household that
  excluded the deposit from flexible money keeps that answer.
- **`base_principal_amount` was unavoidable.** `capitalizeSavingInterest` rewrites
  `principalAmount` **in place**, so after the first monthly capitalization the amount
  actually deposited is destroyed — and both the early-withdrawal clawback and the
  wallet-destination payout are defined against money the household really put in.
- **Accrual owns the interest, settlement owns the principal.** `destination: wallet` pays
  back the deposit only (its interest already left as monthly events);
  `destination: principal` pays the running balance (the interest is already inside it).
  Paying `computeSavingOnTime`'s interest on top would pay it twice.
- **Clawback is deducted at settlement, never by rewriting history** (product owner's
  call). The monthly interest events that were already recorded stay exactly as they are.
- **Settled at the deposit's own maturity date, not today** (product owner's call), so a
  passbook entered months late lands in the month it actually matured.
- **Accrue then settle, in one job.** Two crons would make that ordering a scheduling
  coincidence; a capitalizing deposit would settle one month light.
- **Not `asset_sale`.** Adding `saving_deposit` to `SELLABLE_ASSET_TYPES` would switch on
  partial-sale UI everywhere that set is read (what-if funding, events quick action, row
  menu), and `status: 'sold'` is wrong for something becoming a live wallet.
- **Notifications: a seam, not a feature.** `announceDepositSettled` writes an
  `asset.deposit_settled` audit entry (NULL actor) and nothing else. No placeholder table,
  no no-op service — `memory/attention-items.md` records this codebase deleting
  `attention_items` for exactly that sin. The settlement's own money event is what makes it
  visible today: it appears in the events timeline, so the money is never silent.
  `DepositSettledEvent` is the payload contract an inbox will later consume.
- **Two real bugs fixed in passing**: `purchaseCostOf` returned NaN for any formula asset
  (so the affordability check silently passed), and the funding exclusion rested on a
  comment claiming a flow that did not exist.

## Verification

- `pnpm build` + `pnpm lint` (0 errors; 13 pre-existing warnings, none in changed files).
- `npm run build` + `npm test` in backend: 816 pass. The 1 failure
  (`vnstock-commodity.provider.spec.ts`, gold price names) is **pre-existing and
  unrelated** — nothing here touches market-data.
- `npx eslint` on every new/changed backend file: clean.
- Settlement maths checked against the worked example in `memory/asset-valuation.md`:
  matured+principal 106tr, matured+wallet 100tr, early@6mo end_of_term 100,1tr,
  early@6mo monthly 97,1tr (clawback 2,9tr). All match.
- **Not driven in a browser** — the user tests the UI themselves.

## Still open

- ~~The migration has not been applied.~~ **Applied 2026-09-06** after creating a deposit
  returned a 500 (`Unknown argument 'basePrincipalAmount'`). Two notes for anyone
  re-running it elsewhere:
  - This project applies schema with **`prisma db push`**, not `migrate deploy`, so
    `prisma/migrations/` is documentation rather than the mechanism.
  - `db push` was **deliberately not used** here: the pending diff also dropped
    `cashflow_events_household_id_category_id_idx`, pre-existing drift (that index is in
    the DB but not in `schema.prisma`) unrelated to this work. The ALTER + backfill were
    applied directly instead, then `prisma:generate`. **That index drift is still
    unresolved** — the next `db push` anyone runs will drop it.
  - Verified: column present and nullable, both existing rows backfilled from
    `principal_amount` with 0 mismatches, and a create + `status → matured` round-trip
    succeeds (run inside an aborted transaction, so nothing was written).
- The maturity cron has no test. The pattern it copies (`AssetsValuationCron`) has none
  either, so this matches the codebase — but the accrue-then-settle ordering is exactly the
  thing worth pinning.

## Mobile app parity notes

**Mobile is NOT ported.** Everything below is UI-only — the core model, the repository
call, the mutation and every i18n key are already shared.

1. `mobile/src/features/assets/components/asset-form-sheet.tsx` still has the **original
   blocking bug** from the previous session (required `nonTermRate` inside a collapsed
   `Disclosure`), and now also lacks the funding question. Both are fixed by porting the
   stepped sheet described in `session/2026-09-05/saving-deposit-form-wizard/`.
2. `mobile/app/assets/[assetId].tsx` needs the "Tất toán" action and a sheet equivalent to
   `saving-withdraw-dialog.tsx`. The gate is the same:
   `!isSold && type === 'saving_deposit' && !!calculationTerm`.
3. Nothing mobile-specific is required for maturity or value history — both are backend.
