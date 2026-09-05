# Drop the asset delete-impact fetch; warn generically instead

- **Date**: 2026-09-05
- **Session folder**: `session/2026-09-05/drop-asset-delete-impact-fetch/`
- **Status**: done

## What the task is

Deleting an asset no longer calls `GET .../assets/:id/delete-impact` to fetch
exact counts for the confirm dialog. The dialog now shows one fixed warning.

Applied to **both web and mobile** (user decision), so the shared hook could go
rather than being kept alive for one platform.

## The constraint that shaped this

The endpoint was doing TWO jobs, not one:

1. supplying the numbers for the warning copy — what was asked to go, and
2. supplying `isClear`, which the UI turned into the `cascade` flag.

`assets.service.ts:1700` throws a **409 `asset_in_use`** when
`!impact.isClear && !cascade`. So simply deleting the fetch would have left
`cascade` permanently `false` and broken delete for exactly the assets the
warning is about.

**Resolution:** the dialog now always sends `cascade=true`. That is consistent
with the backend's own comment — *"the household is asked first, `cascade` is
their answer"* — the dialog IS the confirmation. The server-side guard is
untouched, so nothing can be deleted without a user having confirmed.

## Changes made

- `packages/core/src/i18n/resources.ts` — replaced three interpolated keys
  (`removeAlsoDetaches`, `removeDeletesMoneyEvents`,
  `removeLeavesGoalsWithoutWallet`) with one generic `removeImpactNotice`, vi + en.
  It still names the irreversible part: linked goals/events/debts get detached,
  recorded movements are deleted, past months' totals change.
- `web/src/features/networth/ui/networth-page.tsx` — dropped the hook, collapsed
  the four-part description to two lines, `cascade` now hardcoded `true`,
  `confirmDisabled` no longer waits on a fetch.
- `mobile/app/(tabs)/networth.tsx` — the same (note: mobile's ConfirmDialog prop
  is `consequence`, not `description`).
- **Deleted** `packages/core/src/features/assets/hooks/use-asset-delete-impact.ts`.
- **Deleted** the now-dead `assetDeleteImpact()` in `assets.repository.ts`, the
  `assetDeleteImpact` query key, and the `AssetDeleteImpact` type.
- Fixed two comments in `use-assets-page.ts` / `use-assets.ts` that still
  referred to the deleted hook.

## Key decisions

- **`cascade` is now unconditional on the client.** This is the one real
  behaviour change. Accepted because the dialog states the cost before asking
  and the server still refuses an unconfirmed delete.
- **The backend endpoint was NOT removed.** Only the client stopped calling it.
  Removing it is a separate backend decision.
- **Copy still names the irreversible consequence.** Per `memory/` (asset delete
  destroys its money events and past months' totals move), losing the exact
  count is fine but losing the *warning* would not be.

## Trade-off accepted

The dialog now shows the same caution for every asset, including a brand-new one
that links to nothing. Deliberate: one fewer round-trip on every delete, and the
household's decision is the same either way.

## Mobile app parity notes

Already done in the same pass — web and mobile match. No follow-up needed.

Verified: `pnpm build` ✓, `pnpm lint` 0 errors, copy check ✓, mobile `tsc --noEmit`
has exactly ONE error and it is **pre-existing and unrelated**
(`app/debts/[debtId].tsx:484`, a `repaymentEstimate` prop missing on
`DebtFormSheetProps` — untouched by this task).
