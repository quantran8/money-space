# Edit money event — preserve type + fields, block non-editable types

- **Date**: 2026-07-12
- **Session folder**: `session/2026-07-12/event-edit-type-specific/`
- **Status**: done (phase 1 + phase 2 asset_sale edit)

## What the task is

Editing a money event was too generic: the edit form collapsed every event into
one of 5 quick-actions (expense/income/transfer/goal/payment_paid), which
**rewrote the event's type and dropped its type-specific fields**. Editing an
`asset_sale` turned it into an `expense` and lost `feeAmount`/`soldQuantity`/
`soldValue`; editing a debt repayment lost its `debtId`; system events
(`asset_update` revaluation) could be corrupted too.

Phase 1 (this task): stop the corruption. Preserve the original type + fields on
edit for basic events, and **block** editing of system / dedicated-flow events
(offer Delete instead). A later phase can add type-specific edit dialogs
(e.g. reuse AssetSaleDialog in edit mode) — deferred because a faithful
asset_sale edit needs the pre-sale quantity and backend position reverse+reapply.

## Changes made

**Backend**
- `src/common/utils/money-space.utils.ts` — `toMoneyEventCard` now also returns
  `soldQuantity` / `soldValue` so an edit can read/preserve sale specifics.

**Frontend**
- `src/features/events/model/events-form.ts`
  - `LocalMoneyEvent` + `FinancialRecordItem`: added `feeAmount`, `soldQuantity`,
    `soldValue`, `debtId`, and `canEdit?`.
  - `toMoneyEventSeed`: stops dropping `feeAmount/soldQuantity/soldValue/debtId`;
    prefers explicit `fromAssetId/toAssetId` (transfers set both) over the
    direction-derived single `assetId`.
  - New `isEditableEventType(type)` — editable set = expense, income, transfer,
    goal_contribution, payment_paid, adjustment, other. Excluded (blocked):
    asset_sale, asset_purchase, asset_update, debt_update.
- `src/features/events/hooks/use-events-page.ts`
  - `onSubmitActual`: on edit, uses the **original** event's type (no collapse)
    and carries `debtId/feeAmount/soldQuantity/soldValue` through; keeps the
    user's title on edit. On create, unchanged.
  - `openEditEvent`: guards on the RAW seed-event type via `isEditableEventType`;
    blocks non-editable types with a toast.
  - Timeline records carry `canEdit` (computed from the raw type; payments always
    true). Exposes `editingEventType` (raw type of the event being edited).
- `src/features/events/ui/components/record-card.tsx` — hides the "Sửa" button
  when `record.canEdit === false` (Delete stays available).
- `src/features/events/ui/components/event-form-dialog.tsx` — new
  `editingEventType` prop; title/description reflect "Sửa: <label>" on edit
  (label from `eventTypeLabels`).
- `src/features/events/ui/events-page.tsx` — threads `editingEventType`.

## Key decisions

- **Type preservation over type inference on edit.** The backend PATCH accepts
  all fields incl. type/fee/soldQty/soldValue/debtId, so the fix is purely
  frontend: send the original type + special fields rather than re-deriving from
  a collapsed quick-action.
- **Editability decided on the RAW type**, because the local model downgrades
  `asset_update` → `adjustment` (adjustment is editable, asset_update is not).
- **Block, don't half-support**, the complex types this phase: asset_sale
  (position reversal), asset_update (revaluation side-effect), debt_update /
  asset_purchase (debt/purchase flow). They show Delete only.

## Phase 2 — asset_sale edit via its dedicated dialog

Editing an `asset_sale` now reopens the **AssetSaleDialog** (prefilled) instead
of being blocked. The backend already handles it: `updateMoneyEvent` reverses the
old sale's position then re-applies the edited one.

- `src/features/assets/model/asset-sale-form.ts`
  - `effectiveHeldQuantity(asset, editingEvent?)` — editable max = current holding
    + this sale's `soldQuantity` (the PRE-sale holding, since the backend adds it
    back before re-applying).
  - `buildAssetSaleSchema(t, asset, editingEvent?)` — validates against the
    pre-sale max.
  - `toSaleEditValues(asset, event)` — prefill the form from an existing sale
    event (quantity/proceeds/fee/wallet/date/note, derives `sellAll`).
  - `toSalePayload(asset, values, asOf, editingEvent?)` — `sellAll` resolves to
    the pre-sale quantity/value when editing; keeps the event's title.
- `src/features/assets/hooks/use-asset-sale.ts` — added `editingEvent` state,
  `openSaleForEdit(asset, event)`, `isEditing`; submit branches to
  `updateEvent` vs `createEvent`; prefill on open; `currentQuantity` returns the
  pre-sale max.
- `src/features/assets/ui/components/asset-sale-dialog.tsx` — `isEditing` prop →
  edit title (`assets.sale.editTitle`) + submit label (`assets.sale.submitEdit`).
- `src/i18n/resources.ts` — added `assets.sale.editTitle` / `submitEdit` (vi+en).
- `src/features/events/hooks/use-events-page.ts` — mounts `useAssetSale()`;
  `openEditEvent` routes `asset_sale` → `sale.openSaleForEdit(soldAsset, rawEvent)`;
  `canEdit` is now true for `asset_sale`; exposes `sale`.
- `src/features/events/ui/events-page.tsx` — mounts `<AssetSaleDialog>` wired to
  the sale hook (uses `asOf` from `useAssets()`).

**Verified**: simulated the backend reverse+reapply on the live DB — position
10 → sell 4 → 6 → edit to sell 3 → reverse (+4 → 10) → apply (−3 → 7). Correct.

Still deferred: type-specific edit for `debt_update` / `asset_purchase` (kept as
Delete-only). `asset_update` stays non-editable (revaluation side-effect).

## Phase 3 — asset_update (revaluation) edit, simplified + two-way sync

`asset_update` is now editable through a **simplified** generic form (was
Delete-only). It shows only **Giá trị mới / Ngày / Tên / Ghi chú** — no "Trả từ
đâu", no "Thêm chi tiết". Editing the value **re-prices the asset**: the backend
syncs it back to `assets.current_value` (+ `manualValue` for manual assets) AND
the linked `asset_value_history` point — the full table stays consistent.

- **Backend**
  - `assets.service.ts` — new `applyRevaluationEdit(householdId, assetId,
    newValue, context)`: manual asset → set `manualValue = newValue` then
    `upsertCurrentValuation` (writes the event-linked history point +
    current_value cache); non-manual → refresh point/cache at the derived value.
  - `money-events.service.ts` `updateMoneyEvent` — dedicated `asset_update`
    branch: the edited `amount` is the NEW ABSOLUTE value; stores the event
    `amount` as the delta from the asset's pre-event value
    (`currentStored − oldEventAmount`), then calls `applyRevaluationEdit`. Skips
    the wallet/sale reverse+apply path.
- **Frontend**
  - `use-events-page.ts` — `canEdit` true for `asset_update`; `openEditEvent`
    lets it through (simplified form, `showMoreDetails=false`); the reset block
    prefills the amount from the **asset's current value** (not the delta the
    event stores); `onSubmitActual` short-circuits a revaluation edit → sends
    `type:'asset_update'`, `amount`=absolute value, `toAssetId`=the asset, no
    from-asset.
  - `event-form-dialog.tsx` — passes `isRevaluation={editingEventType ===
    'asset_update'}` to the form.
  - `actual-record-form.tsx` — `isRevaluation` prop: header "Định giá lại tài
    sản", amount label "Giá trị mới", hides wallet + details, shows a plain note
    field, submit label "Lưu định giá".

**Verified** on the live DB: edit a "Định giá lại" event 3tỷ → 3.5tỷ →
`asset.current_value`, `money_events.amount` (delta), and the
`asset_value_history` point all become 3.5tỷ. Full-table sync confirmed.

## Phase 4 — critical root-cause fix: preserve the API event id

**Bug**: `toMoneyEventSeed` set `id: createId()` — it minted a NEW random id for
every event instead of keeping the API's `event.id`. Consequences (all edits
were affected, not just routing):
- Type-routing in `openEditEvent` does `seedEvents.find(r => r.id === eventId)`;
  the local record's id never matched a raw seed id, so `raw` was `undefined` and
  **asset_sale / asset_update fell through to the generic form** (the symptom the
  user saw: "Đã bán VGI" opening as a plain expense).
- `canEdit` (`seedEvents.find(r => r.id === event.id)`) never matched → fell back
  to the downgraded local type.
- `updateEvent.mutateAsync({ eventId })` / delete sent a **random id** the backend
  didn't have.

**Fix** (`events-form.ts`): `id: event.id ?? createId()` — keep the API id, only
mint one for a seed that has none. This makes type-routing, `canEdit`, edit PATCH
and delete all target the correct event.

## Mobile app parity notes

- **CRITICAL**: when mapping an API money event into the local model, KEEP the
  API `id` — never mint a new one. Otherwise edit/delete/type-routing target the
  wrong (or a nonexistent) event.
- Carry `feeAmount/soldQuantity/soldValue/debtId` through the mobile event model
  and the edit payload; do not drop them when mapping API → local model.
- Add an editable-type gate mirroring `isEditableEventType`; hide/disable Edit
  for asset_sale/asset_purchase/asset_update/debt_update, keep Delete.
- On edit, send the event's original `type` (never re-derive from a UI action).
- Backend `toMoneyEventCard` now returns soldQuantity/soldValue — mobile can rely
  on them for prefill when it later adds type-specific edit.
- Deferred (both apps): type-specific edit dialogs (asset_sale via the sale
  dialog in edit mode, debt repayment edit keeping debtId). Needs backend
  position/debt reverse+reapply verification first.
