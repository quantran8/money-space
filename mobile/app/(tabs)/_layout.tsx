import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CalendarDays, LayoutGrid, Target, Users, Wallet } from 'lucide-react-native'

import { RequireAuth } from '@/features/auth/require-auth'
import { RequireHousehold } from '@/features/onboarding/require-household'
import { colors } from '@/theme/tokens'

/**
 * The five primary destinations (design v4.2 §8 — the bottom bar is capped at
 * five). Same set, same order as the web's bottom nav: a household that uses
 * both should not have to relearn where things are.
 *
 * `Lịch sử cập nhật` and `Cài đặt` are deliberately absent — they live inside
 * Gia đình. A bar with eight targets is a bar nobody can hit.
 */
export default function TabsLayout() {
  const { t } = useTranslation()

  return (
    <RequireAuth>
      <RequireHousehold>
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
            name="household"
            options={{
              title: t('nav.household'),
              tabBarIcon: ({ color }) => <Users size={20} color={color} strokeWidth={1.75} />,
            }}
          />
        </Tabs>
      </RequireHousehold>
    </RequireAuth>
  )
}
