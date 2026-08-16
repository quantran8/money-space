# Loan receivable — maturity date is optional

- **Date**: 2026-08-16
- **Session folder**: `session/2026-08-16/loan-maturity-optional/`
- **Status**: done

## What the task is

For `loan_receivable` ("khoản cho vay"), "Ngày đáo hạn" was a required field. The user
asked for it to be optional — money lent to family often has no agreed due date, so the
form must not block on it.

## Changes made

- `src/features/assets/model/assets-form.ts`
  - `.superRefine`: dropped the `required` issue on `maturityDate` for loans. The
    ordering check stays, but only when a date is actually given
    (`maturityDate ≥ startDate` → `assets.form.maturityBeforeStart`).
  - `toAsset()`: removed the `if (type === 'loan_receivable' && !maturityDate) return null`
    guard, so a loan without a due date now builds a valid payload
    (`calculationTerm.maturityDate: null`, via the existing `values.maturityDate || null`).
- `src/features/assets/ui/components/asset-form-dialog.tsx` — comment only: the due-date
  field still renders in the main section for loans (not behind the §22.2 disclosure),
  now because it is the next thing people reach for, not because it is required.
- `memory/assets.md` — updated the `loan_receivable` rule to say `startDate` required /
  `maturityDate` optional, with the ordering check applying only when given.

## Key decisions

- The field **stays in the main section** for loans rather than moving into the
  disclosure with the other formula types' `maturityDate`. It is optional, not rare.
- No "optional" suffix was added to the label — it matches the rest of the asset form,
  where optional fields carry no marker.
- Downstream code already tolerates a null maturity: `computeCurrentValue` only freezes
  accrual when `term.maturityDate` is set, `computeMaturityValue` returns `null`, and the
  detail page renders the "Đáo hạn" row conditionally. A loan with no due date simply
  cannot enter the forecast.
- Known gap, unchanged: `DatePicker` has no clear affordance, so on **edit** a due date
  that was already set cannot be removed from the UI. That matches every other optional
  date field in the app; making it clearable would be a shared-component change.

## Mobile app parity notes

- Mirror the validation change: loan due date optional, ordering check only when
  present, and a null `calculationTerm.maturityDate` accepted on submit.
- Same layout decision — keep the due date visible in the main loan section.
