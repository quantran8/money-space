# Dashboard (overview / snapshot)

Single-glance household financial status — answers *"Nhà mình đang ổn không?"*. Read-only aggregation. Related: [[snapshots-and-networth]], [[assets]], [[debts]], [[goals]], [[money-events]].

## Overview

**v4.0: Home is SIX blocks in a mandated order** — Bức tranh hôm nay → Ba mươi
ngày tới → Mục tiêu chính → **Tài sản | Nợ** → Tiền đang ở đâu → Nhật ký. See
[[forecast-and-flexible-money]], [[what-if]], [[data-freshness]], [[debts]].

Tài sản | Nợ is the **only** side-by-side pair on the page (§9.2) — each half is
misleading without the other. It is a balance reading, not the hero: both totals
are shown, their difference is **not**. Net worth belongs on the Assets page.

This replaces the v3.1 seven-section order. Three of those became parts of
section 1 rather than sections of their own: financial state and freshness are
now the two **independent status chips** at its head (a household can be fine on
stale data, or in trouble on fresh data — they are never merged), and what-if is
an action button, not a section.

Four absences are deliberate product decisions, not omissions:

- **Total Assets / net worth is not the hero** (§2.6, §19). What a household can
  act on is its state and its flexible money. Net worth is allowed **only** on
  the Assets page (§14.1).
- **Total debt has no Home metric** (§2.13). It would be the largest number on
  the page for any couple with a mortgage and would win the visual fight against
  flexible money without helping today's decision. Debt enters the picture via
  its upcoming payment and via "Cần sớm".
- **Small transactions are banned from Home** (§12). Nhật ký logs *changes to
  the picture* (a balance update, a new upcoming item, a reserve change), never
  individual purchases — logging those would make this an expense tracker.
- **Consequence never renders before it is asked for** (§2.9). No what-if
  preview appears until the household opens the dialog.

Home composes slices that own their own data rather than fanning out to
everything — it no longer pulls debts, events or cashflow.

## Home derivations (`model/home-derivations.ts`)

- **Money composition** splits current liquid money into committed → protected →
  flexible. `committed` is **derived**, not reported: `totalLiquid − protected −
  max(flexible, 0)`. Deriving it makes the three parts sum to the total by
  construction, so the bar can never show a misleading gap. A negative flexible
  figure must not inflate committed.
- **Running balance** (`Còn lại`) accumulates across the **whole** timeline
  before the visible rows are sliced, so a truncated table still shows true
  balances. Occurrences the forecast does not bank (estimated incoming, planned
  outgoing, postponed) are listed and flagged `cần xác nhận` but do **not** move
  the balance — see [[forecast-and-flexible-money]].
- **Tổng tiền mặt excludes `long_term`.** Long-term holdings are not cash and
  must not inflate that line.
- **Coverage** = one strip segment per money source, in the source list's own
  order (never sorted by state). `aging` counts as covered — it has not crossed
  the household's own threshold. The strip renders even when everything is
  fresh: it is context for the number above it, not a warning.

## Composed cards

- **Snapshot card**: liquid total + split (cash vs bank_account), savings (`not_immediately_usable`), debt, **netWorth = totalAssets − totalDebt**, attention count.
- **Asset trend**: sparkline from historical snapshots (`assetTrend` reads `SnapshotAssetValue`, see [[snapshots-and-networth]]).
- Debts, long-term goal, members, recent events, and attention ("cần chú ý") sections.

## Status bucket rule (`statusVariantFor`)

Frontend uses a simplified attention-count mapping:
- `attentionCount > 2` → `tense`
- `attentionCount > 0` → `attention`
- else → `stable`

(The backend spec defines a fuller status: good / attention / tight / insufficient_data based on liquidity vs. upcoming due, overdue items, and staleness. Frontend currently uses the simplified version — reconcile when wiring real snapshots.)

## Net-worth invariant

Borrowing raises an asset **and** a debt equally, so net worth does **not** inflate. See [[debts]], [[domain-overview]].

## Attention levels (Vietnamese labels)

`normal` / `important` (Quan trọng) / `urgent` (Khẩn cấp) / "Cần trao đổi". See [[snapshots-and-networth]] for AttentionItem.

## Known demo shortcut

Backend dashboard `totalDebt` is currently hard-coded to `18,000,000` — not a real rollup. Replace with an actual debt sum when leaving demo state.

## Where it lives in code

- **frontend-web**: `src/features/dashboard/{model/dashboard.ts, hooks/use-dashboard-overview.ts, hooks/use-dashboard-page.ts, api/dashboard.repository.ts, ui/...}`.
- **backend**: `src/modules/dashboard/` (`dashboard.service.ts`, `entities/{attention-item,snapshot-point}.entity.ts`, `repositories/prisma-dashboard.repository.ts`).
- **mobile-app**: to be ported.

## Enums

`StatusVariant = stable | attention | tense` (frontend); backend snapshot status `good | attention | tight | insufficient_data` is **derived at read time** (`deriveSnapshotStatus`), not a stored enum/column — see [[snapshots-and-networth]].
