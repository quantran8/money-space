# Goal form — v4.0 restyle + the two missing model fields

- **Date**: 2026-08-14
- **Session folder**: `session/2026-08-14/goal-form-v4-missing-fields/`
- **Status**: done

## What the task is

The goal create/edit dialog was still on v3.x styling and was missing fields the
`FinancialGoal` model accepts. Two problems, fixed together:

1. **`plannedMonthlyContribution` was never collected.** It is in `GoalPayload`,
   in the Prisma model and in `CreateFinancialGoalDto`, but no surface set it —
   so every goal created through the app came back with
   `reason: 'no_contribution'`, and §14.3's *Projected completion date* /
   *Required contribution* could never render for any goal. This is the field the
   whole §26C projection divides by.
2. **`currentAmount` was never collected on create.** The backend accepts it on
   POST specifically so onboarding can record savings that predate the app
   ("we already have 200M toward the house"). Without it every goal starts at 0.

Plus the dialog itself was the last goals surface still on v3.x — the design-system
v4.0 migration (`session/2026-08-13/design-system-v4-dashboard/`) listed "dense
form dialogs" under **Known gaps**.

## Changes made

- `src/features/goals/model/goals-form.ts` — `GoalForm` gains `current` and
  `plannedMonthly` (raw digit strings, like every other money field).
  `buildGoalSchema` now takes an `isEditing` flag and validates both as optional
  money, with a `.superRefine` blocking `current > target` **on create only**.
- `src/features/goals/api/goals.repository.ts` — split `CreateGoalPayload`
  (= `GoalPayload` + `currentAmount`) out of `GoalPayload`. `createGoal` takes the
  former, `updateGoal` still takes `Partial<GoalPayload>`, so the type layer now
  encodes the create/update asymmetry instead of a comment asking people to
  remember it.
- `src/features/goals/hooks/use-goals.ts` — `createGoal` mutation typed to
  `CreateGoalPayload`.
- `src/features/goals/hooks/use-goals-page.ts` — schema rebuilt on mode change;
  `reset` hydrates the two new fields when editing; submit sends
  `plannedMonthlyContribution` on both verbs and `currentAmount` on create only.
- `src/features/goals/ui/components/goal-form-dialog.tsx` — rewritten for v4.0
  (below), plus the new fields and a live consequence preview.
- `src/i18n/resources.ts` — new `goals.form.*` keys in **both** `vi` and `en`:
  `currentHelp`, `currentLocked`, `currentLockedHelp`, `currentExceedsTarget`,
  `monthly`, `monthlyPlaceholder`, `monthlyHelp`, `monthlyEmpty`, `remaining`,
  `estimate`, `estimateMonths`, `saving`. `deadline` re-worded
  "Hạn hoàn thành" → "Ngày mong muốn" to match §14.3 and the rest of the goals
  feature, which already said *Ngày mong muốn* everywhere else.

### v4.0 violations fixed in the dialog

- **The submit button was invisible-adjacent.** It used
  `bg-[hsl(var(--accent))]`, which silently broke when v4.0 made the tokens raw
  hex — `hsl(#0a6b47)` is not a color. Same class of bug the v4.0 session swept
  out of ~75 files; this dialog was missed. Now plain `variant="default"`.
- Header was `text-[28px]/[32px] font-semibold` — not a step on the §10.2 scale,
  and §10.2 forbids weight 600 outside the logo. Now the 19px/500 page title,
  with the eyebrow as a `.label`.
- Footer had `border-t border-black/[0.06]`; §2.2/§2.4 remove borders and nearly
  all dividers. Separation is spacing now.
- Cancel was `variant="ghost"` + `hover:bg-sunk`; ghost is accent-colored text in
  v4.0, so a cancel action was rendering in the accent color. Now `secondary`.
- Hardcoded `'Đang lưu...'` bypassed i18n → `goals.form.saving`.
- Hardcoded `₫` glyph → `đ`, and the dialog now scrolls
  (`grid-rows-[auto_1fr]` + `overflow-y-auto`) instead of overflowing at 92dvh
  now that it has more fields.

## Key decisions

- **`currentAmount` is create-only in the UI because it is create-only in the
  API.** `UpdateFinancialGoalDto` omits it so the stored column cannot diverge
  from the contribution history. On edit the dialog renders it as a **read-only
  sunk block** with the reason ("thay đổi qua các lần đóng góp") rather than
  hiding it — hiding it would leave the user wondering where their saved amount
  went; an editable field would promise an edit the API drops on the floor.
- **`plannedMonthlyContribution` is sent as `0`, not omitted, when cleared.** The
  backend update path is `payload.plannedMonthlyContribution ?? goal.plannedMonthlyContribution`,
  so omitting it falls back to the stored value — clearing the field would appear
  to work and then silently keep projecting off a pace the household has retracted.
- **The preview block states consequence, never advice** (§16.1). It shows
  *remaining* and, only when a monthly amount is declared, *about N months*. With
  no monthly amount it shows the §26C invitation instead of a number — the same
  rule `hasProjectedDate()` enforces on the read side. Deriving a date from past
  behaviour here would be a guess presented as a fact (§2.16).
- The preview is a **client-side mirror** of the projection for immediate
  feedback while typing; the authoritative `GoalProjection` still comes from the
  API and is what every other goal surface renders.

## Known gaps / follow-ups

- **`memory/goals.md` is stale and now contradicts the code.** It says
  `currentAmount` is "derived, NOT stored (backend PR3 removed the
  `current_amount` column)". The column is present in `prisma/schema.prisma`
  (`FinancialGoal.currentAmount`, with a comment explaining it was deliberately
  restored and is mirrored by `MoneyEventsService` inside the contribution
  transaction), and `goals.service.ts` reads and writes it. The memory file also
  states the goal form has no `current` field, which this task changes. I did not
  rewrite it in this pass because the correction is a backend-domain claim that
  spans three repos — flagging rather than guessing at the canonical wording.
- `category` and `status` exist on the Prisma model (`GoalCategory`,
  `GoalStatus`) but are **not** in `CreateFinancialGoalDto` and not returned by
  `toGoalCard`, so there is nothing for the form to send or read. Wiring them
  needs backend work first; deliberately left out.
- `targetDate` still has no validation (a past date is accepted). The backend
  projection handles it via `reason: 'target_date_passed'`, so this is a
  nice-to-have, not a correctness bug.
- Lint reports the same **14 problems (6 errors)** as before this task, all
  `react-hooks/set-state-in-effect` in files not touched here.

## Verification

`npx tsc -b` clean · `npm run build` green · `check-copy` passed · both `vi` and
`en` filled for every new key.

## Mobile app parity notes

- **Port**: the `GoalForm` shape (`current`, `plannedMonthly`), the
  `CreateGoalPayload` / `GoalPayload` split, the create-only rule for
  `currentAmount` with a read-only display on edit, sending `0` rather than
  omitting a cleared monthly contribution, and the "no monthly amount → no
  estimated date" preview rule.
- **Do NOT port**: the `hsl(var(--accent))` → `variant="default"` repair and the
  `grid-rows-[auto_1fr]` scroll container — both are web-CSS-specific. Mobile
  opens this as a bottom sheet (§15), so the footer/scroll treatment differs.
