# Unify create/edit form dialogs to the event-form style

- **Date**: 2026-07-14
- **Session folder**: `session/2026-07-14/unify-form-dialogs-event-style/`
- **Status**: done

## What the task is

User request: "redesign lại toàn bộ form create, edit ở frontend web tương tự như trong event page".

The events (money timeline) create/update modals use a distinctive calm/tactile
form style — soft filled cards (`bg-muted`, `rounded-[20px]`), small uppercase
inset labels, borderless controls, a big "hero" money field, an accent-colored
primary button, and a `Thêm chi tiết` disclosure. The debts form had already
adopted it. The remaining form dialogs (assets, asset-sale, goals, payments,
members invite) still used the old bordered `FormField` / `Input` / `MoneyInput`
look. This task migrates all of them to the event-form style so every
create/edit dialog in the app feels like one system.

## Changes made

- `src/components/ui/event-field.tsx` — **new shared UI primitive.** Promoted the
  event-form primitives (`EventField`, `EventFieldInput`, `EventFieldTextarea`,
  `EventMoneyInput`, `eventSelectTriggerClass`, `eventDateTriggerClass`) out of
  the `events` feature into shared UI, so any feature can use them without a
  cross-feature import. Added a new `EventDecimalInput` (borderless decimal input,
  no grouping) for quantity/rate fields.
- `src/features/events/ui/components/event-field.tsx` — **deleted** (moved to shared UI).
- `src/features/events/ui/components/upcoming-record-form.tsx`,
  `.../actual-record-form.tsx`,
  `src/features/debts/ui/components/debt-form-dialog.tsx` — repointed their
  event-field imports from `@/features/events/ui/components/event-field` to
  `@/components/ui/event-field`. (Behavior unchanged.)
- `src/features/assets/ui/components/asset-form-dialog.tsx` — rewritten to the
  event style. Manual mode gets a hero `Giá trị` money field; unit price /
  principal use `EventMoneyInput`; quantity / interest-rate / non-term-rate use
  `EventDecimalInput`; type/liquidity/interest selects use
  `eventSelectTriggerClass`; dates use `eventDateTriggerClass`. Scrollable body
  (`grid-rows-[auto_1fr]` + `overflow-y-auto`) like the debt dialog. New i18n key
  `assets.form.help`.
- `src/features/assets/ui/components/asset-sale-dialog.tsx` — rewritten. Hero
  `Số tiền bán` (proceeds) field; `Bán toàn bộ` checkbox replaced with a `Switch`
  row; quantity uses `EventDecimalInput`; note is now a textarea. Eyebrow uses
  `assets.sale.action`.
- `src/features/assets/ui/components/computed-preview.tsx` — softened the
  computed-value preview from a dashed accent border to a soft accent fill
  (`bg-[hsla(var(--accent),0.08)] rounded-[18px]`) to match the event surfaces.
- `src/features/goals/ui/components/goal-form-dialog.tsx` — rewritten. Hero
  `Mục tiêu` money field; deadline switched from a raw `<input type="date">` to
  the app `DatePicker` (fixes a previously hardcoded "Deadline" label — now uses
  new key `goals.form.deadline`). New key `goals.form.help`.
- `src/features/payments/ui/components/payment-form-dialog.tsx` — rewritten. Hero
  `Số tiền` field; due date + status in a 2-col grid. New key `payments.form.help`.
- `src/features/members/ui/components/invite-form-dialog.tsx` — rewritten. Email
  + role in event fields; the standalone helper card was folded into the dialog
  description (reused existing `members.invite.helper`).
- `src/i18n/resources.ts` — added `help` keys (assets/goals/payments forms) and
  `deadline` (goals) in both `vi` and `en`.

## Key decisions

- **Promoted event-field primitives to `@/components/ui`.** Previously they lived
  inside the `events` feature and `debts` reached across to import them — an FSD
  smell. With 5 more features consuming them, shared UI is the correct home.
  (User explicitly chose this over keeping them in the events feature.)
- **Added `EventDecimalInput`** rather than reusing the old bordered
  `DecimalInput` inside a borderless card — needed for asset quantity/rate and
  asset-sale quantity fields.
- **Hero field per form** = the form's primary money amount (asset value,
  proceeds, goal target, payment amount). Non-money forms (members invite) have
  no hero.
- **Kept the discriminated/conditional field logic intact** (asset valuation
  modes, saving-deposit interest destination, market-vs-manual sale) — only the
  presentation changed, not the form schemas or business logic.
- Build gate (`npm run build` = `tsc -b` + vite build) passes; eslint clean on
  all changed files.

## Mobile app parity notes

- The mobile app should apply the same visual unification: its create/edit forms
  for assets, asset-sale, goals, payments, and member invite should match the
  event-form style already used on mobile (soft filled field cards, uppercase
  inset labels, borderless controls, hero amount, accent primary button).
- Port the shared primitive idea: if mobile has an equivalent of `EventField` /
  `EventMoneyInput`, make sure it's shared (not buried in the events screen) and
  add a decimal variant for quantity/rate inputs.
- New copy to mirror in mobile i18n: `assets.form.help`, `goals.form.help`,
  `goals.form.deadline`, `payments.form.help` (both `vi` and `en`).
- Web-specific, do NOT port literally: the `grid-rows-[auto_1fr]` scroll layout
  and Tailwind class strings — mobile uses its own layout system.
