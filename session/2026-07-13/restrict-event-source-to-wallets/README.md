# Restrict income/expense/transfer event assets to wallets (cash / bank account)

- **Date**: 2026-07-13
- **Session folder**: `session/2026-07-13/restrict-event-source-to-wallets/`
- **Status**: done

## What the task is

Event creation/edit forms must only allow **cash / bank_account** assets as the
money source. Clarified by the user during the task:

- Applies to **income, expense (outcome), transfer** events — both the source
  (`fromAssetId`) and, where present, the destination (`toAssetId`) must be a
  wallet (cash / bank_account).
- Enforce on the **backend** too, not just the frontend UI.
- **Exception — `asset_sale`**: its source is the sold asset (a non-wallet, e.g.
  gold/stock), which is allowed. But the sold asset must be **view-only** — it
  can be seen when editing a sale, never changed.

## Changes made

Frontend (`frontend-web`):

- `src/features/events/hooks/use-events-page.ts` — added a memoized
  `sourceAssetOptions` (assets filtered to `type === 'cash' | 'bank_account'`);
  default source/destination selection (`expectedFromAssetId`, `fromAssetId`)
  now seeds from it; returned it from the hook.
- `src/features/events/ui/events-page.tsx` — thread `sourceAssetOptions` into
  `EventFormDialog`.
- `src/features/events/ui/components/event-form-dialog.tsx` — accept + forward
  `sourceAssetOptions` to both forms; upcoming form no longer receives the full
  `assetOptions`.
- `src/features/events/ui/components/actual-record-form.tsx` — source select
  (`fromAssetId`) and the income/transfer destination select (`toAssetId`) now
  map over `sourceAssetOptions`. goal_contribution's destination still uses the
  full `assetOptions`.
- `src/features/events/ui/components/upcoming-record-form.tsx` — expected-source
  select (`expectedFromAssetId`) now uses `sourceAssetOptions` (replaced the
  `assetOptions` prop entirely). Also **moved this select out of the "Thêm chi
  tiết" (show-more) block into the always-visible body**, so every asset select
  is visible up front (income/expense/transfer already had theirs visible).

Backend (`backend`):

- `src/modules/assets/assets.service.ts` — added `static isWalletAssetType()`
  and public `assertWalletAsset()` (throws 400 for a non-wallet asset), reusing
  the existing `WALLET_ASSET_TYPES` set.
- `src/modules/money-events/money-events.service.ts` — added
  `WALLET_ONLY_EVENT_TYPES = {income, expense, transfer}` and
  `assertWalletLinks()`; called it at the top of `createMoneyEvent` and in
  `updateMoneyEvent` (on the resolved `next`), before any wallet balance moves.

Memory (both repos):

- `memory/money-events.md` (backend + frontend-web) — documented the wallet-only
  link rule and the asset_sale view-only exception.

## Key decisions

- Kept two option lists (`assetOptions` full, `sourceAssetOptions` wallets)
  rather than globally restricting `assetOptions`, so goal_contribution's
  destination (which legitimately targets non-wallet assets) is untouched.
- `asset_sale` was **already** safe: it's excluded from the backend wallet check,
  and its sold asset is already fixed context (header only) in `AssetSaleDialog`
  — no form field to change — so "view-only source" needed no code change.
- Backend validation runs **before** opening the write transaction, returning a
  400 up front instead of failing mid-write.

## Mobile app parity notes

- Mirror the wallet-only source/destination restriction in the mobile event
  forms for **income / expense / transfer** (both from and to fields → cash /
  bank_account only). goal_contribution destination stays unrestricted.
- Ensure the mobile asset_sale edit flow keeps the sold asset view-only.
- Backend change is shared — mobile just needs to handle the new 400 gracefully.
