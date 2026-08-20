# Cashflow events

Expected future movements of money — the **sole input to the forecast**.
Replaces upcoming payments. Related: [[money-events]], [[debts]], [[dashboard]],
[[goals]].

A live outgoing event also lowers the wallet it settles from **before it is
completed**, for every screen that reports goal money: the forecast hero, the
warning shown before an outflow is saved, and the running month's contribution.
A scheduled outflow is a decision already made, so the money behind it is not
counted as available to a goal. See [[goals]].

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
- **`complete` MUST carry an `assetId`** — which wallet the money moved through.
  The API rejects a completion without one (falling back to the event's own
  `settlementAssetId` first). This is not ceremony: with no asset the server's
  `applyWalletEffects` debits and credits nothing, so confirming "lương 20tr"
  left every balance untouched while the item looked settled.
  - Offer only assets passing `canSettleCashflow` (`features/assets/model/assets.ts`):
    `liquidity === 'usable_now'` **and** type `cash`/`bank_account`. That mirrors
    the server check, so the picker cannot produce a 400.
  - `settlementAssetId` is **required at create for OUTGOING** events (zod
    `superRefine` on the form, and `assertValid` on the server); it stays
    optional for incoming, and is pre-selected in the confirm dialog when set.
    It used to be optional on both, because planning often predates the decision.
    That changed when an outflow started to **outrank the goals sharing its
    wallet**: without a wallet, the goal money the outflow costs cannot be worked
    out, so the form could not show the trade before saving. See [[dashboard]].
  - **The form shows what the outflow takes from the goals on that wallet**
    (`GoalImpactNotice`). Per goal, `before → after`, biggest loser first. It
    states a consequence and is **never a block**: it does not gate the submit
    button, so a household that saves immediately is never left staring at a
    form refusing to submit for no visible reason.
  - **Computed locally** (`features/goals/model/spend-impact.ts`) from the
    `assetGoalUsage` data the wallet picker already loaded — not from the
    server's `spend-impact` endpoint. A round trip would either arrive after the
    household already clicked, or show a figure for the previous amount while in
    flight; a stale money figure is worse than none. The server keeps the
    endpoint as the figure of record and for other clients — **the two must
    change together.**
  - When the wallet backs a goal but no amount is typed yet, the notice still
    states the mechanism in words, so the household knows what the wallet does
    before choosing the number.
  - **The notice names WHICH half gives way**, never just the total: this
    month's contribution reduced (a month of saving paused) and money set aside
    taken back out (the goal moving backwards) are different events and not
    equally serious. The pace is squeezed out first, so a spend that fits inside
    it says so plainly instead of alarming about set-aside money that was not
    touched.
  - **Never show `before → after` per goal here.** "36,0 triệu → 34,0 triệu"
    reads as money withdrawn from the goal's balance even when only the monthly
    contribution moved — the same pair appears for both cases. Name the part
    that shrank instead.
  - **Keep it to 2–3 lines.** It sits between an amount field and a save button;
    a block long enough to skim past has warned nobody. It was 7 lines and is
    now a headline + a bar + one cause line, with per-goal lines only when more
    than one goal is affected. The "you can still record this" reassurance was
    dropped — nothing here blocks anything, so saying so invited the doubt it
    answered.
  - **`SpendImpactBar` carries the proportion**, which words cannot: 4tr out of
    52tr and 4tr out of 5tr read identically as text. Four slices in the order
    money gives way — pace, set aside (alert colour), goal remainder,
    unassigned — and `aria-hidden`, because the sentences already say every
    figure. Coloured dots on the per-goal lines tie them to their slice, so the
    bar needs no legend.
  - **The notice must explain WHY a wallet with money in it still costs a
    goal.** It names the balance and how much of it is genuinely unassigned
    (`freeAmount` — the same subtraction the write path enforces). Without that
    line the figures read as the app taking money that was plainly sitting
    there, and an unexplained number erodes trust in every other figure on the
    screen. `freeAmount === 0` — the whole balance already promised — is the case
    that looks wrong until it is said out loud.
  - **The wallet picker shows each wallet's balance next to its name**
    (`computeCurrentValue`, the single source of truth per repo convention).
    Which wallet can carry the spend is the decision being made, and it cannot
    be made from names alone.
  - When the household has **no wallet at all**, an outflow cannot be saved; the
    form says so rather than leaving the submit button silently refusing.
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

**Compat shim: removed.** `model/legacy-payment-shim.ts` and
`hooks/use-payments-compat.ts` are **deleted**. Every consumer now reads
`CashflowEvent` through `useCashflowEvents` directly:

- `/debts` (`use-debts-page`, `use-debt-detail`, and the four debts UI
  components) filter with `{ direction: 'outgoing', status: 'live' }` — the same
  narrowing the shim did, now stated at the call site.
- `/events` no longer reads cashflow events at all; see [[money-events]] for the
  ledger / forecast split and why its "upcoming" tab is gone.

When rendering a cashflow row, derive urgency from `attentionLevel` plus
`status` — never from a three-way `important | normal | pending` triple. That
legacy triple conflated urgency with lifecycle, which is exactly why
`pending_confirmation` is the only genuine lifecycle case among them.

**backend**: `src/modules/cashflow-events/`, `src/common/utils/recurrence.ts`.

## Migration note

`/upcoming-payments` was **replaced, not aliased** — the payload shape changed
(`dueDate` → `expectedDate`, plus direction/certainty/requirement), so a silent
redirect would have handed clients data they'd misread. The `payments.*` i18n
namespace and `features/payments/` were deleted in Phase 5.
