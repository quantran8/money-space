# Cashflow events

Expected future movements of money — the **sole input to the forecast**.
Replaces upcoming payments. Related: [[money-events]], [[debts]], [[dashboard]],
[[goals]].

## Overview

A cashflow event is one expected movement of money in **either direction**, on a
date, with how sure it is and whether it is an obligation. The old
`upcoming_payments` model could only express money going *out*, which is why the
product had no running balance, no lowest-projected-balance, and no flexible
money.

Incoming and outgoing live on **one timeline** (spec §2.9 explicitly rejects a
separate incomes table) — the point is to see them interleaved day by day.

The full domain rules — the four axes, validation, recurrence maths, the
completion transaction — are documented once in the backend repo's
`memory/cashflow-events.md`. **That file is canonical; do not fork it here.**
What follows is what the web client must respect and where it lives in code.

## The four axes (client-relevant summary)

| field | values | client obligation |
|---|---|---|
| `direction` | `incoming` \| `outgoing` | never render an incoming event as if it were a bill |
| `requirement` | `required` \| `planned` \| `null` | `required` vs `planned` must be visually distinguishable (§26). `null` for incoming |
| `certainty` | `confirmed` \| `estimated` | `estimated` must be **marked** as such — never presented as certain |
| `status` | `expected` \| `completed` \| `pending_confirmation` \| `postponed` \| `overdue` \| `cancelled` | `postponed` is shown on the timeline but excluded from the balance |

**A recurring event is ONE record.** `expectedDate` is the current occurrence,
`recurrence` is the rule. Occurrence rows are never pre-created; the forecast
expands them virtually. Completing an occurrence advances `expectedDate` rather
than closing the record — so a completed recurring event still appears as
`expected` with a later date, and the client must not treat that as a bug.

Recurrence is `once | weekly | monthly | quarterly | yearly`. There is no
`none` and no `daily`/`biweekly`.

## Client rules

- **Never clamp a projected balance at zero.** Negative is the signal the
  product exists to surface.
- **Lifecycle actions are POSTs, not PATCHes** — `complete`, `postpone`,
  `cancel` each have their own endpoint because each runs a transaction
  server-side. PATCHing `status` directly is wrong.
- **`complete` is idempotency-guarded by `occurrenceDate`.** Send it (or omit it
  and accept the record's current date); a double-tap must not advance a series
  twice.
- Any cashflow write invalidates the **forecast, flexible-money,
  financial-state, dashboard, events and attention** query families — not just
  the cashflow list.

## Where it lives in code

**frontend-web** (`src/features/cashflow/`):

- `model/cashflow.types.ts` — the unions, mirrored from the backend entity.
- `api/cashflow-events.repository.ts` — CRUD + `complete`/`postpone`/`cancel`
  + the §18 list filters.
- `hooks/use-cashflow-events.ts` — query hook and the invalidation set.
- `model/cashflow-form.ts` + `hooks/use-cashflow-form.ts` +
  `ui/components/cashflow-event-form-dialog.tsx` — create/edit, reached from
  `/upcoming`.

### Form rules

- **`requirement` is outgoing-only.** For incoming the field is hidden and the
  payload omits it — the backend forces `null`, so sending a value would be a
  lie about what was asked.
- **Defaults are `required` + `confirmed`** — the conservative pair. Assuming an
  obligation is optional would understate what must be covered.
- **Row actions key off `sourceEventId`.** Occurrences are virtual, not rows;
  PATCHing an `occurrenceKey` 404s.
- **`complete` must pass `occurrenceDate`** — the idempotency key. Without it a
  double-tap advances a recurring series twice and drops a month from the
  forecast.

`postpone` and `cancel` are implemented in the repository but not yet surfaced
in any UI.

**Transitional (Phase 5 only, delete when Phases 6/9 land):**

- `model/legacy-payment-shim.ts` + `hooks/use-payments-compat.ts` — map a
  `CashflowEvent` onto the pre-v3.1 payment shape so `/events`, `/debts` and the
  dashboard survived the deletion of `features/payments/` in one commit. The
  compat hook requests `{ direction: 'outgoing', status: 'live' }`, which is
  what `/upcoming-payments` used to return. **Do not build on these.**

**backend**: `src/modules/cashflow-events/`, `src/common/utils/recurrence.ts`.

## Migration note

`/upcoming-payments` was **replaced, not aliased** — the payload shape changed
(`dueDate` → `expectedDate`, plus direction/certainty/requirement), so a silent
redirect would have handed clients data they'd misread. The `payments.*` i18n
namespace and `features/payments/` were deleted in Phase 5.
