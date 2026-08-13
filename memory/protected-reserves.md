# Emergency fund (stored as protected reserves)

The level the household does not want its balance to drop below (spec §19C).
Related: [[forecast-and-flexible-money]], [[what-if]], [[goals]], [[assets]].

## Overview

The emergency fund is a **floor on the forecast** — not an account, and not a
fence. Nothing is moved anywhere and nothing is locked; the money stays
spendable. The number is what the projected balance is compared against:

```
flexibleMoneyHorizon = lowestProjectedBalance - emergencyFund
```

That is also why the product can say "your balance dips below the level you set
on the 15th" instead of just refusing. A fence would decide for the household;
a floor lets them see the consequence and choose. **Copy must use floor
language** ("xuống dưới mức", "vẫn trên mức"), never container language ("còn
nguyên", "chạm vào", "không đụng tới") — a pot that gets dented is the wrong
mental model and it is what made users read this as duplicating assets.

## Rules

- **Upcoming obligations must NOT be folded into it.** Tax due next month is a
  cashflow event: the forecast walks the balance down on its due date and it
  stops mattering once paid. Adding it to the floor subtracts it twice —
  `flexibleMoneyToday = liquid − emergencyFund − requiredOutflowsBeforeNextInflow`
  already has both terms — and a hand-typed number never expires.
- **It cannot be derived.** Nothing in the data says a household wants 120tr
  rather than 80tr; it is a decision, which is why it is stored and why the
  forecast has a `no_reserve_declared` state. (A "6 months of essentials"
  suggestion is fine as a *default value*, never as the stored truth — the app
  does not set the household's promise for them.)
- **ONE number per household.** The API still stores a list, but the client
  collapses it: `useReserves` exposes `emergencyFund` (sum of `active`) and
  `setEmergencyFund(amount)`. Multiple named pots are **goals** — a goal with no
  deadline is exactly a named fund with a balance, contributions and history, so
  building the same thing here would fork [[goals]].
- `setEmergencyFund` PATCHes the first active row (creating one if none exists)
  and **archives** any other active rows, so the number the user typed is the
  number in force. Archiving keeps the record; deleting would lose it.
- **Only `active` rows count.** `archived` keeps history without distorting
  today's picture.
- **A breach is not an error state.** The forecast reports
  `reserveProtected: false` and the UI says so calmly; it is information.
- Reserve changes invalidate the forecast, flexible-money and financial-state
  query families.

## The double-subtraction trap

`currentSharedLiquidMoney` counts **only `usable_now` assets**
(backend `forecast.ts`, `asset.liquidity === 'usable_now'`). So a fund already
parked in a `saving_deposit` is *already* out of the spendable pool — declaring
it here as well subtracts it a second time and understates flexible money.

The card surfaces this: when `emergencyFund > currentSharedLiquidMoney` it shows
`reserve.overLiquid`, telling the household to declare only the part sitting in a
spending account. There is no `backingAssetId` link yet; if this recurs, that is
the precise fix.

## Naming

The stored table is `protected_reserves`, but **"Protected Reserve" appears
nowhere in the UI**. Users see three words only: *Quỹ dự phòng* (the floor),
*Mục tiêu* (goals), *Tiền linh hoạt*. The asset liquidity bucket
`not_immediately_usable` is labelled **"Tiết kiệm" / "Savings"** — it used to be
called "Quỹ cần bảo vệ" / "Protected reserve", which collided head-on with this
entity and showed two different numbers under one name.

## Where it lives in code

**frontend-web** (`src/features/reserves/`):
- `model/reserves.types.ts` — the floor rules, `EMERGENCY_FUND_NAME`.
- `hooks/use-reserves.ts` — `emergencyFund`, `hasEmergencyFund`,
  `setEmergencyFund`.
- UI: `src/features/household/ui/components/household-reserve-card.tsx` (single
  money input), onboarding step 5 in
  `src/features/onboarding/ui/components/wizard-steps.tsx`.

**backend**: `src/modules/protected-reserves/`. The list API is unchanged; the
client narrowed its contract to a scalar first, so moving the value to a
`households` column later touches nothing above the hook.
