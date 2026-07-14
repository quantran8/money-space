# Simplify debt classification + lender-based repayment rules

- **Date**: 2026-07-14
- **Session folder**: `session/2026-07-14/simplify-debt-lender-type/`
- **Status**: done

## What the task is

Rework debts across backend + frontend:

1. A debt no longer carries both `debtType` and `lenderType`. Keep a single field
   (`lenderType`) with three buckets: **relative** (người thân), **bank_institution**
   (ngân hàng / tổ chức), **other** (khác).
2. **bank_institution** loans are fixed-schedule: interest rate, term
   (`expectedFinalDueDate`), and a fixed monthly payment are **required**, and the
   fixed monthly repayment cannot be changed by editing the linked money event —
   to change it you must update the debt record so it recomputes.
3. **relative / other** loans: interest and a fixed term are optional. When the
   user sets an amount + schedule, editing a repayment money event rebalances the
   **next unpaid installment** by the over/under-payment (overpay → next installment
   smaller; underpay → next installment larger). Total owed and installment count
   stay the same.

## Changes made

### Backend (`money-space-backend`)

- `prisma/schema.prisma` — `LenderType` enum rewritten to `relative | bank_institution | other`;
  dropped `DebtType` enum and the `debts.debt_type` column.
- `prisma/migrations/20260714130000_debt_lender_type_simplify/migration.sql` — remaps old
  lender values (family/friend→relative, bank/credit_institution→bank_institution,
  company/other→other), swaps the enum, drops `debt_type` + `DebtType`.
- `src/modules/debts/entities/debt.entity.ts` — new `LenderType`, `isFixedScheduleLender()`,
  removed `DebtType` + `Debt.debtType`.
- `src/modules/debts/dto/create-debt.dto.ts`, `.../money-space.mapper.ts`,
  `.../prisma-debts.repository.ts` — dropped `debtType` everywhere.
- `src/modules/debts/debts.service.ts` — `assertLenderTerms()` enforces the bank_institution
  required trio on create + update; `auditSnapshot` now tracks `lenderType` not `debtType`.
- `src/modules/money-events/*` — the repayment side-effects:
  - repo: `reduceDebtOutstanding` → `adjustDebtOutstanding(delta)` (reversible),
    plus `findDebtRepaymentInfo` (lenderType + fixedPaymentAmount) and
    `adjustNextUnpaidPayment(delta)`.
  - service: `applyDebtRepaymentEffects(event, sign)` (outstanding + next-installment
    rebalance) wired into create (apply), update (reverse old + apply new),
    delete (reverse); `assertRepaymentEditable` rejects edit/delete of a
    bank_institution repayment (400). Edit/delete now correctly adjust debt
    outstanding, which they previously did not.

### Frontend (`money-space-frontend`)

- `src/features/debts/model/debts.types.ts` — new `LenderType` + `isFixedScheduleLender`,
  removed `DebtType` and `DebtItem.debtType`.
- `src/features/debts/model/debts-form.ts` — form drops `debtType`; `quickLenderTypes`
  now the 3 buckets; `buildDebtSchema` enforces bank_institution required trio in `superRefine`.
- `src/features/debts/api/debts.repository.ts` — dropped `debtType` from response/payload/mapper.
- `src/features/debts/hooks/use-debts-page.ts` — dropped `debtType`; before/after preview
  snapshots now use `lenderType`.
- `src/features/debts/ui/components/debt-form-dialog.tsx` — quick chips map 1:1 to lenderType;
  "Loại khoản vay" select now offers the 3 lender types; hint banner for bank_institution.
- `src/features/debts/ui/components/debt-update-mode-dialog.tsx` — `debtType`→`lenderType`
  (snapshot field, `LENDER_TYPE_LABELS`, preview row, change detection).
- `src/shared/types/database.ts` — dropped `DebtType`; `LenderType` = 3 values; removed
  `debt_type` from the debts row + Enums map.

## Key decisions

- **Kept `lenderType`, dropped `debtType`** — "who lent it" is the natural single axis and
  drives the repayment rules. `company` mapped to `other` (no fixed-schedule guarantee).
- **Bank repayment lock lives in the backend** (`assertRepaymentEditable`) — the authoritative
  guarantee. The frontend surfaces the backend 400; the debt detail page shows repayments
  read-only, so no separate UI lock was needed. If per-event edit UI is added to the events
  page later, gate it on the linked debt's `lenderType`.
- **Next-installment rebalance, not spread-across-all** — the over/under-payment shifts only the
  single next unpaid `UpcomingPayment`, keeping total owed + count fixed and behaviour predictable.
- Edit/delete of a repayment now reverse the debt outstanding adjustment (a prior gap).

## Follow-up: debt form UX (due date presets + auto interest term)

- `src/features/debts/model/debts-interest.ts` — added `addMonthsIso(isoDate, months)`
  (mirrors the backend helper) for computing dates from the borrow date.
- `src/features/debts/ui/components/debt-form-dialog.tsx`:
  - **Due date presets** — chips (6 tháng / 1 năm / 2 năm / 3 năm / 5 năm) that set
    `expectedFinalDueDate = borrowedAt + N months`; the custom `DatePicker` stays below.
    Chips disabled until a borrow date is chosen; the active chip highlights when the
    due date matches a preset.
  - **Interest term auto-computed** — the "months" of the **last** stage is not typed:
    it's shown read-only as `termMonths − Σ(earlier stages)` (single stage → the full
    term). Earlier stages (all but the last) have editable months inputs, so with
    multiple stages the first stage is editable too. A 12-month loan with earlier stages
    of 4 + 3 shows the last stage as "5 tháng" live. This matches the backend model where
    the stage with empty `months` absorbs the remaining term.
- `src/features/debts/hooks/use-debts-page.ts` — the **last** interest stage is persisted
  with empty `months` (= "remaining term"), both on submit and on rehydrate, so the
  read-only display and stored data stay consistent.

## Mobile app parity notes

- Mirror the enum change + migration semantics (single `lenderType`, 3 values, remap rule).
- Port `isFixedScheduleLender` gating: required fields on the bank_institution form, the
  repayment-event lock (block edit/delete, show the backend message), and the next-installment
  rebalance for relative/other. The rebalance + lock logic is server-side, so mobile mostly needs
  the form validation + surfacing the 400, matching web.
