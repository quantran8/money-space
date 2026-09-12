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
  // The primary action is ink and fully round; secondary is a borderless sunk
  // fill at the control radius — a stroke is not how a control is marked.
  const surface: Record<Variant, string> = {
    primary: 'bg-action rounded-pill px-5',
    secondary: 'bg-wash rounded-control px-5',
    ghost: 'bg-transparent rounded-control px-2',
    destructive: 'bg-alert rounded-pill px-5',
  }

  const label: Record<Variant, string> = {
    primary: 'text-action-inverse',
    secondary: 'text-ink',
    ghost: 'text-action',
    // Ink on the alert fill: `alert` is a FILL tone, and `alert-ink` on it
    // would be two reds with no contrast between them.
    destructive: 'text-ink',
  }

  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
      // §9: 44pt minimum. Applies to every action, not just nav.
      style={{ minHeight: TOUCH_TARGET }}
      className={cn(
        'flex-row items-center justify-center',
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
          color={variant === 'primary' ? colors.actionInverse : colors.ink}
        />
      ) : (
        <Text className={cn('t-body-sm font-medium', label[variant])}>{children}</Text>
      )}
    </Pressable>
  )
}
