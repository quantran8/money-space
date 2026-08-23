import { ActivityIndicator, Pressable, Text } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET, colors } from '@/theme/tokens'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'

/**
 * A button.
 *
 * One rule from §22.10 is load-bearing and easy to undo by habit: **the primary
 * button is never disabled**. A disabled button hides the reason it is
 * disabled; the form validates on submit and says what is missing. `loading`
 * therefore blocks the press without dimming the control into a dead end.
 */
export function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  className,
}: {
  children: string
  onPress?: () => void
  variant?: Variant
  loading?: boolean
  className?: string
}) {
  const surface: Record<Variant, string> = {
    primary: 'bg-interactive',
    secondary: 'bg-sunk',
    ghost: 'bg-transparent',
    destructive: 'bg-transparent',
  }

  const label: Record<Variant, string> = {
    primary: 'text-white',
    secondary: 'text-ink',
    ghost: 'text-interactive',
    destructive: 'text-alert',
  }

  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
      // §9: 44pt minimum. Applies to every action, not just nav.
      style={{ minHeight: TOUCH_TARGET }}
      className={cn(
        'flex-row items-center justify-center rounded-control px-4',
        surface[variant],
        // Pressed state is opacity, not a second colour — colour is reserved
        // for things the user must act on.
        'active:opacity-80',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : colors.interactive}
        />
      ) : (
        <Text className={cn('text-[15px] font-medium', label[variant])}>{children}</Text>
      )}
    </Pressable>
  )
}
