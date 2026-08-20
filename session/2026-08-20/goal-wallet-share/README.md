# Dividing one wallet between goals at the same priority

- **Date**: 2026-08-20
- **Session folder**: `session/2026-08-20/goal-wallet-share/`
- **Status**: done

## What the task is

The "Tính đều đặn" panel reported more capacity than the household had. A wallet
backing two goals had each of them measure against the whole balance, so an
account with 2tr free told both goals they were on track for 2tr — 4tr of pace
against 2tr of money.

`priority` (cao / trung bình / thấp) already existed on the goal but had never
been used for anything except display. It settles most of the competition for a
wallet; what it cannot settle is a TIE, and the household asked that they decide
that themselves rather than have the product pick by creation date.

## Changes made

**Backend** (`money-space-backend`)

- `prisma/migrations/20260820140000_goal_allocation_share_percent/` — adds
  `goal_asset_allocations.share_percent DECIMAL(5,2)`, CHECK-constrained to
  `contribution` rows and 1–100. No backfill: NULL means "never asked", which is
  not 100.
- `domain/goal-progress.ts` — `resolveMonthlyContributionHeadroom` (per goal,
  totals could exceed the wallet) replaced by `resolveWalletShareByGoal`, which
  divides each wallet once across every goal that draws on it.
- `goals.service.ts` — `monthlyProgress` now loads the household's goals for
  their priorities; `assertShareWithinWallet` refuses shares passing 100% within
  one priority; `walletUsage` ships with `?include=walletUsage`.

**Frontend**

- `api/goals.repository.ts` — `sharePercent` on the allocation payload,
  `GoalWalletUsage`, and `listGoals` now asks for `projection,walletUsage`.
- `model/goals-form.ts` — `sharePercent` on the draft; `buildGoalSchema` takes
  `walletRivals` and requires a share only for a contested wallet.
- `hooks/use-goals-page.ts` — derives `contestedWalletIds` from `walletUsage`
  against the priority currently in the form (`useWatch`).
- `ui/components/goal-allocations-field.tsx` — the `%` input, shown only for a
  contested wallet, naming the goals it shares with.
- `ui/components/goal-monthly-progress-section.tsx` — a note when the split was a
  fallback rather than the household's decision.
- `i18n/resources.ts` — `goals.allocations.shareLabel` / `shareHelp` /
  `shareRequired`, `goals.monthly.shareUndecided`, in both `vi` and `en`.

## Key decisions

- **The share divides a SHORTFALL, never the contribution.** `monthly_contribution`
  stays the declared amount and remains the cap. While a wallet can cover every
  goal on it, `share_percent` is not consulted at all.
- **Asked at creation, not when the money runs out.** By the time a wallet falls
  short the split has already been guessed at, and the guess is what the
  household would be correcting.
- **Only for a contested wallet** — one that already backs another goal at the
  SAME priority. A wallet with one goal has nothing to divide, and goals at
  different priorities are served in order rather than alongside each other.
- **NULL ≠ 100.** A share nobody was asked for would settle a future tie by a
  number the household never chose. Ties without shares fall back to splitting by
  the declared paces and set `needsShareDecision` so the UI can ask.
- **The total is not forced to 100.** The first goal on a wallet declares its
  share before the second exists.

## Mobile app parity notes

- Port the create-form question: the `%` input on an allocation row, shown only
  when `walletUsage` reports another goal on that wallet at the priority the form
  is currently on. The condition must follow the priority control live.
- Port `sharePercent` on the allocation payload and the `needsShareDecision` note
  on the monthly panel.
- The division itself is entirely server-side (`resolveWalletShareByGoal`) — the
  client only reads `monthlyHeadroom`. Nothing to reimplement.
