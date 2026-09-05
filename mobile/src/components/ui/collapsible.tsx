import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { Collapse } from '@/components/ui/motion'
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
        {/* The toggle is an ACTION, so it takes the interactive tone. It used
            to be 12px `--ink3` — the metadata weight, which §5 says is never a
            value and here was not even a label: it read as a caption that
            happened to be tappable. */}
        <View className="flex-row items-center gap-1.5 pt-0.5">
          <Text className="t-body-sm font-medium text-action">
            {open ? hideLabel : showLabel}
          </Text>
          <ChevronDown
            size={16}
            color={colors.interactive}
            strokeWidth={2}
            style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
          />
        </View>
      </Pressable>

      {/* Unrolls rather than blinking: the breakdown is the working behind a
          figure that stays put above it, so it should be seen to come from
          there. Nothing here holds form state, so it can stay mounted. */}
      <Collapse open={open}>
        <View className={cn('mt-5')}>{children}</View>
      </Collapse>
    </View>
  )
}
