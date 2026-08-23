import { RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors, spacing } from '@/theme/tokens'

import type { ReactNode } from 'react'

/**
 * The standard screen frame: safe-area padding, page title, pull-to-refresh.
 *
 * Pull-to-refresh is not decoration here. The backend has no push channel, so
 * a deliberate pull is the household's way of saying "check again" — and after
 * recording something on another device it is the only way.
 *
 * The tab bar floats over the content, so the bottom padding clears it. Money
 * values must never be hidden behind it.
 *
 * That clearance is `TAB_BAR + inset`, counted ONCE. The bar's own height
 * already includes the home indicator, and adding the inset a second time left
 * a band of dead space under every screen — visible as a gap below the last
 * card on some tabs while others looked cramped, because how much content each
 * had decided whether the gap showed.
 */

/** The bar's own height, above the home indicator. */
const TAB_BAR = 49
/** Breathing room between the last card and the bar. */
const TAB_BAR_CLEARANCE = 16

export function Screen({
  title,
  right,
  children,
  onRefresh,
  refreshing = false,
  withoutTabBar = false,
  className,
}: {
  title?: string
  /** One thing beside the title — metadata or an action, never both. */
  right?: ReactNode
  children: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
  /**
   * Set on screens pushed OVER the tabs (a detail route, the journal) — they
   * have no bar to clear, and padding for one leaves them ending short.
   */
  withoutTabBar?: boolean
  className?: string
}) {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      className={cn('flex-1 bg-app', className)}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.tight + 4,
        paddingBottom:
          insets.bottom + (withoutTabBar ? spacing.section : TAB_BAR + TAB_BAR_CLEARANCE),
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ink3}
            colors={[colors.interactive]}
          />
        ) : undefined
      }
    >
      <View style={{ paddingHorizontal: spacing.panel }}>
        {title ? (
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-[19px] font-medium text-ink">{title}</Text>
            {right}
          </View>
        ) : null}
        {children}
      </View>
    </ScrollView>
  )
}

/**
 * Vertical rhythm between sections: 16px (§7).
 *
 * Sections are separated by space, never by a divider — spacing is the first
 * tool, and a border means spacing and alignment already failed.
 */
export function Sections({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('gap-4', className)}>{children}</View>
}
