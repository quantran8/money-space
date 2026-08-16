# Asset switch — "tính vào tiền linh hoạt"

- **Date**: 2026-08-16
- **Session folder**: `session/2026-08-16/asset-counts-as-flexible/`
- **Status**: done (migration not yet applied to any database)

## What the task is

When creating an asset, let the user decide whether that money counts towards
flexible money — both directions, every asset type.

## Why it could not be frontend-only

Liquidity was not a client input: `AssetPayload` omitted it, the service
recomputed `liquidityForAssetType(type)` on every write, and a same-day
migration (`20260816095000_derive_asset_liquidity`) added a DB CHECK making any
other type↔bucket pair unstorable. A switch in the form alone would have been
silently discarded. Backend chosen (by the user) as the place to fix it.

## Changes made — backend (`money-space-backend`)

- `prisma/schema.prisma` + `prisma/migrations/20260816120000_asset_counts_as_flexible/`
  — new nullable `assets.counts_as_flexible`; the CHECK constraint now encodes
  `liquidity = f(type, counts_as_flexible)` instead of `f(type)`. Existing rows
  are untouched (`NULL` = follow the type).
- `src/common/utils/money-space.utils.ts` — `liquidityForAsset(type, flag)`,
  `flexibleByDefaultForAssetType`, `normalizeCountsAsFlexible`.
- `assets.service.ts` create/update, `create-asset.dto.ts`, `asset.entity.ts`,
  `prisma-assets.repository.ts` (insert + update), `money-space.mapper.ts`.
- Tests: 5 service cases + 7 util cases. Full suite 288 passed.
- `memory/assets.md`, `memory/forecast-and-flexible-money.md`, and a clarifying
  paragraph in `CLAUDE.md` (see Key decisions).

## Changes made — frontend (`money-space`)

- `model/assets.types.ts` — `Asset.countsAsFlexible?: boolean | null`.
- `model/assets.ts` — `liquidityForAsset` / `flexibleByDefaultForAssetType`,
  mirroring the backend helper so the optimistic local asset matches.
- `model/assets-form.ts` — `AssetForm.countsAsFlexible` (default `true`, since
  the default type is `cash`); `toAsset` derives `liquidity` from it; `fromAsset`
  reads it back from `asset.liquidity === 'usable_now'`.
- `hooks/use-assets-page.ts` — sends `countsAsFlexible` in the payload.
- `ui/components/asset-form-dialog.tsx` — the switch (extracted `ToggleRow`,
  shared with the loan interest toggle), placed in the main section above the
  consequence sentence; `AssetEffect` now picks its sentence from the switch
  instead of the type, and reports the flip as a §22.8 change line.
- `i18n/resources.ts` (vi + en) — `countsAsFlexible`, `changeFlexibleOn/Off`.
- `memory/assets.md`.

## Key decisions

- **The override changes the stored `liquidity` bucket; it is not a parallel
  rule.** The backend's CLAUDE.md bans "a per-record exclusion rule" precisely
  because one once left the dashboard and the forecast disagreeing. Materializing
  into the column every consumer already reads (forecast starting balance,
  dashboard, bucket totals, snapshot lines) makes disagreement structurally
  impossible, and `shared-figures.spec.ts` still passes unchanged. CLAUDE.md now
  says so explicitly, so this doesn't read as the banned shape.
- **`NULL` means "no decision".** A flag that merely restates the type's default
  is normalized away, so an asset nobody decided about keeps following its type
  — including after a type change.
- **Excluded cash lands in `not_immediately_usable`, never `long_term`** — the
  household still has the money, it just isn't counting on it.
- **The switch resets to the new type's default when the type changes.** A
  decision made about cash says nothing about gold.

## Follow-up needed

- The migration has **not** been applied to any database. Run
  `npx prisma migrate deploy` (or `migrate dev`) against the target DB before
  deploying — the API will 500 on asset writes until the column exists.
- Two git stashes were left in the backend repo by a tooling mishap during this
  task: `stash@{0}` = eslint `--fix` artifacts (safe to drop), `stash@{1}` = a
  snapshot of the working tree that has already been restored (also safe to
  drop). Nothing is missing from the working tree.

## Mobile app parity notes

- Port the switch and the same default/reset behaviour; the domain rules are in
  `memory/assets.md` in all three repos.
- Read the switch state from `asset.liquidity === 'usable_now'`, and send
  `countsAsFlexible` — mobile must not post a bucket.
