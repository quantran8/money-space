import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { ColorValue } from 'react-native'

import { useActiveHousehold } from '@money-space/core/shared/hooks/use-active-household'

import { RequireAuth } from '@/features/auth/require-auth'
import { RequireHousehold } from '@/features/onboarding/require-household'
import { PaywallSheet } from '@/features/billing/ui/paywall-sheet'
import { RedeemSheet } from '@/features/billing/ui/redeem-sheet'
import { WhatIfSheet } from '@/features/whatif'
import { RouteErrorBoundary } from '@/components/route-error-boundary'
import { WhatIfFab } from '@/components/ui/whatif-fab'
import { colors } from '@/theme/tokens'

/**
 * Scoped to the tab segment, so one tab throwing is contained to that tab and
 * the household can still navigate out of it.
 */
export { RouteErrorBoundary as ErrorBoundary }

/**
 * The five primary destinations (design v4.2 §8 — the bottom bar is capped at
 * five). Same set, same order as the web's bottom nav: a household that uses
 * both should not have to relearn where things are.
 *
 * The fifth slot is **Sự kiện**, not Gia đình. The shared record of money that
 * has already moved is opened daily; the household's settings are a
 * once-a-month errand that was holding a daily slot. Gia đình did not lose a
 * destination — the account header's gear reaches it from every screen, which
 * is one tap from anywhere rather than one tap from the bar.
 *
 * `Lịch sử cập nhật` still lives inside Gia đình. A bar with eight targets is
 * a bar nobody can hit.
 */
export default function TabsLayout() {
  return (
    <RequireAuth>
      <RequireHousehold>
        <TabBar />
      </RequireHousehold>
    </RequireAuth>
  )
}

/**
 * Inside the gates, so the household query only runs once there is a session.
 *
 * Calling `useActiveHousehold` here is load-bearing beyond the tab bar: it is
 * what selects the active household AND what hands the household's currency to
 * `setDisplayCurrency`. Without it every amount in the app would render as VND
 * regardless of what the household chose. The web does the same from AppShell.
 */
function TabBar() {
  const { t } = useTranslation()
  const { activeHouseholdId } = useActiveHousehold()

  return (
    <>
      {/* Keyed on the space. Tab screens stay mounted on a phone, so an id held
          in a screen's state — an event being edited, a member picked for
          removal — would otherwise survive a switch made on the Gia đình tab
          and act on the wrong space the next time that tab was opened. */}
      <Tabs
        key={activeHouseholdId ?? 'none'}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.ink2,
          // `t-caption-sm` (11) in Urbanist, medium when active — React
          // Navigation defaults to the system face, which the bar never uses.
          tabBarLabelStyle: { fontSize: 11, fontFamily: 'Urbanist_300Light' },
          tabBarStyle: {
            backgroundColor: colors.panel,
            // The bottom bar is one of the two places v4.2 still allows a
            // divider: it floats over scrolling content and needs an edge.
            borderTopColor: colors.hair,
            borderTopWidth: 1,
          },
          // §9 accessibility: 44pt minimum touch target. `py-2.5` and the 4px
          // icon→label gap match the web bar's item box.
          tabBarItemStyle: { minHeight: 44, paddingVertical: 10 },
          tabBarIconStyle: { marginBottom: 4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.dashboard'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="grid" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="upcoming"
          options={{
            title: t('nav.upcoming'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="calendar" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: t('nav.goals'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="flag" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="networth"
          options={{
            title: t('nav.assetsDebts'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="wallet" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: t('nav.events'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="receipt" color={color} focused={focused} />,
          }}
        />

        {/* Still a route under the tabs — the header gear navigates here, and
            `/household` deep links must keep resolving — but NOT a bar item. */}
        <Tabs.Screen name="household" options={{ href: null }} />
      </Tabs>

      {/* The only entry point to what-if, on every tab — the counterpart of the
          web's mobile FAB. It floats above the bar rather than sitting in it:
          five tabs are the cap (§8) and what-if is an action, not a route. */}
      <WhatIfFab />

      {/* What-if, mounted ONCE — the mobile equivalent of the web's AppShell
          mount. It is a contextual action with no route of its own (a sixth
          tab is not available either, §8), so it sits here and is opened from
          anywhere through core's `whatif-store`. */}
      <WhatIfSheet />

      {/* Same reasoning, and the global 402 handler in core opens it from
          anywhere — so it has to be mounted where every tab is. */}
      <PaywallSheet />

      {/* A SIBLING of the paywall, never nested inside it: `openRedeem` closes
          that sheet as it opens this one. */}
      <RedeemSheet />
    </>
  )
}

/** Glyphs used in the bar; each has a matching `-outline` counterpart. */
type IoniconName = 'grid' | 'calendar' | 'flag' | 'wallet' | 'receipt'

/**
 * Outline when resting, solid when active.
 *
 * Ionicons ships each glyph as a real outline/solid pair, so only the weight
 * changes between states and the silhouette stays put.
 */
function TabIcon({ name, color, focused }: { name: IoniconName; color: ColorValue; focused: boolean }) {
  return <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />
}
