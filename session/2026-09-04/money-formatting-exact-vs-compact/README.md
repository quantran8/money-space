# Money formatting: exact đồng vs compact scale

- **Date**: 2026-09-04
- **Session folder**: `session/2026-09-04/money-formatting-exact-vs-compact/`
- **Status**: done

## What the task is

Started from a backend bug (gold `currentValue`/`marketPrice` priced per lượng
instead of the position's unit). Once the API was right, the asset detail card
still read wrong: giá vốn 15.120.000đ and giá hiện tại 15.050.000đ **both**
rendered as "15,1 tr" beside a "−70.000đ" loss.

The user's point: rounding is dangerous in finance when the number has to be
exact. So the task became an app-wide audit — which figures may be compact, and
which must be exact to the đồng.

## Changes made

**New formatter** — `packages/core/src/shared/lib/format-money.ts`
- `formatVndExact(value, currency)` — full đồng ("15.120.000đ"). Guards
  NaN/Infinity and delegates non-VND to `formatMoney`, like the other helpers.
  Its doc block carries the exact-vs-compact rule.

**Assets**
- `web/.../asset-detail-page.tsx` — hero (market/balance assets only), holding
  line unit price, giá vốn, lãi/lỗ, giá mua trung bình.
- `web/.../asset-purchase-dialog.tsx` — tổng tiền, giá vốn ước tính, wallet
  balances in the funding picker.
- `web/.../asset-sale-dialog.tsx` — dự kiến nhận + the breakdown caption (whose
  own comment already claimed "in full precision" while calling a compact fn).
- `web|mobile/.../asset-form-{dialog,sheet}.tsx` — the "đổi giá trị từ X thành Y"
  sentence.
- `web|mobile/.../saving-withdrawal-panel.tsx` — the on-time vs early table and
  its difference callout.
- `web|mobile/.../asset-goal-usage*.tsx` — free/committed pair, countedValue,
  initial, monthly plan, contributed/remaining, aria label, overdrawn warning.
- `packages/core/.../assets-form.ts` — insufficient-balance message.

**Debts**
- `web|mobile/.../debt-update-mode-{dialog,sheet}.tsx` — the `money()` helper
  behind the change preview.
- `web/.../debt-form-dialog.tsx`, `mobile/.../debt-form-sheet.tsx` — review-step
  amounts.

**Goals / cashflow / events / what-if**
- `web/.../goal-progress-change.tsx` — "Hôm qua X → hôm nay Y · asset giảm Z".
- `web/.../goal-form-dialog.tsx` — target echo under the input, goal-picture
  block (target/current/remaining), summary parts + total, review step.
- `web|mobile/.../goal-impact-notice.tsx` — pace and goal-total before→after.
- `web|mobile/.../whatif-result-blocks.tsx` — applied-sale before→after + cash.
- `mobile/.../whatif-asset-sale-fields.tsx` — the sale preview line.
- `mobile/.../cashflow/lib/wallet-options.ts` — wallet balances in the picker.
- `packages/core/.../wallet-overdraft.ts`, `web/.../record-card.tsx` — overdraft
  amounts.

**Docs** — `design/01-foundations.md` §6, `memory/asset-valuation.md`.

## Key decisions

- **Compact stays the default.** `formatVndScale` was NOT changed globally. §6
  asks for the scale, and for a projection full đồng is *false precision* —
  wrong in the other direction ("Không hiển thị precision cao hơn input").
- **The test is not "is this money important"** (all of it is) but **"can
  rounding make the screen contradict itself?"** Exact when the value is known
  to the đồng AND the reader must reconcile it on screen. Compact for
  at-a-glance figures never reconciled.
- **Chart/axis/legend formatters were left compact**, including the goal-usage
  ring's `formatAmount` prop, while the metrics beside it went exact.
- **One real bug, not just display**: `PreviewRow` in the debt update dialogs
  hides a row when `before === after` **compared on formatted strings**. A
  70.000đ correction made both sides "84,1 tr", so the row vanished while the
  footnote still said only changed rows are listed — the user confirmed an
  invisible change before a write that can rewrite the debt's history. Exact
  formatting fixes the hide as a side effect; the string comparison itself is
  still worth replacing with a numeric one.
- Rounding is display-only elsewhere: every `Math.round` in form/model code
  rounds to whole đồng (VND's smallest unit), and no formatted string is parsed
  back into a value. The risk was bad user decisions, not corrupted data.

## Mobile app parity notes

Mobile was changed in the same pass (asset form sheet, saving withdrawal panel,
goal usage, goal impact notice, what-if blocks + sale fields, wallet options,
both debt sheets), so web and mobile are already in parity.

Still open, deliberately not done:
- Mobile has **no** asset purchase summary — `asset-quantity-sheet.tsx` shows no
  total or next cost basis at all, so a purchase is committed without ever
  seeing either. That is a missing feature, not a formatting gap.
- Mobile `debt-row.tsx` / `debt-detail` outstanding balances and instalment
  amounts are still compact; the web debt detail page is too. Both were reported
  by the audit and left for a follow-up.
- `web/.../debts-form.ts` `formatVndShortLocal` and `debts.repository.ts`
  `formatCompact` look like dead display paths — worth deleting if confirmed.
