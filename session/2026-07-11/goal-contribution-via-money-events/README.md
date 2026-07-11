# Goal contribution via money events (align FE with backend PR3)

- **Date**: 2026-07-11
- **Session folder**: `session/2026-07-11/goal-contribution-via-money-events/`
- **Status**: done

## What the task is

Backend PR3 removed the stored `current_amount` column on `financial_goals`.
A goal's `currentAmount` / `progress` is now derived **server-side** from the
sum of that goal's `goal_contribution` money events. Consequently:

- PATCH goal `{ currentAmount }` is silently ignored by the backend.
- The frontend "đóng góp" (contribute) button and the "current" field on the
  goal form no longer had any effect — the real breaking issue.

Fix the frontend so contributions create a `goal_contribution` money event,
and drop the now-dead `current` field from the goal form. Also patch two
non-breaking gaps: missing i18n category labels and the request payload type.

## Changes made

- `src/features/goals/hooks/use-goals-page.ts`
  - `addContribution` now calls `useEvents().createEvent` with a
    `goal_contribution` money event (`amount: delta`, `category: 'saving'`,
    `financialGoalId: goalId`, `isoDate` = today) instead of PATCHing the goal
    with `currentAmount + delta`. After success it invalidates the goals query
    so the derived progress refetches (createEvent already invalidates
    events/dashboard/debts/assets but not goals).
  - `isContributing` now reflects `createEvent.isPending`.
  - `onSubmit` no longer sends `currentAmount` on create/update.
  - Form reset no longer sets `current`.
- `src/features/goals/model/goals-form.ts`
  - Removed `current` from `GoalForm`, `defaultGoalFormValues`, and the zod
    schema (including the `current <= target` `.refine`). Dropped now-unused
    imports (`parseAmount`, `localizedOptionalMoneyAmount`).
- `src/features/goals/ui/components/goal-form-dialog.tsx`
  - Removed the "current" MoneyInput field (target is now full-width).
- `src/features/goals/api/goals.repository.ts`
  - Removed `currentAmount` from `GoalPayload` (request). `GoalRecord`
    (response) keeps `currentAmount` — the backend still returns the derived value.
- `src/i18n/resources.ts`
  - Added `eventCategory` labels for `interest`, `debt`, `investment` in both
    `vi` and `en` (previously rendered as raw codes via `defaultValue`).

## Key decisions

- Contribution event uses `type: 'goal_contribution'`, `category: 'saving'`,
  `amount: delta` (positive). Backend `deriveDirection` maps
  `goal_contribution` → `neutral`; the derived total is a plain
  `SUM(amount)` over `goal_contribution` events, so a positive amount is correct.
- Goals query is invalidated explicitly after a contribution because `useEvents`
  does not invalidate goals.
- Left the now-unused i18n keys `goals.form.current*` and
  `validation.currentExceedsTarget` in place (harmless; removing is pure churn).
- Did NOT touch `src/types/database.ts` schema mirror in this task (separate
  cleanup — it's a type reference not used by repositories).

## Mobile app parity notes

The mobile repo has the identical structure (`mobile-app/src/features/goals/...`)
and needs the same port:

- `use-goals-page.ts`: rewrite `addContribution` to create a `goal_contribution`
  money event (verify mobile has an events repository/hook to reuse), invalidate
  goals after; switch `isContributing` to the event mutation.
- `goals-form.ts`: drop the `current` field + schema `.refine`.
- goal form dialog: remove the `current` input.
- `goals.repository.ts`: drop `currentAmount` from the request payload type,
  keep it on the response record.
- i18n: add `interest` / `debt` / `investment` category labels (vi + en).
