# Redesign debt create form (Gen-Z, event-page style)

- **Date**: 2026-07-13
- **Session folder**: `session/2026-07-13/redesign-debt-create-form/`
- **Status**: done

## What the task is

The debt create/edit form looked like an admin form (bordered inputs, hardcoded
grey `#f2f2f7`/`#e5e5ea` chrome, a huge 68px amount field). Redesign it to match
the calmer, tactile "Gen Z" look of the **event page** form — soft filled cards
(`bg-muted`) with small uppercase inset labels, borderless controls, and an
accent focus ring.

Second requirement: the **"asset nhận nợ"** (where borrowed money is received,
`receivedToAssetId`) may only be a **cash or bank account** — not any valued asset.

## Changes made

- `src/features/debts/ui/components/debt-form-dialog.tsx` — full rewrite. Now
  reuses the event form primitives from
  `src/features/events/ui/components/event-field.tsx`: `EventField`,
  `EventFieldInput`, `EventFieldTextarea`, `EventMoneyInput`,
  `eventSelectTriggerClass`, `eventDateTriggerClass`. Header now uses the
  eyebrow + title + description pattern like `event-form-dialog.tsx`. Lender
  quick-pick, interest-period rows, calc-mode cards, footer buttons restyled to
  accent/muted tokens. `borrowedAt`/`expectedFinalDueDate` switched from raw
  `type=date` inputs to `DatePicker`. Dropped the `originalAmountValue` and
  `assetOptions` props; added `receiveAssetOptions`.
- `src/features/debts/hooks/use-debts-page.ts` — added `receiveAssetOptions`
  (assets filtered to `type === 'cash' || 'bank_account'`), exported it, and
  changed the create-reset to seed `receivedToAssetId` from that filtered list.
  Added the `hasInterest` switch: seeds from whether the edited debt has a rate,
  gates the repayment estimate (interest off → 0% loan), and the submit now
  drops rate/periods when off so the debt is persisted interest-free.
- `src/features/debts/model/debts-form.ts` — added `hasInterest: boolean` to the
  form type / defaults (`false`) / zod schema.
- Interest fields ("Lãi suất theo giai đoạn", "Cách tính lãi") in the form are
  now hidden behind a **"Khoản vay có lãi"** Switch — only shown when on.
  "Mỗi kỳ trả khoảng" + the repayment estimate stay visible either way.
- `src/features/debts/ui/debts-page.tsx` — pass `receiveAssetOptions`, drop
  `originalAmountValue`/`assetOptions` from the dialog call.
- `src/features/debts/ui/debt-detail-page.tsx` — same prop swap at its
  `DebtFormDialog` usage (edit-in-place).
- `memory/debts.md` — documented the cash/bank-only rule for `receivedToAssetId`.

## Key decisions

- Reused the existing event-form primitives (`EventField` et al.) instead of
  cloning them into the debts feature — they are the app's shared Gen-Z field
  system even though they physically live under `features/events`. Kept the same
  soft-card / accent-ring visual language for consistency.
- The cash/bank filter mirrors the events page `sourceAssetOptions` rule exactly
  (`asset.type === 'cash' || 'bank_account'`), so the two "where does the money
  sit" selects behave identically across the app.

## Mobile app parity notes

- Port the same visual redesign of the debt create/edit form to match the
  mobile event form styling (filled cards, borderless inputs, accent focus).
- Enforce the same constraint: the "nhận nợ vào đâu" / receive-asset picker must
  only list **cash** and **bank_account** assets, and default to the first one.
