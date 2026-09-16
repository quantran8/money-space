# Expo UI native controls (mobile)

- **Date**: 2026-09-12
- **Session folder**: `session/2026-09-12/mobile-expo-ui-native-controls/`
- **Status**: done

## What the task is

"Mobile: dùng expo ui là base component." Taken literally this is not
reachable — Expo UI renders SwiftUI/Compose views that NativeWind cannot style,
so the v5 tokens, the `.t-*` steps and Urbanist stop applying to anything it
replaces, and only ~6 of 30 kit primitives have a native counterpart at all.

Scope was narrowed with the user to native menus/pickers, iOS only.

## Changes made

- `mobile/package.json` — added `@expo/ui` pinned **exact** (`57.0.13`, no
  caret). Not the latest, deliberately: see below.
- `mobile/src/components/ui/action-sheet.tsx` — split into `IosMenu` /
  `AndroidMenu` on `Platform.OS`, the same shape `bottom-sheet.tsx` already
  uses. iOS renders SwiftUI `Menu`; Android keeps the 158-line popover.
- `mobile/src/components/ui/segmented.tsx` — split into `IosSegmented` /
  `AndroidSegmented`. iOS renders `Picker` + `pickerStyle('segmented')`.

No call sites changed: the barrel (`components/ui/index.ts`) is the seam and
both components keep their exact prop shapes.

## Key decisions

- **`Menu`, not `ContextMenu`.** `ContextMenu` in 57.0.18 is long-press only
  (it wraps SwiftUI `.contextMenu`, no `primaryAction` variant). The "…" opens
  on a single tap and the app has zero `onLongPress` anywhere, so `ContextMenu`
  would have been a silent UX regression. `Menu.label` takes a ReactNode, so
  the v5 `MoreHorizontal` glyph survives via `RNHostView`.
- **iOS only.** Android has no `Menu` and no `Picker` in `@expo/ui`; its
  `DropdownMenu` is Material-styled and *controlled* where iOS `Menu` is
  uncontrolled. Splitting avoids reconciling two native APIs.
- **`Host` needs an explicit size** and takes no `className` — NativeWind never
  reaches SwiftUI content. `seedColor` is the one theming hook that does.
- **Left custom on purpose**: `Select` (21 sites; groups, `leading` node,
  search), `Switch` (whole row is the 44pt target; swift-ui calls it `Toggle`),
  `DateField` (already native, and its local-date parsing guards a real
  date-shift bug), `MonthField` (`DatePicker.displayedComponents` is only
  `date | hourAndMinute` — no month-only mode exists on either platform).
- **Accepted regression on Segmented**: `UISegmentedControl` ellipsizes where
  the custom one shrank to fit. The `Tất cả · Dùng ngay · Tiết kiệm · Dài hạn`
  filter row is the one to watch on narrow phones. Raised with the user, who
  chose native anyway.

- **`@expo/ui` must stay at 57.0.13.** `57.0.14+` call
  `shadowNodeProxy.setContentOrigin` / `clearContentOrigin` in their own
  `ios/RNHostView.swift`; those members do not exist on
  `ExpoSwiftUI.ShadowNodeProxy` in `expo-modules-core@57.0.12`, which is what
  `expo@57.0.15` pins. First attempt used 57.0.18 and `xcodebuild` failed with
  exit 65 — after `tsc`, `expo lint` and `expo export` had all passed, because
  the break is native-only. Raising the pin means raising `expo` first.

Rationale in `memory/mobile-expo-ui-menu.md`.

## Verification

- `npx tsc --noEmit` — clean. (One pre-existing error in
  `auto-price-row.tsx` from unrelated in-flight `packages/core` auth work;
  confirmed present with these changes stashed.)
- `npx expo lint` — 0 errors.
- `npx expo export --platform ios` — bundles.
- `pod install` + `npx expo run:ios` — **Build Succeeded, 0 errors**; app
  installs and launches on the iPhone 15 Plus simulator.

## Still to do

The build is green but the controls have **not been exercised by hand**. On the
simulator, check:
- a row menu near the **bottom** of a list (the old `flips` case)
- a row menu inside a **`BottomSheet`** (`goal-allocations-section.tsx:303`) —
  native menu inside an RN `Modal` is the main integration risk
- a destructive item renders red via the native role
- the 4-option liquidity filter for truncation
- Android is unchanged on both components

## Mobile app parity notes

Nothing to port to web — this is mobile-only platform chrome. The web keeps its
own `ActionSheet` and `Segmented`.

The one thing the web repo should know: **mobile now requires a development
build**, so any contributor switching between the two repos cannot run mobile
in Expo Go any more. There is no `eas.json` and no mobile CI yet, so this
introduces that step rather than modifying one. Minimum iOS is 16.4.
