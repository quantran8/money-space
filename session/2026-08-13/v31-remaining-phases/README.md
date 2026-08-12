# Money Space v3.1 — remaining phases (5–11)

**Status: backend complete and green. Frontend not started beyond Phase 0.**

Approved plan: `~/.claude/plans/family-finance-v3-1-implement-recursive-lollipop.md`
Spec: `money-space/family-finance-v3.1/` — `design.md` there is canonical.

---

## Where things stand

| Phase | Work | State |
|---|---|---|
| 0 | FE `CLAUDE.md` rewrite, dead-code deletion, query keys, whatif store, `options.*` i18n, copy lint. BE `clock.ts`, `shared-calculation.ts` | ✅ |
| 1 | BE migrations 1–5, 7–13; goal `current_amount` stored + money-event mirror | ✅ |
| 2 | BE `cashflow_events` rename + module; `payments` deleted; auto-snapshot hooks retired | ✅ |
| 3 | BE forecast core: forecast / flexible money / financial state / what-if / goal projection | ✅ |
| 4 | BE protected-reserves, attention, invites, `POST /snapshots`, freshness, goal projection routes | ✅ |
| **5–11** | **Frontend** | **not started** |

**Backend gate as of 2026-08-13:** `prisma validate` clean · `nest build` clean ·
**248 unit + 4 e2e passing** · zero index-mirroring drift.

### ⚠️ Migrations are written but NOT applied

15 migration files exist under `money-space-backend/prisma/migrations/`; the
Supabase database is untouched. `prisma migrate deploy` is the user's call.
**Nothing in phases 5–11 works against the live DB until they are applied.**

Verified statically only — every SQL index name matches what Prisma generates.
The chain has never been replayed against a real database, which is the limit of
what could be proven without one.

Two pre-existing partial-unique indexes (`money_event_categories_global_code_uniq`,
`profiles_email_unique`) cannot be expressed in Prisma's schema language at all.
Pre-existing, not introduced by this work — but `prisma migrate dev` would want to
drop them. Use `migrate deploy`.

---

## Backend API surface now available

Everything below is live in code and covered by tests.

```
# forecast core (§26A–D)
GET  /households/:hid/forecast?horizon_days=7|30|60|90
GET  /households/:hid/flexible-money
GET  /households/:hid/financial-state
POST /households/:hid/what-if                    ← a READ; no `edit` capability

# cashflow events (§18) — replaces /upcoming-payments, no aliases
GET|POST         /households/:hid/cashflow-events
PATCH|DELETE     /households/:hid/cashflow-events/:id
POST             /households/:hid/cashflow-events/:id/complete|postpone|cancel

# reserves (§19C)
GET|POST|PATCH|DELETE /households/:hid/protected-reserves[/:id]

# attention (§29)
GET  /households/:hid/attention-items            → { items, storedCount, derivedCount }
POST /households/:hid/attention-items            flag by hand
POST /households/:hid/attention-items/:id/seen|resolve|dismiss
POST /households/:hid/attention-items/dismiss-derived

# goals (§20, §26C)
GET  /households/:hid/financial-goals?include=projection
GET  /households/:hid/financial-goals/:id        (projection always attached)
GET  /households/:hid/financial-goals/:id/projection

# snapshots (§26) — append-only
GET|POST /households/:hid/snapshots

# freshness (04 §12)
GET  /households/:hid/assets/data-freshness
POST /households/:hid/assets/confirm-unchanged

# invites (§6)
GET|POST|DELETE /households/:hid/invites[/:id]   (admin)
GET  /invites/:token                             ← NO :householdId, deliberately
POST /invites/:token/accept                      ← NO :householdId, deliberately
```

### Contracts the frontend must respect

1. **The backend never sends prose.** Every state, level, reason, and assumption
   is a machine code (`on_track`, `cashflow_overdue`, `horizon_days`,
   `no_contribution`, …). The client renders all copy. Assumption values are
   pinned by a test that rejects Vietnamese diacritics.
2. **Flexible money and lowest projected balance may be NEGATIVE.** Never clamp,
   never `Math.max(0, …)`. Negative is the signal the product exists to surface.
3. **Never label flexible money a spending allowance** — not "Ngân sách được phép
   tiêu", not "Số tiền bạn nên tiêu" (design §12.3).
4. **What-if reports consequence, never a verdict.** No "Bạn nên/không nên mua".
   `resultType` (`comfortable|watch|tight|not_covered`) is for styling only.
5. **Derived attention ids** are `derived:<ruleCode>:<scope>` — synthetic, not
   rows. PATCHing one 404s; dismiss via `POST .../dismiss-derived` with
   `{ ruleCode, relatedObjectId }`.
6. **Financial state enum changed**: `good|attention|tight|insufficient_data` →
   `on_track|watch|tight|incomplete`. Breaking; nothing reads it yet.

---

## Phase 5 — cashflow slice; delete `features/payments`

The backend route `/upcoming-payments` **no longer exists**, so the current app's
payments calls are already dead against a migrated backend. This phase is the
cutover.

1. Build `src/features/cashflow/` on the `src/features/goals/` pattern
   (`api/*.repository.ts` + `hooks/use-*.ts` + `hooks/use-*-page.ts` +
   `model/*.types.ts` + `ui/`).
2. Add a `toLegacyPaymentItem` shim mapping a `CashflowEvent` to the shape the
   existing components expect (`dueDate` ← `expectedDate`, `status: 'unpaid'` ←
   `'expected'`, `'paid'` ← `'completed'`).
3. Mechanically re-point the consumers, then **delete `src/features/payments/`**.

Consumers to re-point (grep `usePayments|features/payments`):
`features/debts/hooks/use-debts-page.ts`, `features/debts/hooks/use-debt-detail.ts`,
`features/debts/ui/debt-detail-page.tsx`, `features/dashboard/*`.
Harvest `payments-gentle-card.tsx`'s calm-list markup into `features/freshness/`
**before** deleting.

**Gate:** `/`, `/debts`, `/events` still render live data.

## Phase 6 — forecast slice + `/upcoming`

`src/features/forecast/` + a new `/upcoming` route (temporarily an 8th nav item;
the 5+3 restructure lands in Phase 10).

- Horizon chips 7/30/60 via the existing `filter-chip.tsx`.
- `summary-strip.tsx` for Incoming / Outgoing / Lowest / Today.
- Timeline reusing `events-timeline-card.tsx`'s day grouping and
  `record-card.tsx`'s row+dropdown, **plus a trailing `→ balance` column** and
  confirmed/estimated + required/planned markers.
- Red **only** for an actual projected shortfall; orange for near-reserve.

**Gate:** `/upcoming` works end-to-end at all three horizons.

## Phase 7 — reserves + whatif slices

`WhatIfSheet` mounted once in `AppShell`, driven by the zustand store already
built in Phase 0 (`src/shared/stores/whatif-store.ts`). **No `/what-if` route** —
it is a global contextual action opened from Home, `/upcoming`, `/goals`,
`/goals/:id`, and a mobile FAB.

- `responsive-dialog.tsx` is already centered-dialog-on-desktop /
  bottom-sheet-on-mobile.
- Input reuses `EventField` + `EventMoneyInput` (the 42px hero money input is
  literally the wireframe).
- Result blocks in the **mandated order**: Upcoming Safety → Reserve impact →
  Flexible before/after → Goal consequence → Assumptions, one `SubSection` each.
- Actions: Thử số khác · Chia sẻ (clipboard summary + toast; no persistence) ·
  Xem cách tính. **No "Save scenario"** — there is no table and must not be one.

## Phase 8 — goals projection

Extend `primary-goal-card.tsx` tiles to Target date · Theo tốc độ hiện tại · Cần
thêm ~X/tháng. New `goal-projection-panel.tsx` shows **progress only** (no
projected date) when `plannedMonthlyContribution` is undeclared.

Delete the decorative `allocation-card.tsx`, `this-month-card.tsx`, and
`recent-updates-card.tsx` (client-only fake state). Remove the transitional
`deadline` alias emitted by `toGoalCard`.

## Phase 9 — Home rework

Build the 7 sections alongside the old ones, swap `dashboard-page.tsx` in **one
commit**, then delete the dead components. Composition only — everything it needs
ships in 6–8.

Mandated order: **Financial State → Flexible Money → What-if CTA → 30 Days Ahead
→ Money Location → Main Goal → Freshness.**

Keep the `dashboard` slice folder name (avoids rename churn). Delete:
`net-worth-hero.tsx` (§19 — Total Assets must not be the hero),
`discuss-section.tsx`, `recent-events-section.tsx` (small transactions are banned
from Home), `long-term-goal-section.tsx` (superseded by the extended
`primary-goal-card.tsx`, reused directly).

Money Location borrows the segmented bar from `assets-breakdown-section.tsx` and
the per-person rows from `responsibility-section.tsx`, **grouped by holder** by
default.

## Phase 10 — freshness + household slices, nav restructure

- `src/features/freshness/` — freshness sheet + confirm-unchanged.
- `src/features/household/` — a composition slice mounting the existing members
  components, plus financial-mode card (5 radios), reserve card, assets summary +
  link, sharing defaults, update frequency, freshness.
- `/settings` trims to account / data / danger-zone.
- **Sidebar → 5 primary + 3 secondary** (the approved decision):
  primary `/` Tổng quan · `/upcoming` Sắp tới · `/goals` Mục tiêu · `/assets`
  Nguồn tiền · `/household` Nhà mình; secondary (under a `<Separator/>`)
  `/events` Lịch sử · `/debts` Khoản vay · `/settings` Cài đặt.
- Redirects: `/payments` → `/upcoming`, `/members` → `/household`.
- Mobile bottom nav + what-if FAB.

## Phase 11 — asset classification fields, then onboarding

Asset form gains `financial_nature` / holder / sharing. **MVP UI exposes 3
sharing levels** (Hiện chi tiết / Chỉ tính vào tổng / Riêng tư) while the model
keeps all 4, so a record already stored as `grouped` renders its label read-only
rather than an empty Select.

⚠️ `settings-form.ts` currently persists `'overview' | 'grouped' | 'detailed'` —
that is a **breaking rename** to the canonical union.

Then the onboarding wizard (last — it composes every other slice's field groups):
12 steps → 10 screens, resumable via `{onboardingStep, householdId}` in the
household store. household → financial mode → invite → 2–3 money sources with
holder+sharing → reserve → recurring income → 1–3 obligations → main goal →
**first financial picture (Clarity Moment)** → **first what-if (Consequence
Moment)**.

Biggest reuse win: extract field groups out of `asset-form-dialog.tsx` /
`goal-form-dialog.tsx` into `*-fields.tsx` so the dialog and the onboarding step
render the same fields.

---

## Process rules (from both repos' `CLAUDE.md`)

- **Every FE phase** gets `session/<date>/<task-name>/README.md` copied from
  `session/TEMPLATE.md` — files changed, decisions, **mobile-app parity notes**.
- **Business-logic docs under `memory/` update in the SAME commit as the logic**,
  in both repos. Backend `memory/` is current as of Phase 4; the frontend's
  needs the v3.1 files mirrored.
- New i18n namespaces in **both** `vi` and `en`: `home.*` (replaces `dashboard.*`),
  `upcoming.*`, `whatif.*`, `household.*`, `reserve.*`, `freshness.*`,
  `goals.projection.*`. Remove the whole `payments.*` namespace.
- **Banned vocabulary is lint-enforced** — `scripts/check-copy.mjs` runs before
  eslint in `npm run lint`. Kiểm soát · Theo dõi đối phương · Truy vết · Phát hiện ·
  Đáng ngờ · Hoang phí · Sai lầm · Không được mua · Cảnh báo · Vượt chi ·
  "Ai tiêu khoản này?" · Bạn nên/không nên mua · Phân tích rủi ro · Kiểm tra ngay ·
  Theo dõi chi tiêu · Mua được/Không mua được.

### Known: `npm run lint` was ALREADY red before this work

6 pre-existing eslint errors, confirmed by stashing. **`npm run build` is the
reliable per-phase gate.** The copy check is ordered *before* eslint so the
pre-existing failures can't skip it.

---

## Suggested order of attack

Phases 5 → 6 → 7 are the critical path: they make the product's actual thesis
(Clarity → Foresight → Decision) visible for the first time. 8–11 are composition
and polish on top.

Apply the migrations first. Building eight phases of UI on an unvalidated
migration chain is the one genuinely expensive ordering mistake available here.
