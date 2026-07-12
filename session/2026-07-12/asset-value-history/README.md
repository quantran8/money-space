# Asset value history — rename + event-linked persistence (frontend sync)

- **Date**: 2026-07-12
- **Session folder**: `session/2026-07-12/asset-value-history/`
- **Status**: done

## What the task is

Sync the frontend to a backend change to the asset value-history model:
1. DB table `asset_valuations` → **`asset_value_history`** (it is a time series of
   an asset's value, one row per value-changing action — not a single current
   valuation).
2. Each value-history row now carries **`money_event_id`**, linking it to the
   money event whose effect produced it.
3. **Every value-changing action records a money event + a linked history point.**
   A user re-pricing an asset directly (create/update asset) now logs a neutral
   **`asset_update`** money event (moves no wallet, excluded from income/expense),
   and the value point links to it.
4. The `value-history` endpoint now reads the persisted series straight (older
   assets fall back to reconstruction from events). **Endpoint response shape is
   unchanged** (`{ currentValue, items: [{ date, value }] }`).

## Changes made

- `src/shared/types/database.ts` — renamed the `asset_valuations` table row type
  to `asset_value_history`; added `money_event_id: string | null`. (`MoneyEventType`
  already listed `asset_update`; the `asset_valuation_mode`/`asset_valuation_method`
  enums are unchanged — they describe an asset's pricing mode, not the table.)
- `src/features/events/model/events.types.ts` — added `asset_update` to
  `MoneyEventItem['type']`.
- `src/features/events/api/events.repository.ts` — added `asset_update` to
  `EventPayload['type']`.
- `src/features/events/model/events.ts` — added `asset_update: 'Định giá lại'` to
  `eventTypeLabels` (a `Record<MoneyEventItem['type'], string>` — required by the
  union change).
- `src/features/events/model/events-form.ts` — `toMoneyEventSeed` maps an
  `asset_update` event to the form's neutral `adjustment` type (it is
  system-generated and not user-creatable, so it is NOT added to the form's
  `RecordType` / zod schema — that would offer it as a creatable option).
- `src/i18n/resources.ts` — added `eventType.asset_update` label (vi: "Định giá
  lại", en: "Revaluation") in both locales.
- `src/features/assets/hooks/use-assets.ts` — asset create/update/delete now also
  invalidates the events query (a re-price can log an `asset_update` event, so the
  events list must refresh; the value-history chart already refreshed via the
  `assets` key prefix). Added a comment noting the prefix relationship.
- `src/features/assets/hooks/use-asset-detail.ts` — updated the doc comment: the
  series is read from `asset_value_history` (linked points), not reconstructed.
- `memory/asset-valuation.md` — rewrote "Valuation persistence" + "Value history
  over time" sections for the new table name, event-linked points, `asset_update`
  revaluation flow, and the read-from-table (fallback-reconstruct) behavior;
  added the known market-price-drift limitation.

## Key decisions

- **No API/URL change.** The `GET .../value-history` endpoint contract (response
  shape) is unchanged, so the chart component and repository fetch are untouched.
- **`asset_update` is system-generated, not form-creatable.** It stays out of the
  form's `RecordType` union / zod schema; the seed mapper degrades it to
  `adjustment` if such an event is ever opened for editing.
- **Cache invalidation:** `queryKeys.assets(hh)` is a prefix of
  `assetValueHistory(hh, assetId)`, so asset mutations already refresh the chart;
  we additionally invalidate `events` because a re-price now creates an event.

## Mobile app parity notes

Port these to the mobile repo to match:
- Rename the value-history table type/reference to `asset_value_history` and add
  `money_event_id` to the row type.
- Add `asset_update` to the mobile money-event type union + any exhaustive label
  maps, with a "Định giá lại" / "Revaluation" label. Keep it out of the
  create-event form's selectable types (system-generated only).
- If mobile shows a value-over-time chart, it reads the same unchanged
  `value-history` endpoint shape — no data-shape change needed.
- After an asset re-price, invalidate/refresh both the asset value-history and the
  events list.
- Known limitation to mirror in docs: a `market_priced` asset only gets a history
  point on days it has a money event (no point for pure market-price drift).
