import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { MoreHorizontal } from 'lucide-react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

export type ActionSheetItem = {
  key: string
  label: string
  onPress: () => void
  destructive?: boolean
}

/**
 * The row-level "…" menu, as a sheet.
 *
 * A dropdown anchored to a 9pt icon is a desktop idea: on a phone it opens
 * under a thumb that is covering it. The sheet puts every choice at a full
 * 44pt target instead, in reading order, with the destructive one last —
 * §22.11 keeps the irreversible action at the end of the flow, never first
 * under a finger already moving.
 */
export function ActionSheet({
  title,
  items,
  accessibilityLabel,
  className,
}: {
  title: string
  items: ActionSheetItem[]
  accessibilityLabel: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
        className={cn('items-center justify-center rounded-control active:bg-wash', className)}
      >
        <MoreHorizontal size={18} color={colors.ink3} strokeWidth={1.75} />
      </Pressable>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={title}>
        <View className="gap-0.5">
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => {
                setOpen(false)
                item.onPress()
              }}
              accessibilityRole="button"
              style={{ minHeight: TOUCH_TARGET }}
              className="justify-center rounded-control px-1 active:bg-wash"
            >
              <Text
                className={cn('t-body', item.destructive ? 'text-alert-ink' : 'text-ink')}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </>
  )
}
