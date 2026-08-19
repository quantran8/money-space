# Goal pace declared on the wallets

- **Date**: 2026-08-19
- **Session folder**: `session/2026-08-19/goal-pace-from-wallets/`
- **Status**: done

## What the task is

Two rules for `FinancialGoal`:

1. A goal must be backed by **at least one `cash` / `bank_account` asset**.
2. `plannedMonthlyContribution` is **taken from the wallet shares** that back it,
   instead of being a number typed on the goal.

`planned_monthly_contribution` stays on `financial_goals` (explicitly asked for):
every goal surface shows the pace, and summing it on read would put a join on all
of them. It becomes a **maintained mirror** — never a client input.

## Changes made

Backend (`money-space-backend`):

- `prisma/schema.prisma` — `goal_asset_allocations.monthly_contribution`;
  `financial_goals.planned_monthly_contribution` re-documented as a mirror.
- `prisma/migrations/20260819190000_goal_pace_from_wallets/migration.sql` — new
  column + role CHECK, carries each goal's old figure onto its earliest wallet
  share, then rewrites the goal column from the shares (goals with no wallet end
  at NULL).
- `src/modules/goals/domain/goal-progress.ts` — `resolvePlannedMonthlyContribution`
  (pure): sum over `contribution` shares, `null` when none declares one.
- `src/modules/goals/goals.service.ts` — wallet requirement on create and on
  allocation delete; per-share validation; `syncGoalPace` rewrites the mirror in
  the same transaction as every allocation write; `assetIndex` replaces the two
  separate value/role reads.
- `src/modules/goals/repositories/*` — `updatePlannedMonthlyContribution`; the
  allocation INSERT now writes `role` (it was omitted, so every share landed as
  `holding` regardless of what the service computed) and `monthly_contribution`.
- DTOs, entity, mapper, `toGoalCard`, specs.

Frontend (`money-space`):

- `features/goals/model/goals-form.ts` — `GoalAllocationDraft.monthlyContribution`,
  `isWalletAssetType`, `walletRequired` rule in the schema; `plannedMonthly` is
  read-only context.
- `features/goals/ui/components/goal-allocations-field.tsx`,
  `goal-allocation-dialog.tsx` — a monthly amount per wallet share, and the
  contribution/holding split narrowed: while the share is `contribution` the
  asset picker offers wallets only, the role control shows only for a wallet, and
  fixed/percent is a holding-only choice. A contribution row asks for ONE number,
  the monthly amount — the share itself is sent as `percent: 100` ("tính toàn bộ
  cho mục tiêu này"), because a wallet the goal is saved into has to follow its
  balance: a figure typed once would leave the goal still while the household
  kept saving.
- `features/goals/ui/components/goal-form-dialog.tsx` — the goal-level monthly
  field is gone; the §22.7 consequence uses the sum of the wallet rows.
- `features/goals/hooks/use-goals-page.ts`, `api/goals.repository.ts`,
  `i18n/resources.ts` (vi + en).
- `memory/goals.md` in both repos.

## Key decisions

- **The mirror is written, never read as truth.** `PATCH /financial-goals/:id`
  ignores the field whatever the body carries; the only writer is `syncGoalPace`,
  inside the allocation write's transaction.
- **`null` ≠ 0.** No wallet declaring an amount means no pace was planned:
  progress only, no projected date, no monthly verdict. 0 is a real plan to save
  nothing and is kept as one.
- **A monthly amount on gold is rejected, not dropped** — silently storing
  nothing would leave the household believing they declared a pace.
- **The wallet rule is by asset type**, not by allocation role: a household can
  still mark a wallet as `holding`, and the goal is still valid.
- **Enforced in the app layer.** The rule spans `goal_asset_allocations` and
  `assets`; the CHECK only covers "an amount implies `role = contribution`".
- Existing goals are not migrated into compliance — the rule governs writes.

## Mobile app parity notes

- Create flow: the goal form no longer has a "mức góp mỗi tháng" field. It is a
  per-wallet input on each allocation row, shown only when the row is a wallet
  acting as `contribution`.
- Create must block on "no wallet chosen" client-side (`walletRequired`), and the
  allocations panel must refuse to delete the last wallet share.
- Goal reads are unchanged: `plannedMonthlyContribution` still arrives on the
  goal card — it is simply no longer sendable.
