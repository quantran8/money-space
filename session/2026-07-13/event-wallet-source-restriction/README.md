# Event form: wallet pickers restricted to cash + bank account, source required

- **Date**: 2026-07-13
- **Session folder**: `session/2026-07-13/event-wallet-source-restriction/`
- **Status**: done

## What the task is

On the events form (income / expense / transfer / upcoming payment / goal
contribution), the wallet asset dropdowns should only offer **wallet-type assets
(`cash` + `bank_account`)** — not non-liquid holdings like stock or real estate.
Additionally, **selecting a source/destination wallet is required on create** for
these flows (the upcoming-payment source wallet was previously optional).

## Changes made

- `src/features/events/hooks/use-events-page.ts` — `assetOptions` now filters
  `assets` to `type === 'cash' || type === 'bank_account'`. This hook feeds every
  asset picker on the events form (actual `fromAssetId`/`toAssetId`, the goal
  "Đến asset nào" destination, and the upcoming `expectedFromAssetId`), so all of
  them are restricted in one place.
- `src/features/events/model/events-form.ts` — `buildUpcomingSchema` now requires
  `expectedFromAssetId` (superRefine issue "Vui lòng chọn ví nguồn"). Actual events
  already required a source/destination wallet via `eventRequiresFromAsset` /
  `eventRequiresToAsset` (expense/transfer/goal → from, income/transfer → to).
- `src/features/events/ui/components/upcoming-record-form.tsx` — moved "Nguồn tiền
  dự kiến" out of the collapsible "Thêm chi tiết" section to an always-visible
  field right after "Hạn trả", wired its error, and changed the placeholder from
  "Không bắt buộc" to "Chọn ví nguồn" (it is now required, so it can't stay hidden
  behind a collapsed section or the form would be un-submittable with no visible
  reason).

## Key decisions

- **Filter at the source (`assetOptions` in the page hook), not per-field.** Every
  events-form asset picker is a wallet source/destination, so a single filtered
  list keeps all pickers consistent (matches the existing `walletOptions` pattern
  in `use-asset-sale.ts`, which already filtered cash+bank).
- **Goal destination ("Đến asset nào") is also restricted to wallets** (per product
  decision this session), so it uses the same `assetOptions`.
- **Upcoming source wallet is required** to match the other flows. It defaults to
  `assetOptions[0]` on open, so the form stays valid by default when the household
  has at least one wallet; with no wallet, the required error correctly blocks
  submit.
- Editing an old upcoming payment that had no source wallet now requires picking
  one before saving — intended, consistent with the new rule.

## Mobile app parity notes

- Restrict the mobile events-form wallet pickers to `cash` + `bank_account`.
- Make the upcoming-payment source wallet required and surface it as an
  always-visible field (not tucked inside an optional/expandable section).
- Mirror the required-source validation for actual events (already the rule).
