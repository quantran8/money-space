import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CalendarDays, LayoutGrid, Target, Timeline, Wallet } from 'lucide-react-native'

import { useActiveHousehold } from '@money-space/core/shared/hooks/use-active-household'

import { RequireAuth } from '@/features/auth/require-auth'
import { RequireHousehold } from '@/features/onboarding/require-household'
import { WhatIfSheet } from '@/features/whatif'
import { colors } from '@/theme/tokens'

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
  useActiveHousehold()

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.ink2,
          tabBarStyle: {
            backgroundColor: colors.panel,
            // The bottom bar is one of the two places v4.2 still allows a
            // divider: it floats over scrolling content and needs an edge.
            borderTopColor: colors.hair,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: { fontSize: 11 },
          // §9 accessibility: 44pt minimum touch target.
          tabBarItemStyle: { minHeight: 44, paddingVertical: 4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.dashboard'),
            tabBarIcon: ({ color }) => <LayoutGrid size={20} color={color} strokeWidth={1.75} />,
          }}
        />
        <Tabs.Screen
          name="upcoming"
          options={{
            title: t('nav.upcoming'),
            tabBarIcon: ({ color }) => <CalendarDays size={20} color={color} strokeWidth={1.75} />,
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: t('nav.goals'),
            tabBarIcon: ({ color }) => <Target size={20} color={color} strokeWidth={1.75} />,
          }}
        />
        <Tabs.Screen
          name="networth"
          options={{
            title: t('nav.assetsDebts'),
            tabBarIcon: ({ color }) => <Wallet size={20} color={color} strokeWidth={1.75} />,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: t('nav.events'),
            tabBarIcon: ({ color }) => <Timeline size={20} color={color} strokeWidth={1.75} />,
          }}
        />

        {/* Still a route under the tabs — the header gear navigates here, and
            `/household` deep links must keep resolving — but NOT a bar item. */}
        <Tabs.Screen name="household" options={{ href: null }} />
      </Tabs>

      {/* What-if, mounted ONCE — the mobile equivalent of the web's AppShell
          mount. It is a contextual action with no route of its own (a sixth
          tab is not available either, §8), so it sits here and is opened from
          anywhere through core's `whatif-store`. */}
      <WhatIfSheet />
    </>
  )
}
