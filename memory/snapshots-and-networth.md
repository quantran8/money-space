# Snapshots, net-worth history & attention items

The periodic net-worth snapshot model that backs the dashboard trend and the "is the household OK?" question. Related: [[dashboard]], [[assets]], [[asset-valuation]].

## Snapshots

A `Snapshot` is a periodic (weekly/monthly) net-worth snapshot of a household. It persists totals:
- `totalLiquid`, `totalSavings`, `totalLongTermAssets`, `totalDebt`, `upcomingDueAmount`, `attentionCount`.
- `status` (`good | attention | tight | insufficient_data`) and `sourceMode`
  (`manual | calculated | mixed`) are **DERIVED at read time** — from the totals +
  attentionCount, and from the child valuation methods respectively. They are
  **not stored columns** (dropped in backend migration `..._drop_dead_columns`):
  storing them would go stale if the derivation rule changed, and nothing wrote them.
- `createdById` is nullable (`ON DELETE SET NULL`) — a snapshot outlives the
  member who created it.

## SnapshotAssetValue

Denormalizes **each asset's value/type/liquidity/visibility at snapshot time** (unique per `[snapshotId, assetId]`). This is what the dashboard's `assetTrend` reads.

## Auto-snapshot (system-written, per-day, granular)

Snapshots are written **automatically by the system** whenever net worth changes
— there is **NO manual create endpoint** (only GET list/detail). Triggers: asset
create/update/delete, asset sale, every money-event write, debt create/update/delete.
Each fires AFTER the triggering write commits.

**Per-day upsert**: one live snapshot per household per day (keyed on "today" in
the household timezone, default `Asia/Ho_Chi_Minh`). The first change of the day
creates the parent + **seeds a FULL line per active asset**; later changes are
**granular** — upsert only the changed asset's line, or remove it if the asset was
deleted / fully sold. Each frozen line references the asset's current
`AssetValuation` via `valuationId` (lineage; null if none — the line still freezes
the value).

**Totals = SUM of children, always**: the parent `total_liquid/savings/long_term`
are recomputed from `SUM(value) GROUP BY liquidity` over the current child rows
(+ outstanding-debt total, upcoming-due total, open attention count), so the
parent can never diverge from its children.

**Live vs. historical**: the dashboard header net worth is computed on the fly
(from the live valuation engine + the real outstanding-debt total — the old
hardcoded `totalDebt = 18_000_000` is gone), NOT read from the latest snapshot,
so it reflects today's prices. The `assetTrend` reads the frozen `snapshots` rows.

## Immutability invariant

**Snapshots before today are immutable.** Only TODAY's snapshot is mutated
(granular upsert / recompute) until the day rolls over; days before today are
never touched. Editing an old valuation therefore can't rewrite past snapshots.
Enforced by omission: no update/delete of snapshot rows/lines (today's lines are
hard-replaced only during the same-day granular upsert). See [[domain-overview]].

## AttentionItem

An alert/notification, kept calm and non-judgmental (see [[domain-overview]] tone rule):
- **level**: `normal | important | urgent`.
- **status state machine**: open → seen → resolved / dismissed. This IS the
  lifecycle — there is **no `deletedAt`** (dismissed = gone; a second delete flag
  would conflict). Queries exclude `dismissed` (or filter to `open`) instead of a
  soft-delete filter.
- **polymorphic link**: `relatedObjectType` ∈ asset / upcoming_payment / financial_goal / snapshot / money_event / debt, plus `relatedObjectId`.
- **Attention is centralized here.** The old denormalized `is_attention_needed` /
  `is_large_event` flags on `money_events` and `is_attention_needed` on
  `upcoming_payments` were dropped — they were unread or pure-derived mirrors, and
  three sources of truth disagree. `upcoming_payments.attention_level` stays (it
  carries the "important" flag that `PaymentStatus` can't express).

## AuditLog

Append-only per-household action log (actor, action string, entityType/id, JSON metadata). Written on significant flows (e.g. `household.created`, `snapshot.created`). **`actorId` is nullable** (`ON DELETE SET NULL`): system/worker flows (auto-snapshot, price recalc) have no request user → NULL actor = system.

## Where it lives in code

- **backend**: schema entities `Snapshot`, `SnapshotAssetValue`, `AttentionItem`, `AuditLog`; read via `src/modules/dashboard/`.
- **frontend-web**: consumed by `src/features/dashboard/` (asset trend, attention list).
- **mobile-app**: to be ported.

## Enums

`SnapshotStatus = good | attention | tight | insufficient_data`, `SnapshotSourceMode = manual | calculated | mixed`, `AttentionItemStatus = open | seen | resolved | dismissed`, `AttentionLevel = normal | important | urgent`.
