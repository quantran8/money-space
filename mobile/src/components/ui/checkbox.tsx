import { Pressable, Text, View } from 'react-native'
import { Check } from 'lucide-react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET } from '@/theme/tokens'

/**
 * A checkbox with its label.
 *
 * The whole row is the target, not just the 20pt box — §9 asks for 44pt, and a
 * label you can read but not tap is a target that only looks big enough.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  error,
  className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  error?: string
  className?: string
}) {
  return (
    <View className={className}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        style={{ minHeight: TOUCH_TARGET }}
        className="flex-row items-center gap-3"
      >
        <View
          className={cn(
            'h-5 w-5 items-center justify-center rounded-[6px] border',
            checked ? 'border-action bg-action' : 'border-divider bg-card',
          )}
        >
          {checked ? <Check size={14} color="#FFFFFF" strokeWidth={2.5} /> : null}
        </View>
        <Text className="flex-1 t-body-sm leading-5 text-ink2">{label}</Text>
      </Pressable>

      {error ? <Text className="mt-1 t-caption text-alert-ink">{error}</Text> : null}
    </View>
  )
}
