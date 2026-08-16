# Asset form — per-type field fixes

- **Date**: 2026-08-16
- **Session folder**: `session/2026-08-16/asset-form-per-type-fixes/`
- **Status**: done

## What the task is

Four corrections to the asset create/edit dialog, all cases where a generic field
was wrong for the selected type:

1. `cash` / `bank_account` — the amount is a **balance**, not an "estimated value".
2. `gold` — the unit must be picked from a list, not typed.
3. `stock` — the number of shares cannot be a decimal.
4. `loan_receivable` — the lending date and the maturity date are required, and
   interest is a toggle that defaults to **off** (most loans between people carry
   no interest).

## Changes made

- `src/features/assets/model/assets-form.ts`
  - `AssetForm.hasInterest: boolean` (default `false`) — only meaningful for
    `loan_receivable`; every other formula type is defined by its rate.
  - `manualValueLabelKey(type)` — "Số dư" for cash/bank, "Giá trị ước tính" otherwise;
    used by both the field label and the required-field message.
  - `goldUnits` (`chỉ` / `lượng` / `gram`), `isInterestOptional`, `chargesInterest`,
    `isWholeQuantityType`.
  - `toAsset` — an interest-free loan stores `interestRate: 0` +
    `interestPayment: 'end_of_term'`; returns `null` for a loan with no maturity date.
  - `fromAsset` — `hasInterest` seeded from a stored rate > 0.
  - schema — stock quantity must be a whole number; loan requires `maturityDate`
    and rejects one before `startDate`; the rate is only required when interest applies.
- `src/features/assets/ui/components/asset-form-dialog.tsx`
  - `ManualFields` takes `type` and labels the amount accordingly.
  - `MarketFields` — stock quantity drops anything after the decimal mark as it is
    typed and carries a "cổ" suffix; the gold unit renders the new `GoldUnitField`.
  - `GoldUnitField` — `Segmented` over `goldUnits`; an unrecognised stored unit is
    appended as an extra option so editing never blanks the field.
  - `FormulaFields` — for a loan: "Ngày cho vay" label, the maturity date moved into
    the main section, an interest `Switch`, and the rate field only when it is on.
  - `FormulaExtraFields` — no duplicate maturity date for loans; no payment-schedule
    field when there is no interest.
  - `handleTypeChange` seeds the gold unit to `chỉ` so the segment is never empty.
- `src/components/ui/switch.tsx` — **off state was invisible**: a `--sunk` track with a
  `--panel` thumb is ~1.05:1 against a panel, so the control sank into the dialog. The
  thumb now carries the state (`--ink3` off → panel-white on the accent track when on,
  3.3:1 against the panel), plus an `--ink3/40` hairline for the pill boundary. Affects
  every switch in the app (debts, events, reserve card, asset sale) — none override the
  class, so they all gain the same fix.
- `src/i18n/resources.ts` (vi + en) — `assets.form.balance`, `loanStartDate`,
  `hasInterest`, `maturityBeforeStart`, `market.gold.unitOptions.*`,
  `market.stock.quantitySuffix` / `quantityInteger`.
- `memory/assets.md` — the per-type rules above recorded under "Discriminated form".

## Key decisions

- **The interest toggle is form state, not a stored flag.** The backend keeps a rate;
  "no interest" is `0`. `fromAsset` derives the toggle from `rate > 0`, so nothing new
  has to be persisted and an old 0% loan reopens correctly.
- **Legacy data is never silently rewritten.** A stock holding stored as `100,5`
  still displays as `100,5` and fails validation with a message; the form does not
  round it behind the user's back. Same reasoning for a gold unit outside the list —
  it stays selectable rather than disappearing.
- **Whole-number input by truncation, not stripping.** Typing "100,5" in the share
  field yields `100`; sanitising the comma away would have turned it into `1005`.
- **Interest-free loans hide the payment schedule too.** "Kỳ trả lãi" is a question
  with no answer when there is no interest.

## Mobile app parity notes

- Port all four rules — they are domain rules (recorded in `memory/assets.md`), not
  web styling.
- `Segmented` is the web §22.3 primitive; on mobile a segmented control or a picker
  is equally fine, as long as the gold unit is a fixed choice.
- The stock quantity field must use a numeric (not decimal) keypad on mobile.
