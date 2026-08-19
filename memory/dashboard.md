# Dashboard (overview / snapshot)

Single-glance household financial status — answers *"Nhà mình đang ổn không?"*. Read-only aggregation. Related: [[snapshots-and-networth]], [[assets]], [[debts]], [[goals]], [[money-events]].

## Overview

**v11: Home is FOUR blocks in a mandated order** — Bức tranh hôm nay → Ba mươi
ngày tới → Mục tiêu → Tiền đang ở đâu. See [[forecast-and-flexible-money]],
[[what-if]], [[data-freshness]], [[goals]].

This replaces the v4.0 six-section order. What changed and why:

- **Tài sản | Nợ is gone from Home.** §12.4 now shows long-term holdings
  alongside cash, so the assets half had become the same list twice. Debt is
  read on the Tài sản page, where it sits against assets properly. Net worth
  still belongs there and nowhere else.
- **Nhật ký is gone from Home.** What changed is a page, not a tail on the
  overview — it answered a question nobody arrives with.
- **The two status chips are gone.** They stated a verdict before the reader
  had seen anything to verify it against. Both axes they carried are now shown
  as facts: staleness is named source by source inside §12.1, and the state of
  the month is the low point in §12.2, which says what happens and when. The
  chips' copy (`home.state.*`) is retained for other surfaces.
- **Mục tiêu chính became Mục tiêu.** One goal answered "how is that one
  going"; the household's question at this altitude is *which* goal is off
  pace, and that only reads as a comparison. Straight tracks, never rings —
  a ring has nowhere to put the on-pace milestone.

What-if remains an action button, not a section.

Four absences are deliberate product decisions, not omissions:

- **Total Assets / net worth is not the hero** (§2.6, §19). What a household can
  act on is its state and its flexible money. Net worth is allowed **only** on
  the Assets page (§14.1).
- **Total debt has no Home metric** (§2.13). It would be the largest number on
  the page for any couple with a mortgage and would win the visual fight against
  flexible money without helping today's decision. Debt enters the picture via
  its upcoming payment and via "Cần sớm".
- **Small transactions are banned from Home** (§12). The activity log (now its
  own page) records *changes to the picture* (a balance update, a new upcoming
  item, an asset revaluation), never individual purchases — logging those would make
  this an expense tracker.
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
- **The line under the hero says "có thể dùng ngay", not "tiền mặt".** It shows
  `currentSharedLiquidMoney`, which follows the switch — a gold bar the
  household marked usable is in it, a bank account they set aside is not.
- **"Money we can use" means `liquidity === 'usable_now'` — everywhere on Home.**
  That set is the household's own per-asset decision (`countsAsFlexible` → the
  stored bucket, see [[assets]]), **never a list of asset types**. Copy must not
  state the rule by type ("cổ phiếu và bất động sản không tính vào tiền linh
  hoạt"): one switch makes that sentence false.
- **Coverage** = the money sources the hero is computed FROM, named one per
  line **with the amount each contributes**, **oldest first**, capped at 4 with
  the overflow linking to Tài sản. **`usable_now` only** — exactly the set the
  forecast sums into its starting balance, so the rows add up to the total
  stated above them (both use `computeCurrentValue`, so they cannot drift).
  Filtering by "not long-term", as this did before, silently contradicted a
  household that switched a source off. `aging`
  counts as covered (it has not crossed the household's own threshold). The
  block renders even when everything is fresh: it is context for the number
  above it, not a warning. Naming the sources is what lets "Cập nhật nhanh"
  live at block level — it plainly means *these* sources.
- **Thirty-day line plots CHANGE SINCE TODAY, not the balance.** The balance
  itself is a flat line pinned near the household's total, where a month of
  real movement is a rounding error, and its readability depends on how rich
  the household is. The delta puts a true zero at today. Interpolation is
  `stepAfter`: a balance holds flat and moves on the day something is paid, so
  a smoothed curve would draw money leaving the account on quiet days. The
  chart only renders at **≥ 6 events** — below that the table already shows
  the sequence.
- **Goal milestone** = where progress must stand TODAY to land on the target
  date: `target − (plannedMonthlyContribution × monthsUntilTargetDate)`. Built
  ONLY from figures the household declared. No declared contribution or no
  target date → **no milestone**; inferring a pace from past behaviour would
  present a guess as a fact (see [[goals]]). A goal is marked `behind` (amber)
  only when it trails the milestone by **more than 10 points** — less than that
  is ordinary month-to-month drift, not a signal.
- **Money location is ranked horizontal bars, not a table and not an area map.**
  Bar length gives the same proportional reading of CONCENTRATION that area
  does, but every source keeps a full row, so its name and amount stay legible
  at any share — an area map cannot label a cell under ~2%, which is exactly
  the household with one main account. Groups are **`usable_now` ("Dùng được
  ngay") vs `held` ("Đang giữ")**, counted first and descending within each, so
  liquidity is never inferred from a fill alone and the first block answers
  "money usable today" the same way §12.1 does. Zero and
  negative values are not drawn. A source too small to draw still gets a
  visible stub. Capped at **6 rows**; the group totals beside the bars always
  cover ALL sources, drawn or not, so the two can never disagree.
- **A share that rounds to 0% or 100% is written `<1%` / `>99%`.** Rounding an
  obligation away is the one direction that figure must not err in.

## Composed cards

- **Snapshot card**: liquid total + split (cash vs bank_account), savings (`not_immediately_usable`), debt, **netWorth = totalAssets − totalDebt**, attention count, plus the goal split below.
- **Goal split**: `earmarkedForGoals` (every goal's resolved progress) and
  `unassigned`. Rendered by `GoalsSection` as "Đã dành cho mục
  tiêu" / "Chưa gán mục tiêu", and shown only once something is set aside.
  **Display only** — `netWorth` is NOT reduced by it and flexible money keeps
  its own formula: setting money aside does not make a household poorer, and
  subtracting it from the headline figure is the shape that got
  `protected_reserves` removed (a goal with a monthly contribution is already
  pulled down by the forecast, so subtracting again counts it twice). See
  [[goals]].
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
