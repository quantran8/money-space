# Assets & money-event forms → design.md §22

- **Date**: 2026-08-14
- **Session folder**: `session/2026-08-14/assets-events-form-section-22/`
- **Status**: done

## What the task is

Redesign the asset create/edit form and the money-event forms (actual + upcoming
+ quick-action picker) to comply with `design.md` §22 Form Patterns.

Both predated §22 and tripped well past its "three signals means the form is
broken" threshold (§22.0) — over 4 visible fields, a helper line per field, mono
uppercase labels in columns, and the heaviest signal of all: **nothing happened
until you pressed Save**.

Presentation only. No API, schema semantics, or calculation changes.

## Changes made

**New shared kit**

- `src/components/ui/form-22.tsx` — the §22 form vocabulary in one place:
  `Field` / `TextField` / `TextareaField` / `MoneyField` / `DecimalField` /
  `Segmented` / `Disclosure`, plus `fieldShell` / `fieldShellSm` / `fieldInput`
  / `fieldControlReset`. Encodes §22.3 (sunk fill, focus inverts to `--panel`
  with an accent border) and §22.4 (13px sentence-case labels, never `.label`).
  Assets + events are its first consumers; goals/debts/cashflow still re-declare
  these classes locally and can migrate later.
- `src/features/events/model/events-effect.ts` — `buildEventEffect`, the §22.7
  consequence sentence, computed client-side.
- `src/features/events/ui/components/event-effect.tsx` — renders it.

**Assets**

- `asset-form-dialog.tsx` — full rewrite. Dropped the 2-step wizard, the 15
  emoji type tiles (§18 bans emoji), the `MODE_HINTS` banner and the 820px
  width. Now 520px with **3 visible fields** (loại · tên · giá trị) and one
  disclosure. Adds the §22.7 consequence, the §22.8 change sentence on edit, and
  a `Gỡ nguồn tiền` text button in the button row (§22.11).
- `asset-form-dialog.tsx` — symbol is now a **free-text input for every**
  market-priced type. `stock` / `crypto` previously opened `SymbolCombobox`,
  which searches `/api/market-data/symbols`; that instrument reference data does
  not exist yet, so the picker implied a canonical list and then returned "không
  tìm thấy" for symbols the user actually holds. `Đơn vị` stays in the
  disclosure — it was auto-filled on symbol select, but the schema defaults it
  to `'unit'` (`assets-form.ts:134`), so nothing traps the user on a hidden
  required field.
- **Name is derived from the symbol for market-priced types** — the field is
  hidden for stock/crypto/fund/gold/FX, since the symbol already identifies the
  holding and asking for both means typing "FPT" twice (§22.1). Because `name`
  remains the display identity everywhere (list rows, detail title, sale
  dialog), it is **derived, not dropped**: `resolveAssetName` in
  `assets-form.ts` falls back to the uppercased symbol. A `Tên riêng` override
  lives in the disclosure for holding the same mã in two places. Three
  supporting changes were needed:
  - the zod schema made `name` conditionally required (`.superRefine`) instead
    of unconditionally required, or an empty field would be rejected;
  - `fromAsset` returns an **empty** custom-name field when the stored name
    equals the symbol, otherwise a derived name silently becomes an explicit
    one on the next save;
  - the §22.8 change sentence compares the *resolved* name, or editing a stock
    would report a rename that is not happening.
- `use-assets-page.ts` — `mode: 'onSubmit'`; returns `editingAsset`; the silent
  `if (!nextAsset) return` now raises a toast (reachable once the button is
  always enabled).
- `use-assets.ts` — `invalidate` now also invalidates `flexible-money` and
  `forecast`, or the consequence figure goes stale right after a save.
- `assets-page.tsx` — §22.11 remove confirm: right verb, consequence in money.

**Events**

- `quick-action-picker.tsx` — seven bordered icon cards → a plain `--sunk` list
  of labels (§18: no icons in rows; §22.0: no subtitle per row).
- `actual-record-form.tsx` — full rewrite. Hero `text-[54px]` amount → standard
  46px field; the 4-tile icon category grid → a select; the coloured-icon
  `DetailRow` list → plain fields; date moved into the disclosure.
- `upcoming-record-form.tsx` — same treatment.
- `event-form-dialog.tsx` — 520px, no subtitle, **back-to-picker** (previously
  the only way back was to close the dialog).
- `use-events-page.ts` — both forms to `mode: 'onSubmit'`; prefill effect now
  bails when the form is dirty; deduped two byte-identical option memos.

**Copy / docs**

- `src/i18n/resources.ts` — new `assets.form.*` and `events.form.*` keys in
  **both** `vi` and `en`. The event forms were ~100% hardcoded Vietnamese.
- `CLAUDE.md` — forms convention now records the §22 `onSubmit` mode, and the
  money-input line was corrected (see below).

## Key decisions

- **Consequence is computed client-side** from `useForecast()` + `useReserves()`,
  not via the `useWhatIf()` endpoint. A network call per keystroke would need
  debouncing and, worse, its invalidation would re-run the prefill effect and
  wipe the user's typing. It is an estimate of what the save will produce —
  the honest register for a "what happens if I do this" block.
- **Copy cut below the letter of §22.** Confirmed with the user: no money
  readout line, no "Bình sẽ thấy trong Nhật ký" (§22.12), no "Theo dữ liệu hiện
  có" scope line, no dialog subtitles, no §22.1 pre-fill source lines, no
  upcoming "chưa làm thay đổi số dư" banner. Net effect: **no helper line under
  any field**, which also clears the §22.0 helper-line signal. `Field` has no
  `help` prop at all so it cannot creep back.
- **The §22.5 readout was dropped deliberately.** That rule assumes input in
  *triệu* (`800` → `800.000.000 đ`), where the readout is the only way to catch
  a missing zero. This app takes full digits and groups them live, so the line
  repeated the box verbatim. If input ever switches to triệu, the readout must
  return with it.
- **Formula-mode assets stay in a modal** (~9 fields) rather than moving to a
  route as §22.9 suggests: the fields are one coherent group and a route change
  would ripple into all three call sites, including onboarding.
- **`CLAUDE.md`'s `"20M"` shorthand was documentation of something that never
  existed.** Verified: `sanitizeIntegerInput("20M")` → `"20"` and
  `parseRawMoney("20M")` → `NaN`. Corrected rather than implemented.

## Mobile app parity notes

- Port the §22 field vocabulary first (sunk fill, focus inverts surface, 13px
  sentence-case labels, 16px input to avoid iOS zoom) — everything else builds
  on it.
- Port the **field reduction** (3 visible + one disclosure) and the consequence
  sentence. These are the substance of §22; the styling is downstream.
- Port the always-enabled submit + validate-on-submit rule (§22.10).
- `buildEventEffect` in `events-effect.ts` is deliberately pure and
  framework-free — port it directly rather than reimplementing.
- Web-specific, do NOT port: `fieldControlReset` (exists only to strip shadcn
  Select/DatePicker chrome), `dvh` units, and the iOS-zoom rationale for 16px
  (native inputs don't have that failure mode).

## Known-good state

`npm run build` passes. `npm run lint` reports 6 errors, **all pre-existing** and
unrelated — 3 unused vars in `assets/api/assets.repository.ts` (untouched) and 3
`setState`-in-effect errors in `use-events-page.ts` / `use-goals-page.ts` that
are byte-identical to `HEAD`. Copy check passes. Dev server boots and all new
modules transform.

## Save latency fix (client side)

Creating one asset fired **7 requests taking 1.6–3.4s each**, and the dialog
stayed on "Đang lưu..." for the whole fan-out. Two independent causes:

1. **The refetches were awaited.** `invalidateQueries` resolves only once the
   refetches it triggers have COMPLETED. `invalidate` was `await Promise.all([…])`
   inside `onSuccess`, so `mutateAsync` stayed pending until all seven
   round-trips landed — the save itself had returned seconds earlier. Now
   `invalidate` is synchronous and each call is `void`-ed: the write completes
   when the POST returns, and refetches run as background bookkeeping.
2. **Half the requests were duplicates.** `queryKeys.assets` is
   `['households', id, 'assets']`, a **prefix** of both `assetSummary`
   (`…, 'assets', 'summary'`) and `assetSnapshots`. Invalidating the prefix
   already covers them, so listing them explicitly invalidated each a second
   time — exactly the doubled `summary` / `snapshots` rows in the network panel.

Net: 7 requests → 4, and perceived save time drops to the POST duration alone.
`use-events.ts` had the same awaited-invalidate bug (fixed); its keys were
already correctly prefix-based.

### Repo-wide sweep — every feature had it

The same awaited-invalidate bug was present in **every** mutation hook. All now
use a synchronous `invalidate()` with `void queryClient.invalidateQueries(...)`:

| File | Was |
| --- | --- |
| `goals/hooks/use-goals.ts` | two **sequential** awaits — dashboard didn't start until goals finished |
| `cashflow/hooks/use-cashflow-events.ts` | `await Promise.all` over 7 keys |
| `debts/hooks/use-debts.ts` | `await Promise.all` over 3 keys |
| `freshness/hooks/use-freshness.ts` | `await Promise.all` over 5 keys |
| `reserves/hooks/use-reserves.ts` | `await Promise.all` over 5 keys |
| `members/hooks/use-members.ts` | single await |
| `events/hooks/use-event-categories.ts` | single await |
| `goals/hooks/use-goals-page.ts` | inline await blocking the contribution toast |

Two extra correctness fixes found during the sweep:

- **`settings/hooks/use-settings-page.ts`** — the invalidation sat *inside* the
  `try` whose `catch` rolls the UI back. A failed **refetch** therefore reverted
  the currency and showed "Không thể lưu cài đặt." for a save that had actually
  succeeded. The save's outcome is now decided by `updateConfig` alone.
- **`debts/hooks/use-debts.ts`** — never invalidated `forecast` /
  `flexible-money`, though a debt write moves the repayment schedule those are
  computed from. Added.

**Two awaits kept on purpose** (documented in-code so they don't get "fixed"):
`use-onboarding-wizard.ts` and `use-onboarding-page.ts` both gate a
**navigation** — landing on Home before the household list refreshes shows an
empty picture on the user's first-ever view. There the await buys something real.

**Prefix duplication**: audited every key pair in `query-keys.ts` with a script.
The real overlaps are `assets`→`assetSummary`/`assetSnapshots`,
`goals`→`goalProjection`, `cashflowEvents`→`cashflowOccurrences`. Only
`use-assets.ts` was double-invalidating; verified no `invalidate()` anywhere now
lists both a key and its own prefix.

### Backend sweep

`assertHousehold` ran serially before an independent read in several list
handlers. Parallelized where the guard genuinely doesn't feed the query:
`goals.service.ts` (`listFinancialGoals`), `debts.service.ts` (`listDebts`),
`snapshots.service.ts` (`listSnapshots`), plus the assets/forecast ones above.
Left alone: writes, and sites where a later statement depends on the guard's
result — parallelizing those would change failure semantics for one round-trip.

## Save latency fix (server side — `money-space-backend`)

Profiled the API to check whether the 1.6–3.4s per-request timings were the
server's fault. **Verdict: no N+1, no missing indexes, no per-asset market-data
call.** `getAssetRecords` already parallelizes its three loads, the price layer
is batched + 5-min cached, and the schema indexes every hot column. The latency
is round-trips to a remote Supabase Postgres, amplified by the client fan-out.

Three safe wins applied:

- **`assets.service.ts`** — `listAssets`, `getAssetSummary` and
  `getAssetSnapshots` each ran `assertHousehold` **serially before** the real
  query, adding a full round-trip in front of every read. The guard does not
  feed the query, so they now run in `Promise.all`. The guarantee is unchanged:
  `Promise.all` rejects on the first failure.
- **`forecast.service.ts`** — same serial-guard fix in `loadInput`, which sits
  under forecast / flexible-money / financial-state.
- **`logging.interceptor.ts`** — it recursively sanitized and `JSON.stringify`d
  **every response body**. A snapshots payload is up to 365 snapshots × their
  asset lines: thousands of objects walked and serialized synchronously on the
  single-threaded event loop, blocking every other in-flight request. Response
  logging now reports shape (`items: 42, total: 42`) instead of content.
  Request logging is untouched.
- Removed a dead empty `for` loop in `assets.service.ts` (`refreshMarketValuations`).

Backend: `npm run build` passes, **248 tests across 20 suites pass**, eslint
clean on the changed files. Two pre-existing tsc errors in *test* files
(`money-events.goal-mirror.spec.ts`, `app.e2e-spec.ts`) were verified identical
on a stashed clean tree.

### Not applied — needs a decision

- **`HouseholdAccessGuard` already loads the household row**, then every service
  re-fetches it via `assertHousehold`. Passing the guard's row through request
  context would make `assertHousehold` free on every endpoint. Bigger blast
  radius, so left alone.
- **Verify `SUPABASE_JWKS_URL` is set in the deployed env.** If missing,
  `getUserFromToken` falls back to `supabase.auth.getUser()` — a network call
  the code itself documents as ~200–670ms **per authenticated request**. That
  alone could dominate what the user is seeing in production.
- **`listSnapshots` takes 365 snapshots with all child value rows.** Fine today,
  heavy for a year-old household with many assets.
- **No response caching anywhere** (no `CacheModule`/Redis). The forecast is
  recomputed from scratch on every call.

## Dormant code — do not delete

`symbol-combobox.tsx`, `use-symbol-search.ts` and `symbols.repository.ts` are
now **orphaned** (nothing imports them) because the symbol picker was replaced
with a text input. They are deliberately kept: they are a working client for
`/api/market-data/symbols`, and when the backend instrument DB lands, the change
is to re-import `SymbolCombobox` in `MarketFields` for `stock` / `crypto` —
not to rewrite it. If that DB is cancelled, delete all three.

## Not done (flagged, out of scope)

- Toast strings in `use-assets-page.ts` / `use-events-page.ts` are hardcoded
  unaccented ASCII ("Cap nhat tai san thanh cong.") bypassing i18n.
- `events-form.ts` zod messages are hardcoded Vietnamese instead of using the
  localized helpers in `shared/lib/validation.ts`.
- §22.9's "dirty + close → confirm" is not implemented; `isDirty` is now tracked
  in the events hook, so the foundation exists.
- goals / debts / cashflow forms still re-declare the §22.3 classes locally.
