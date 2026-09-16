# Back on mobile must pop, not navigate to the tab

Leaving a subscreen (`/goals/:id`, `/assets/:id`, `/activity`,
`/subscription`) by calling core's `navigate('/goals')` is wrong on native.

Core's `navigate` maps to Expo Router in
`mobile/src/shared/native-navigation.ts`. It used to call `router.push()`
unconditionally, so "back" pushed a **second** copy of the tab onto the stack:
the forward (push) animation played on the way back, the stack grew every
round trip, and the system back gesture then walked through the duplicates
instead of leaving.

## The rule

- **Back out of a subscreen** → `useGoBack(fallback)` from
  `mobile/src/shared/use-go-back.ts`. It pops when there is a stack and only
  `replace`s to `fallback` when there is not.
- **Never** wire a `BackLink` to `navigate(...)` or to a bare `router.back()`.
  Bare `back()` does nothing at all when the stack is empty.

## Why the fallback exists

A deep link — a scanned invite, a notification, a cold start — lands directly
on a detail screen with nothing behind it. `canGoBack()` is false there, and
the back link still has to go somewhere sensible. That is the whole reason the
old code used `navigate`; the fallback keeps that case working without paying
for it on every normal back.

## The adapter default changed too

`navigate` now calls `router.navigate()` rather than `router.push()`.
`navigate` reuses a matching screen already in the stack, which is what
tab → tab jumps want (`Tổng quan → Tài sản` via `onAddSource`). With `push`
those left duplicate tab entries behind as well.

`replace: true` is unaffected.
