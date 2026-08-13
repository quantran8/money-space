# Emergency fund: floor semantics, one number, vocabulary cleanup

- **Date**: 2026-08-13
- **Session folder**: `session/2026-08-13/emergency-fund-floor-semantics/`
- **Status**: done

## What the task is

The user asked whether Protected Reserve overlaps with assets. It does not — but
the investigation surfaced three real problems:

1. **A name collision.** The asset liquidity bucket `not_immediately_usable` was
   labelled "Quỹ cần bảo vệ" / "Protected reserve" — the same words as the
   `protected_reserves` entity, showing two unrelated numbers under one name.
2. **A double-subtraction hazard.** `currentSharedLiquidMoney` counts only
   `usable_now` assets, so a fund parked in a `saving_deposit` is already outside
   the spendable pool. Declaring it as a reserve as well subtracts it twice.
3. **Wrong mental model in the copy.** Reserve copy used container language
   ("còn nguyên", "chạm vào", "không đụng tới"). It is a **floor**, not a pot:
   the money stays spendable, the forecast just compares against the level.

Also settled: multiple named reserves duplicate **Goals** (a goal with no
deadline is exactly a named fund with a balance and contribution history), so the
reserve collapses to one number per household.

## Changes made

- `src/features/reserves/model/reserves.types.ts` — rewrote the docblock as floor
  semantics; documented why upcoming obligations must not be folded in and why
  the value cannot be derived. Added `EMERGENCY_FUND_NAME` (stored `name` is a
  constant now, not a translated string — stored data should not change meaning
  with locale).
- `src/features/reserves/hooks/use-reserves.ts` — narrowed the contract to a
  scalar: `emergencyFund` (sum of `active`), `hasEmergencyFund`,
  `setEmergencyFund(amount)`. The mutation PATCHes the first active row (creates
  one if none) and **archives** any other active rows so the typed number is the
  number in force. Dropped `createReserve`/`updateReserve`/`deleteReserve` from
  the returned object; the repository functions are unchanged.
- `src/features/household/ui/components/household-reserve-card.tsx` — list + name
  field + add/delete replaced by **one money input and a Save button**. Added the
  `reserve.overLiquid` note, shown when `emergencyFund >
  flexibleMoney.currentSharedLiquidMoney` (the double-subtraction signal). Input
  value derives from the stored floor via a nullable `draft` rather than a
  seeding effect (`react-hooks/set-state-in-effect`).
- `src/features/onboarding/ui/components/wizard-steps.tsx` — `ReserveStep` writes
  through `setEmergencyFund`; dropped the localized `defaultName`.
- `src/i18n/resources.ts` (`vi` + `en`) —
  - reserve block rewritten: `saveFailed`, `form.amount`, `form.save`,
    `title`, `description`, `empty`, `overLiquid`. Removed `addFailed`,
    `form.name`, `form.namePlaceholder`, `form.add`, `status.*`.
  - every reserve string moved to floor language and to the words **Quỹ dự
    phòng / Emergency fund**: what-if `intact`/`breached`, `reserveImpact`,
    assumptions `reserve_applied`/`no_reserve_declared`, financial-state reasons
    `no_reserve_declared`/`reserve_significantly_breached`/`forecast_near_reserve`,
    `household.merged.reserveCadence`/`safetyFund`/`safetyFundDescription`,
    money-composition `protect`/`flexibleLabel`/`aria`, upcoming
    `lowestNote`/`lowestNoteBreach`, flexible `note`, onboarding step 5.
  - asset liquidity bucket labels stripped of "dự phòng"/"reserve" → **"Tiết
    kiệm" / "Savings"**: `home.location.role.*`, `assets.strip.reserve`,
    `assets.summary.reserve`, `options.liquidity.*`, dashboard snapshot
    `reserve`/`reserveEmpty`.
- `memory/protected-reserves.md` — rewritten around the floor model.
- `memory/assets.md` — liquidity bucket renamed; added the rule not to label it
  "dự phòng"/"reserve" and a pointer to the double-subtraction note.
- `family-finance-v3.1/03-product-architecture.md` — "Quỹ dự phòng" removed from
  the Money Source examples (with a note saying why); §5 Protected Reserve
  rewritten as a floor, one per household, with the two consequences.

Verified: `npm run build` passes. `node scripts/check-copy.mjs` passes. `eslint`
leaves 6 errors, all pre-existing and in untouched files
(`assets/api/assets.repository.ts`, `events/hooks/use-events-page.ts`,
`goals/hooks/use-goals-page.ts`).

## Key decisions

- **Floor, not fence.** The emergency fund is the level the projected balance is
  compared against, not money that is locked away. This is what lets the product
  show a consequence instead of issuing a verdict, and all copy must reflect it.
- **Upcoming obligations never join the floor.** They are cashflow events; the
  forecast already subtracts them as a separate term and they expire on payment.
  A "protected zone = fund + upcoming bills" aggregate would double-count and
  never expire — the derived `committed` slice already expresses it correctly.
- **The floor is declared, never derived.** No data implies the household's
  chosen level. A "6 months of essentials" figure is acceptable as a suggested
  default only.
- **One number per household; named pots are Goals.** Not built as a new entity —
  Goals already has derived `currentAmount` from `goal_contribution` events,
  wallet debiting, and an optional `targetDate`.
- **Table kept, contract narrowed.** `protected_reserves` no longer earns a table
  (one scalar, no name shown, archive only used internally), but ripping it out
  is a migration across three repos for one column. The client now speaks
  scalar, so moving the value to `households.emergency_fund_amount` later
  touches nothing above `use-reserves.ts`. That migration is **not** done.

## Mobile app parity notes

- Port the whole vocabulary change: **Quỹ dự phòng** for the fund, **Tiết kiệm**
  for the `not_immediately_usable` asset bucket. Never reuse "dự phòng" for the
  bucket.
- Port floor-language copy; do not translate the old container phrasing.
- Port the scalar hook contract (`emergencyFund` / `setEmergencyFund`) and the
  single-input card rather than the old list UI, including the archive-the-extras
  behaviour so both clients agree on the number in force.
- Port the `overLiquid` warning — the double-subtraction hazard is backend
  behaviour, so it exists on mobile too.
- Web-specific, do NOT port: nothing.

## Known follow-ups (not done)

- `reserve.overLiquid` is a heuristic. The precise fix is an optional
  `backingAssetId` on the reserve so the app can skip the subtraction when the
  fund is already outside the liquid pool — a schema change across three repos.
- `dashboard.redesign.reserve.*` keys (title/months/good/low) have no consumer in
  the web client; left untouched.
