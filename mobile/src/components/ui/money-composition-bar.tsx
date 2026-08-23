import { Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

import type { CompositionSegment } from '@money-space/core/shared/presentation.types'

/**
 * The money composition bar: committed → flexible.
 *
 * Not a pie chart. The same numbers as a pie lose the ordering, and the
 * ordering is the point — money that already has a job comes first, what is
 * left is what the household can decide about.
 *
 * The parts are told apart by WEIGHT, not hue: committed is the pale neutral,
 * flexible carries the interactive colour because it is the figure read first.
 * Amber stays reserved for `attention`, always.
 *
 * This is the one place v4.2 allows a value to appear twice — the legend
 * repeats the amounts so the bar is readable as more than a shape.
 */
export function MoneyCompositionBar({
  segments,
  formatValue,
  className,
}: {
  segments: CompositionSegment[]
  /** Money formatting belongs to the caller (§6). */
  formatValue: (value: number) => string
  className?: string
}) {
  const fill: Record<CompositionSegment['tone'], string> = {
    committed: colors.committed,
    flexible: colors.interactive,
  }

  const total = segments.reduce((sum, segment) => sum + Math.max(segment.amount, 0), 0)

  return (
    <View className={className}>
      <View
        className="h-2.5 flex-row overflow-hidden rounded-full"
        style={{ backgroundColor: colors.sunk }}
        accessibilityRole="image"
        accessibilityLabel={segments
          .map((s) => `${s.label}: ${formatValue(s.amount)} (${s.percentLabel ?? `${s.percent}%`})`)
          .join(', ')}
      >
        {segments.map((segment) => {
          // Share of what exists, not of the widest segment — a zero total is a
          // bar with nothing in it, which is the honest picture.
          const share = total > 0 ? Math.max(segment.amount, 0) / total : 0
          if (share <= 0) return null
          return (
            <View
              key={segment.key}
              style={{ flex: share, backgroundColor: fill[segment.tone] }}
            />
          )
        })}
      </View>

      <View className="mt-3 gap-2">
        {segments.map((segment) => (
          <View key={segment.key} className="flex-row items-center gap-2">
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: fill[segment.tone] }}
            />
            <Text className="flex-1 text-[13px] text-ink2">{segment.label}</Text>
            <Text
              className={cn(
                'text-[13px]',
                segment.tone === 'flexible' ? 'font-medium text-ink' : 'text-ink2',
              )}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatValue(segment.amount)}
            </Text>
            <Text
              className="w-11 text-right text-[11px] text-ink3"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {segment.percentLabel ?? `${segment.percent}%`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
