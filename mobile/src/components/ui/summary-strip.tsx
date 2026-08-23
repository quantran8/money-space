import { Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * A row of two or three figures that answer one question together.
 *
 * Two per row on a phone. Three tiles across a 375pt screen leaves each about
 * 100pt, which truncates money — and §6 is explicit that money values never
 * truncate. A third tile wraps onto its own line instead.
 *
 * Every tile carries the same weight. A strip where one figure is styled up is
 * not a strip; that figure belongs above it as the section's anchor.
 */
export function SummaryStrip({
  items,
  className,
}: {
  items: { key: string; label: string; value: string; tone?: 'default' | 'attention' | 'alert' }[]
  className?: string
}) {
  return (
    <View className={cn('flex-row flex-wrap gap-2', className)}>
      {items.map((item) => {
        const tone = {
          default: 'text-ink',
          attention: 'text-attention',
          alert: 'text-alert',
        }[item.tone ?? 'default']

        return (
          <View
            key={item.key}
            // Half the row minus the gap; a third tile wraps below.
            className="min-w-[47%] flex-1 rounded-sunk bg-sunk p-3.5"
          >
            <Text className="text-[12px] text-ink2" numberOfLines={1}>
              {item.label}
            </Text>
            <Text
              className={cn('mt-1 text-[18px] font-medium', tone)}
              style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.54 }}
            >
              {item.value}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
