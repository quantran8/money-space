# Saving-deposit form: stepped wizard + expected-payout preview

- **Date**: 2026-09-05
- **Session folder**: `session/2026-09-05/saving-deposit-form-wizard/`
- **Status**: done (web + core); mobile deliberately not ported

## What the task is

The user's report: the info inside "Thêm chi tiết" on the create-saving form is
necessary but hidden, and the form promises nothing back — no expected interest
before you commit.

Both were real, and the first was a bug, not a preference:

- `nonTermRate` is **required** by `buildAssetSchema` for `saving_deposit`
  (and `receivingWalletId` when interest goes to a wallet), but both rendered
  only inside the collapsed §22.2 `Disclosure`. Pressing "Thêm nguồn tiền"
  produced an error message attached to a control the form was not rendering.
  `shouldFocusError` had nothing to focus. §22.10 wants the button always
  enabled *and* the reason visible — the reason was one click away, unlabelled.
- `maturityDate` was optional for every formula type. For a deposit that means
  no expected payout can be quoted, and `computeSavingInterestPeriods` returns
  `[]` — the app would never credit the interest either.

## Changes made

**New core module** — `packages/core/src/features/assets/model/saving-preview.ts`
- `savingTermPresetMonths` (1/3/6/9/12/18/24/36) — the tenors a VN bank sells.
- `maturityDateFromTerm(startDate, months)` — clamped month arithmetic,
  mirroring the backend's `addMonthsIso` so the preview and the interest the
  app later credits cannot disagree (31/01 + 1 tháng → 28/02, leap-safe).
- `termPresetForDates` — reads a stored term back onto the segmented control.
- `previewSavingDeposit(values)` → `{ onTime, early, earlyMonth, termMonths,
  monthlyInterest, earlyPenalty }`, or `null` while inputs cannot support an
  honest figure. **Reuses `computeSavingOnTime` / `computeSavingEarly` /
  `termMonthsOf`** rather than restating the formulas.

**New web component** — `web/src/features/assets/ui/components/saving-deposit-form-dialog.tsx`
A 4-step wizard built on the debt-form pattern (rail + `STEP_FIELDS` +
`requestStep` + `saveArmed`):
1. Sổ tiết kiệm — tên, tính vào tiền linh hoạt, người giữ, ghi chú
2. Số tiền & kỳ hạn — gốc, ngày gửi, kỳ hạn (chips → maturityDate)
3. Lãi suất — lãi suất, kỳ trả lãi, lãi suất không kỳ hạn, tiền lãi nhận vào
   (+ ví), **and the preview block, live from this step**
4. Xem lại — read-only summary + the preview again

**Routing** — `asset-form-dialog.tsx` delegates to the wizard when
`type === 'saving_deposit'`; both call sites (networth page, asset detail page)
are unchanged. `FormulaExtraFields` lost its saving-only branches and its
`isSaving` / `interestDestination` / `walletOptions` props.

**Validation** — `assets-form.ts`: `maturityDate` is now **required** for
`saving_deposit` and must be after `startDate` (`assets.form.maturityAfterStart`).
Every other formula type keeps it optional — a family loan often has no agreed
due date (see `memory/assets.md`).

**i18n** — `assets.form.savingTerm*`, `assets.form.savingStartDate`,
`assets.form.preview.*`, `assets.form.deposit.*` (steps/sections/rail/actions),
both locales. NB: the nested block is `deposit`, not `saving` — `assets.form.saving`
is already the "Đang lưu..." string.

## Key decisions

- **The disclosure was the wrong container, so the fix is not "open it by
  default".** §22.2 reserves the disclosure for what the app can derive or what
  is genuinely optional; a deposit's terms are neither. Steps, not one long
  column: §22.0 caps a pane at 3–4 fields, and a passbook has seven.
- **Term as chips, not a date picker.** `maturityDate` is still what is
  submitted — the chips only compute it — so nothing downstream learns a new
  concept, and "Khác" still reveals the picker. Moving the deposit date moves
  the maturity with it: "gửi 12 tháng" is a length, not a fixed date.
- **Preview from step 3, not only the review step.** §22.7 wants the
  consequence updating per keystroke, and the payout is the one figure a
  household cannot do in their head.
- **Rows + divider, never a table.** §22.7 forbids a labelled metric grid and
  §19 forbids nested metric cards inside a modeled surface; the layout is §4
  inline-summary rows on `bg-accent-soft`, with the schedule and the
  early-withdrawal cost as prose sentences underneath.
- **The payout LEADS the block, at `t-figure`** (§32 primary vs secondary, §29
  answer first). As one more right-aligned figure among four, "Thực nhận" read
  as a footnote to its own inputs. It now sits at the top with a caption
  ("Số tiền nhận về khi giữ đủ kỳ hạn" — §31, a number must not stand alone),
  and gốc / lãi / lãi mỗi tháng are demoted below a divider. This also satisfies
  §22.5's "số lớn là output, không phải input": the only hero-sized number in
  the form is the one the app computed, never one that was typed.
  - **Surface stays `--accent-soft` with the normal ink ramp** — the ground
    §22.7/§11.7 gives to "what happens if I do this", the same one the
    consequence block wears everywhere else in the app.
  - Coloured/inverted variants were explored and **all reverted**: white on
    `--hero` (matching the marketing CTA), white on `--ink`, and white on a new
    `--data-slab` token. `index.css` is untouched — no dead token was left.
  - Worth knowing if the idea comes back: **white cannot sit on `--hero`.** It
    measures 1.63:1 on #B5CDE8, under the 4.5:1 body floor and under even the
    3.0:1 large-text floor, and §3 says so explicitly ("Không dùng chữ trắng").
    The landing page's CTA (`landingpage.html` §cta) does ship white on that
    blue at 1.49:1, but it is a single 72px heading with no small text; this
    block carries 14px rows and 12px meta as well. To get white legibly, the
    GROUND has to change — `--ink` (19:1) or a darker blue such as #2a5a8a
    (7.2:1) both work and were built.
  - The empty state keeps the block's shape with an em-dash in the figure slot,
    so entering the rate does not make the surface jump a step in height.
  - On the review step the block moved ABOVE the field list, and `principal` /
    `savingTerm` were dropped from that list — they are printed in the block, and
    repeating them made the reader check one figure twice on a single screen.
- **Exact đồng throughout the preview.** gốc + lãi = thực nhận is a subtraction
  the reader does on screen, and these are numbers typed moments earlier and
  about to be confirmed — both triggers for `formatVndExact` (§6, and
  `session/2026-09-04/money-formatting-exact-vs-compact`).
- **Monthly interest is its own row** (user request), labelled by schedule:
  "Lãi mỗi tháng" for a `monthly` passbook (money that actually arrives) vs
  "Lãi trung bình mỗi tháng" for `end_of_term`, where nothing arrives monthly
  and calling it a payout would be a false promise.
- **Note + người giữ live on step 1**, not the review step: they answer "which
  account is this", and the review step stays a read-only check.
- **Early figure is quoted mid-term** (`floor(termMonths / 2)`) — the point a
  saver is most likely asked to weigh, and where the two rates differ visibly.
- `previewSavingDeposit` treats a missing `nonTermRate` as 0% rather than
  withholding the whole block: it is the last field filled, and the on-time
  figures do not depend on it.

## Verification

- `pnpm build` (tsc -b + vite) passes; `pnpm lint` 0 errors (13 pre-existing
  warnings, none in the changed files).
- Preview maths checked against the backend's accrual: 100tr @ 5,2%/12 tháng →
  lãi 5.200.000đ, thực nhận 105.200.000đ, lãi mỗi tháng 433.333đ, rút ở tháng 6
  → 100.100.000đ (kém 5.100.000đ). Rows foot exactly at exact-đồng precision.
  Month clamp verified for 31/01 in both a common and a leap year.
- **Not driven in a browser** — the user asked to test the UI themselves.

## Mobile app parity notes

**Mobile is NOT ported** — the user chose web-first so the design can be
settled before it is duplicated.

`mobile/src/features/assets/components/asset-form-sheet.tsx` has the **same
blocking bug**: `nonTermRate` at line ~945 sits inside the `Disclosure` opened
at line ~278, while the shared schema requires it. Saving a deposit there fails
with an error on a hidden field. The core module and every i18n key are already
shared, so the port is UI-only:

- route `saving_deposit` to a stepped sheet (mobile has no equivalent of the
  debt wizard's desktop rail — use the step counter header alone);
- reuse `previewSavingDeposit` and the `assets.form.preview.*` / `deposit.*` keys;
- the term chips need a wrapping `View`, not `Segmented` (9 options).

Also still open: the maturity-date requirement now applies to mobile too via
the shared schema, so an existing mobile deposit saved without one will fail
validation on next edit until the sheet renders that field.
