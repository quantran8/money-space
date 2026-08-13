# Dashboard (overview / snapshot)

Single-glance household financial status — answers *"Nhà mình đang ổn không?"*. Read-only aggregation. Related: [[snapshots-and-networth]], [[assets]], [[debts]], [[goals]], [[money-events]].

## Overview

**v3.1 (Phase 9): Home is now seven sections in a mandated order** — Financial
State → Flexible Money → What-if CTA → 30 Days Ahead → Money Location → Main
Goal → Freshness. See [[forecast-and-flexible-money]], [[what-if]],
[[data-freshness]].

Two absences are deliberate product decisions, not omissions:

- **Total Assets is not the hero** (§19). Net worth is a vanity number; what a
  household can act on is its state and its flexible money.
- **Small transactions are banned from Home** (§12). Recent-events and discuss
  lists belong on `/events`.

Home composes slices that own their own data rather than fanning out to
everything — it no longer pulls debts, events or cashflow.

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
