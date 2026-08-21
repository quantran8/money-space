# Debt form fixes + default repayment wallet + upcoming pagination

## What the task was

A run of fixes to the debt create form, plus two follow-ups:

1. Remove all "nhà mình" copy — it read as childish.
2. Validate required fields before advancing a wizard step.
3. Three form bugs: page reload on submit, inverted required/optional on the
   amount fields, and due-date presets counting from the wrong anchor.
4. A 400 (`settlementAssetId is required for an outgoing event`) that made every
   debt with a repayment schedule unsaveable.
5. Let the user pick a **default repayment wallet**.
6. Group the "Sắp tới" cashflow list by month with pagination, matching the
   money-events page.

## Files changed

### Copy
- `src/i18n/resources.ts` — ~60 "nhà mình" strings rewritten. As a label →
  "Gia đình"; as a possessive → dropped where Vietnamese does not need it; as an
  emotional verdict ("Nhà mình đang ổn") → factual ("Tài chính ổn định").
- Docs under `family-finance-v3.1/`, `memory/`, and 3 source comments followed.
  `session/*` logs were left alone — they are dated records.

### Step validation
- `src/features/debts/ui/components/debt-form-dialog.tsx` — `STEP_FIELDS` map +
  `requestStep()` gate on the Continue button and the stepper tabs.
- `src/features/debts/hooks/use-debts-page.ts` — expose RHF `trigger`.
- `debt-detail-page.tsx`, `networth-page.tsx` — pass `trigger` (two call sites).

### Form bugs
- Submit reload: the local `handleSubmit` swallowed the event, so RHF's
  `handleSubmit` never called `preventDefault()`. Steps 1–3 now also swallow
  implicit submission (Enter in an input) and advance instead — that was the
  "step 3 jumps back to step 1" bug.
- `originalAmount` is required, `outstandingAmount` optional and mirrors it
  until touched; `resolveOutstandingAmount()` resolves blank → borrowed amount
  at submit. Mirroring is off when editing (a saved balance has drifted).
- Due-date presets anchor on `firstPaymentDate || borrowedAt` — a loan term runs
  from the first repayment.

### Default repayment wallet
- Backend: `debts.repayment_asset_id` (nullable FK) + migration
  `20260821110000_debt_repayment_asset`; threaded through entity, DTO,
  repository, mapper, service. `createRepaymentSchedule` stamps it onto each
  generated repayment as `settlementAssetId`; `repaymentScheduleChanged`
  includes it so changing it restamps open repayments.
- Backend: **removed the create-time `settlementAssetId` requirement** for
  outgoing events. It contradicted the rule that a debt is not tied to one
  wallet, and blocked every scheduled debt. `completeCashflowEvent` still
  rejects a completion naming no wallet, so nothing settles as a silent no-op.
- Frontend: "Ví trả nợ mặc định" select on step 2, shown only when a repayment
  frequency is set.

### Upcoming pagination
- `src/features/forecast/ui/components/forecast-timeline.tsx` — month group
  headers + pagination (`PAGE_SIZE = 10`), mirroring
  `events-timeline-card.tsx`. Page is clamped, not reset, so shrinking the
  horizon (60 → 7 ngày) cannot land on an empty page.

## Key decisions

- **The settlement wallet is enforced at completion, not at creation.** Per the
  rule that a debt can be repaid from any cash/bank wallet, a repayment
  generated months ahead genuinely cannot name its wallet. The manual cashflow
  form still requires one for hand-entered outflows — that is a form rule (it
  needs the wallet to show goal impact), not a domain rule.
- **Only forward step navigation validates.** Going back never validates —
  the user is returning to fix something.
- **Fields validate on the step whose UI renders their error**, not the step
  that logically owns them, or the user is blocked with no visible error.

## Follow-ups

- No test runner in this repo; verification was `tsc --noEmit` + `eslint` +
  `check-copy`. Backend: 487/487 jest tests pass.
- The migration has not been applied to any database — run `prisma migrate`.
- Pre-existing lint errors in `assets`/`events`/`router` were left alone.
