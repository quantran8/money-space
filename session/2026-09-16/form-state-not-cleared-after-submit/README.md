# Form state not cleared after submit

- **Date**: 2026-09-16
- **Session folder**: `session/2026-09-16/form-state-not-cleared-after-submit/`
- **Status**: done

## What the task is

Every form in the app kept its values after submitting: closing the dialog and
opening it again showed the previous entry.

## Root cause

`useForm` lives in the PAGE hook, not in the dialog. Radix unmounts the dialog
content on close but the hook's form state survives, so the values — and
`isDirty` — persist. No hook reset after a successful submit; they all relied on
a "seed on open" effect to clean up.

Two of them could not:

- `use-events-page.ts` — the seeding effect bails on `if (isActualDirty) return`
  (added so a background refetch cannot overwrite what the user is typing).
  Only `reset()` clears `isDirty`, and that guard blocks the `reset()`. After
  the first submit the form is dirty forever, so every later open — create OR
  edit — kept the previous entry.
- `use-asset-quantity.ts` — the seeding effect keys on `[mode, asset]`. Closing
  nulls both, so re-opening the SAME asset produces identical deps, the effect
  never re-runs, and the dialog keeps the old price.

The other hooks worked only because `formOpen` happened to be in their deps.

## Changes made

Reset on close, in the hook, so `isDirty` clears and the seeding effect stops
being the only thing standing between the user and a stale form:

- `packages/core/src/features/events/hooks/use-events-page.ts` — `resetActual(actualDefaults)` in `handleFormOpenChange`
- `packages/core/src/features/assets/hooks/use-asset-quantity.ts` — reset both forms in `close()`
- `packages/core/src/features/assets/hooks/use-asset-sale.ts` — reset in `closeSale()`
- `packages/core/src/features/assets/hooks/use-assets-page.ts` — reset in `handleFormOpenChange`
- `packages/core/src/features/goals/hooks/use-goals-page.ts` — reset in `handleFormOpenChange`
- `packages/core/src/features/cashflow/hooks/use-cashflow-form.ts` — reset in `handleFormOpenChange`
- `packages/core/src/features/debts/hooks/use-debts-page.ts` — reset in `onOpenChange`; the repayment-estimate branch called `setDialogOpen(false)` directly, bypassing every cleanup — now goes through `onOpenChange(false)`

`use-feedback.ts` already reset correctly; left alone.

Dialog-local state (step, disclosure, touched flags) had the same leak: it was
only cleared in the component's own close handler, which a save-then-close from
the hook never reaches. Fixed by keying the content on an open counter so the
remount discards it:

- `web/src/features/debts/ui/components/debt-form-dialog.tsx` — step / furthestStep / outstandingTouched
- `web/src/features/cashflow/ui/components/cashflow-event-form-dialog.tsx` — detailsOpen
- `mobile/src/features/assets/components/asset-form-sheet.tsx` — showMore
- `mobile/src/features/assets/components/asset-price-update-sheet.tsx` — price / error (the lazy initial price only ever ran on first mount)

## Key decisions

- **Reset on close, not after submit.** Close is the one point every path goes
  through — save, cancel, Esc, backdrop — so one call covers them all.
- **Do not weaken the `isDirty` guard in `use-events-page`.** It exists so a
  refetch cannot discard what the user typed (§23). Resetting on close lets it
  keep doing that job without locking itself.
- **`key` remount over a reset effect for dialog-local state.** An effect that
  calls setState on close trips `react-hooks/set-state-in-effect` and causes
  cascading renders; deriving the key during render is the supported reset.

## Verification

`pnpm build`, `pnpm lint`, `pnpm mobile:lint` clean. `pnpm mobile:typecheck`
still reports one pre-existing error (`auto-price-row.tsx` `setAutoPrice`),
confirmed present on a stashed baseline and unrelated to this change.

## Mobile app parity notes

The hook fixes are all in `packages/core`, so mobile gets them for free. The two
mobile sheets listed above were fixed here directly. Any other mobile sheet
holding local state across opens needs the same open-counter key.
