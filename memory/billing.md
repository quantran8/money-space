# Billing

How a household gets Premium, and what it is allowed to cost them. Related:
[[households-and-onboarding]], [[goals]], [[what-if]].

## The one invariant

**The server decides entitlement. Nothing else ever does.**

Every route in — a redeem code, a PayOS payment, an in-app purchase, the signup
trial — ends at `SubscriptionService.grantOrExtend`, which is the only writer of
`household_subscriptions`. A client that believes it is Premium is making a
guess that the next API call will correct.

That is not defensive coding, it is what makes the product's own pricing work:
the plan is sold **per household, not per seat**, and only the server can hand
Premium to the partner's session on the partner's phone.

## Stacking rules

`extendPeriod` is pure and decides all three:

1. **Never lose a day.** The base is `max(currentPeriodEnd, now)` — a code
   redeemed with two months left adds to those two months. A lapsed plan starts
   from today; nobody is credited for the past.
2. **Never shorten.** A grant landing earlier than the current expiry is a
   `noop`, and the caller declines to spend the code rather than taking days
   away.
3. **Lifetime absorbs everything.** Later grants are no-ops, never a downgrade.

## Paying: two routes, one grant

| | Web | Mobile |
|---|---|---|
| Route | PayOS hosted checkout | App Store / Play, via RevenueCat |
| Trigger | We create an order, then redirect | The store's own purchase sheet |
| Settles by | PayOS webhook, HMAC-signed | RevenueCat webhook, shared secret |

**Mobile may not link out to PayOS.** Apple and Google both reject apps that
steer to an external payment flow for digital goods, so the mobile client sells
through the store or not at all. Showing prices is fine; a button to a payment
page is not.

### Why the store's price is displayed, not ours

`PLAN_CATALOG`'s đồng amounts do not decide what an IAP costs — the store does,
in the buyer's own region, currency and tax rules. So the mobile paywall shows
`product.priceString` verbatim and falls back to our figure only when there is
no store product. Any price we compute ourselves eventually disagrees with what
is actually charged, which is both a rejection risk and a lie.

### Mapping a purchase to a household

Apple charges a card a year later with no app running, and the webhook carries
only `app_user_id`. `revenuecat_subscribers` is the stored mapping that makes
that money attributable; the client registers it **before** opening the store
sheet, so a purchase interrupted mid-flow still resolves.

The household on that row is set on INSERT and never updated. Someone who
leaves and joins another household must not have their running subscription
silently start paying for the new one.

### Idempotency

Three independent barriers, because two webhook deliveries genuinely do race:

- unique `provider_txn_id` — a replay violates it and is swallowed
- `WHERE status = 'pending'` on the settle UPDATE (PayOS), re-evaluated by
  Postgres after the first transaction commits
- `FOR UPDATE` on the subscription row inside `grantOrExtend`, so two grants
  cannot extend from the same starting point

The key is `transaction_id`, never `original_transaction_id`: the latter is
shared by every renewal of a subscription, so keying on it would make year two
look like a replay of year one and grant nothing.

### What an IAP never does

**It only ever adds time.** Nothing in the RevenueCat path can shorten a period:

- `CANCELLATION` means auto-renew was switched off, not that access ends — the
  household keeps the days it bought, and `BillingExpiryCron` ends the period
  when it actually runs out.
- `EXPIRATION` needs no action for the same reason. Acting on it would mean two
  independent things could end a plan, and they would disagree the first time a
  household also held a redeem code.
- `REFUND` / `CHARGEBACK` are logged and left alone. Revoking automatically
  would have to decide *which* days to remove from a period that may have been
  stacked with a code, and getting that wrong takes away time somebody owns. A
  person decides, with the order row in front of them.

### Purchased, but not yet granted

The webhook is server-to-server and takes a moment. The client polls
`GET /entitlement` after a purchase and, if the grant has not landed, says **the
money arrived and Premium is coming** — never "failed". Telling someone a
successful payment failed sends them to support over nothing.

Backing out of the store sheet is not an error either, and must not raise a
toast.

## Sandbox

A sandbox receipt is free money. `REVENUECAT_ALLOW_SANDBOX` is on in
development so TestFlight can be tested end to end, and off in production.

## Free tier

Ceilings live in `PLAN_LIMITS` and are sent to the client inside every
entitlement response, so **no screen hardcodes a number** — changing what Free
includes is a backend edit with no app-store release on either client.

Never gated: inviting a partner, sharing levels, the activity log, the what-if
asset-sale funding step, and recording gold/stocks/crypto on the balance sheet.
The first three are the core loop; the last is what a Vietnamese household opens
the app for. What Premium sells is *automation and decisions*, not the right to
keep records.
