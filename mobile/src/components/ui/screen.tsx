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
 */
export function Screen({
  title,
  right,
  children,
  onRefresh,
  refreshing = false,
  className,
}: {
  title?: string
  /** One thing beside the title — metadata or an action, never both. */
  right?: ReactNode
  children: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
  className?: string
}) {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      className={cn('flex-1 bg-app', className)}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        // Clear the floating tab bar plus a little breathing room.
        paddingBottom: insets.bottom + 72,
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
