import { Pressable, Text } from 'react-native'
import { ChevronLeft } from 'lucide-react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET, colors } from '@/theme/tokens'

/**
 * The way back from a detail screen.
 *
 * A phone has a system back gesture, but it is invisible and it is not the
 * only way in — a deep link lands on a detail screen with no stack behind it.
 * So the destination is named in words rather than left to an arrow, and the
 * whole thing clears 44pt (§9).
 */
export function BackLink({
  label,
  onPress,
  className,
}: {
  label: string
  onPress: () => void
  className?: string
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: TOUCH_TARGET }}
      className={cn('-ml-2 flex-row items-center gap-1 self-start rounded-control px-2', className)}
    >
      <ChevronLeft size={18} color={colors.interactive} strokeWidth={1.75} />
      <Text className="text-[14px] font-medium text-interactive">{label}</Text>
    </Pressable>
  )
}
