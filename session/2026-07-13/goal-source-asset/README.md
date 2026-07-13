# Goal contributions require a source wallet (chosen per contribution)

- **Date**: 2026-07-13
- **Session folder**: `session/2026-07-13/goal-source-asset/`
- **Status**: done

## What the task is

The nghiệp vụ: contributing to a goal is money moving out of a spendable wallet
into the goal, so **every contribution must name the wallet it comes from**
(cash / bank_account only), and that wallet is **debited**.

The user reported the concrete bug: the money-events endpoint accepted a
`goal_contribution` with **no `fromAssetId`**, so progress rose without any money
leaving a wallet — and the goal-card "Add amount" quick-row let you update
without picking a source at all.

**Where the source is chosen — final decision:** NOT on the goal (creating a goal
does not ask for a wallet). The source is picked **per contribution**, in the
quick-add row's required "Nguồn tiền" wallet picker.

> Note: an earlier iteration in this same session made the *goal* carry a
> required source wallet (reusing `financial_goals.linked_asset_id`). That was
> reverted per the user — the goal no longer stores a source; the column was
> dropped. Migrations `..._goal_source_asset_required` (add) then
> `..._drop_goal_linked_asset` (drop) are both in history.

## Changes made (final state)

### Backend (`backend/`)
- `modules/money-events/money-events.service.ts` — **the core fix.**
  `assertGoalContributionSource`: a `goal_contribution` requires a cash/bank
  `fromAssetId` (400 otherwise), on create + update. Direction stays `neutral`,
  so `applyWalletEffects` debits the wallet but it is NOT counted in the thu/chi
  summary (reuses `AssetsService.assertWalletAsset`).
- `prisma/migrations/20260713120000_goal_source_asset_required/` — (earlier
  iteration) made `financial_goals.linked_asset_id` NOT NULL. **Superseded by:**
- `prisma/migrations/20260713140000_drop_goal_linked_asset/` — DROP the column,
  its FK and index. Goal no longer stores a source wallet.
- `prisma/schema.prisma` — removed `FinancialGoal.linkedAssetId` / `linkedAsset`
  and `Asset.linkedFinancialGoals`.
- `modules/goals/*` — reverted to no `sourceAssetId` (entity, DTO, service, repo
  INSERT/UPDATE, module no longer imports `AssetsModule`); mapper + `toGoalCard`
  no longer read/return it.
- `memory/goals.md`, `memory/money-events.md` — documented.

### Frontend (`frontend-web/`)
- `features/goals/hooks/use-goals-page.ts` — `useAssets()` → `walletOptions`
  (cash/bank filter); per-goal `contributionSources` state (defaults each goal to
  the first wallet); `addContribution` sends
  `fromAssetId = contributionSources[goalId]` and blocks + toasts if empty.
- `features/goals/ui/components/goals-list-section.tsx` — the quick-add "Add
  amount" row gains a required "Nguồn tiền" `<Select>`; Update is disabled until a
  wallet is chosen.
- `features/goals/ui/goals-page.tsx` — passes `walletOptions` +
  `contributionSources` + `setContributionSource` through.
- Goal create/edit form (`goal-form-dialog.tsx`, `goals-form.ts`,
  `goals.types.ts`, `goals.repository.ts`) — **no** source field (reverted).
- `i18n/resources.ts` — `goals.actions.source` / `sourcePlaceholder` /
  `sourceEmpty` / `sourceRequired` (vi + en).
- `memory/goals.md`, `memory/money-events.md` — documented.

## Key decisions

- **Source is per-contribution, not per-goal.** The user's final call: creating a
  goal should not require picking a wallet; you choose the wallet each time you
  add money. So the goal's `linked_asset_id` was dropped and the picker lives on
  the contribution row.
- **Contributing debits the wallet but stays `direction = neutral`.** Financially
  correct: it moves money between your own pockets (net worth unchanged), like a
  transfer — it must NOT inflate monthly "chi". The debit happens because
  `applyWalletEffects` keys off `fromAssetId`, not direction; `debitManualAsset`
  is wallet-gated so only cash/bank move.
- **Validation reuses `AssetsService.assertWalletAsset`** — same cash/bank rule as
  income/expense/transfer and the asset-sale receiving wallet.
- Wallet picker filter (`cash | bank_account`) mirrors `use-asset-sale.ts`.

## Mobile app parity notes

- Goal create/edit form: **no** source-wallet field.
- Goal contribution (the "add amount" flow): add a **required** wallet picker
  (cash/bank_account only) per contribution; default to the first wallet; send
  `fromAssetId` on the `goal_contribution` event. Backend 400s without it.
- Goal card response has **no** `sourceAssetId`.
- Out of scope: contributions do not yet reduce the wallet if the wallet lacks
  balance beyond flooring at 0 (existing `debitManualAsset` behaviour).
