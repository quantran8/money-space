import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

import type { TextInputProps } from 'react-native'

/**
 * A form field, following design v4.2 §22.3.
 *
 * The recipe: sunk fill at rest, panel fill plus an interactive border on
 * focus, alert border when invalid. Height 46, radius 10, **font-size 16** —
 * the last one is not a style choice, it is what stops iOS zooming the page
 * when the field takes focus.
 *
 * The error sits below the field and only appears after submit: §22.10 wants
 * the form to say what is missing when the button is pressed, not to scold
 * mid-keystroke.
 */
export function Field({
  label,
  error,
  hint,
  className,
  ...props
}: TextInputProps & {
  label?: string
  error?: string
  /** Read-out line below the input — mandatory for VND amounts (§22.5). */
  hint?: string
  className?: string
}) {
  const [focused, setFocused] = useState(false)

  return (
    <View className={className}>
      {label ? <Text className="mb-1.5 text-[13px] text-ink2">{label}</Text> : null}

      <TextInput
        {...props}
        onFocus={(event) => {
          setFocused(true)
          props.onFocus?.(event)
        }}
        onBlur={(event) => {
          setFocused(false)
          props.onBlur?.(event)
        }}
        placeholderTextColor={colors.ink3}
        style={[{ fontSize: 16 }, props.style]}
        className={cn(
          'h-[46px] rounded-sunk border px-3.5 text-ink',
          error
            ? 'border-alert bg-panel'
            : focused
              ? 'border-interactive bg-panel'
              : 'border-transparent bg-sunk',
        )}
      />

      {hint && !error ? <Text className="mt-1.5 text-[12px] text-ink3">{hint}</Text> : null}
      {error ? <Text className="mt-1.5 text-[12px] text-alert">{error}</Text> : null}
    </View>
  )
}
