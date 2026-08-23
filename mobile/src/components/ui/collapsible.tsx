import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET, colors } from '@/theme/tokens'

import type { ReactNode } from 'react'

/**
 * A section that folds its detail away.
 *
 * Used where a headline is the whole answer for most readers and the breakdown
 * exists for the one checking the arithmetic. On a phone that distinction is
 * not a nicety: an expanded breakdown pushes the figures it qualifies off the
 * screen entirely, which inverts the priority the section was built with.
 *
 * The summary is always visible and always says the answer — collapsing must
 * never hide the fact, only the working.
 */
export function Collapsible({
  summary,
  showLabel,
  hideLabel,
  children,
  defaultOpen = false,
  className,
}: {
  /** The answer. Rendered whether open or closed. */
  summary: ReactNode
  showLabel: string
  hideLabel: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <View className={className}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? hideLabel : showLabel}
        style={{ minHeight: TOUCH_TARGET }}
        className="flex-row items-start justify-between gap-3"
      >
        <View className="flex-1">{summary}</View>
        <View className="flex-row items-center gap-1.5 pt-1">
          <Text className="text-[12px] text-ink3">{open ? hideLabel : showLabel}</Text>
          <ChevronDown
            size={16}
            color={colors.ink3}
            strokeWidth={1.75}
            style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
          />
        </View>
      </Pressable>

      {open ? <View className={cn('mt-5')}>{children}</View> : null}
    </View>
  )
}
