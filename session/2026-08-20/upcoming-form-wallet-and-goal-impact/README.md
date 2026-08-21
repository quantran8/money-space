# Upcoming event form — wallet field + goal impact notice

- **Date**: 2026-08-20
- **Session folder**: `session/2026-08-20/upcoming-form-wallet-and-goal-impact/`
- **Status**: done

## What the task is

The create-upcoming-event form did not match the logic behind it, and the goal
impact calculation was missing from the UI entirely.

Two separate defects:

1. **The form could not be submitted at all in its default state.** `/upcoming`
   opens the dialog as `outgoing`, and an outgoing event REQUIRES
   `settlementAssetId` — enforced in `buildCashflowSchema` (superRefine) and
   again server-side in `assertValid`. But the wallet picker was rendered only
   inside the "Thêm chi tiết" disclosure, which starts closed. A household could
   fill in every visible field and the submit button stayed disabled, with the
   blocking field and its error message both out of sight. Nothing said why.

2. **`GoalImpactNotice` was never rendered.** The component, `computeSpendImpact`,
   `SpendImpactBar` and the full `upcoming.complete.goalImpact.*` copy in both
   locales all existed and were correct — but nothing imported the notice, and
   `computeSpendImpact` had zero callers. The trade an outflow makes against the
   goals sharing its wallet was computed nowhere and shown nowhere.

## Changes made

- `src/features/cashflow/ui/components/cashflow-event-form-dialog.tsx`
  - Extracted the wallet picker into a `walletSection` and render it INLINE for
    outgoing (it is required and gates submit), leaving it inside the disclosure
    for incoming (genuinely optional there).
  - The section now renders even when no eligible wallet exists, with a message
    pointing at Assets, instead of vanishing and leaving the button dead.
  - Wired in `<GoalImpactNotice>` under the wallet field for outgoing, fed by
    `watch('settlementAssetId')` and `cashflowAmountToVnd(watch('amount'))`.
  - Wallet label/hint now use planning-context copy instead of the
    `upcoming.complete.*` keys, which are past-tense confirmation strings.
- `src/i18n/resources.ts` — added `upcoming.form.walletOut` / `walletIn` /
  `walletHintOut` / `walletHintIn` / `walletNoneOut` / `walletNoneIn` in **both**
  `vi` and `en`.

## Key decisions

- **Wallet placement is per-direction, not global.** Outgoing and incoming ask
  different questions of the same field; making it inline for both would demand
  a wallet for incoming, which neither schema nor server requires.
- **Render the field when the option list is empty.** Conditioning the whole
  block on `settlementOptions.length > 0` was what turned a required field into
  an invisible one. An empty state that explains the gap beats a dead button.
- **New copy keys rather than reusing `upcoming.complete.*`.** Those read "Tiền
  ra từ ví nào?" — past tense, for confirming a spend that already happened. At
  planning time the event has not occurred.
- **Notice stays local-only and never gates submit**, per its own doc comment:
  it states a consequence, never a recommendation (Voice).

## Verification

- `npm run build` (tsc -b + vite build) — passes clean.
- `npm run lint` — copy check passes; the 13 remaining eslint problems are all
  pre-existing in `router.tsx`, `data-table.tsx`, `motion.tsx`, `assets/*` and
  `events/*`, none in the files touched here.

## Mobile app parity notes

- Port both fixes: the wallet field must be reachable without opening a
  disclosure on outgoing, and the goal impact notice must be shown before save.
- The outgoing-requires-wallet rule is server-enforced, so mobile hits the same
  400 if it hides the field the same way.
- `computeSpendImpact` is pure and lives in `features/goals/model/spend-impact.ts`
  — portable as-is. `SpendImpactBar` is web markup and needs a native equivalent.
