# Protected reserves

Money the household decided to keep untouched (spec §19C). Related:
[[forecast-and-flexible-money]], [[what-if]].

## Overview

A reserve is a **constraint on the forecast, not an account**. Nothing is moved
anywhere. It is subtracted when computing flexible money, so "how much can we
spend without breaking what we promised ourselves" has an answer.

## Rules

- **Only `active` reserves are subtracted.** `archived` keeps the record and its
  history without distorting today's picture — which is why archiving exists
  instead of deleting.
- A reserve breach is **not an error state**. The forecast reports
  `reserveProtected: false` and the UI says so calmly; it is information, not a
  telling-off.
- Reserve changes invalidate the forecast, flexible-money and financial-state
  query families — the numbers they feed are derived from it.
- Copy calls this "khoản để riêng" / "money set aside". Never frame it as a
  restriction the app imposes; the household set it themselves.

## Where it lives in code

**frontend-web** (`src/features/reserves/`):
- `model/reserves.types.ts`, `api/reserves.repository.ts`
- `hooks/use-reserves.ts` — exposes `activeReserveTotal`, which filters to
  `active` so callers cannot accidentally include archived reserves.

The reserve **card** in the household settings screen lands in Phase 10.

**backend**: `src/modules/protected-reserves/`.
