# Data freshness

How much the household can trust the numbers it is being shown (04 §12).
Related: [[assets]], [[forecast-and-flexible-money]].

## Overview

Each active asset is classified by how long ago its value was established,
against the household's `updateFrequency`: `fresh | aging | stale | unknown`.

**`unknown` is not `stale`.** A value that was never established and a value
that is old are different claims, and the UI must not merge them.

## Rules

- **The OLDEST value bounds the whole picture.** One stale bank balance
  undermines the forecast however fresh everything else is, which is why the API
  returns `oldestDaysSinceUpdate` and a single `needsAttention` flag rather than
  making each client re-derive the rule.
- **Stale data is a fact, never a failing of the user.** Copy stays calm and
  must never imply neglect or nag.
- **"Nothing changed" writes no value and creates no history point.** Confirming
  freshness bumps the timestamp only — inventing a valuation entry would put a
  fictional data point on the asset's chart.
- Confirming freshness invalidates the forecast family: the numbers do not move,
  but the staleness *assumption* attached to them does.

## Where it lives in code

**frontend-web** (`src/features/freshness/`):
- `model/freshness.types.ts`, `api/freshness.repository.ts`,
  `hooks/use-freshness.ts`
- `ui/components/freshness-section.tsx` — Home's section 7.
- `ui/components/calm-note-card.tsx` — the reusable calm-list card.

**backend**: `AssetsService.getDataFreshness` / `confirmAssetsUnchanged`,
`src/common/utils/freshness.ts`.
