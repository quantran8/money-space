import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

import type { ReactNode } from 'react'
import type { TextInputProps } from 'react-native'

/**
 * A form field.
 *
 * White with a 1px `committed` border at rest: inside a white card, a
 * wash-filled control read as a second surface level rather than as a field.
 * Focus is a blue border, not an ink outline — at radius 14 the ink outline
 * read as a disabled slab. Disabled is the only variant with a fill.
 *
 * **font-size 16** is not a style choice, it is what stops iOS zooming the
 * page when the field takes focus.
 *
 * The error sits below the field and only appears after submit: §22.10 wants
 * the form to say what is missing when the button is pressed, not to scold
 * mid-keystroke.
 */
export function Field({
  label,
  labelAction,
  error,
  hint,
  className,
  revealable,
  ...props
}: TextInputProps & {
  label?: string
  /** Rendered at the end of the label row — a "Quên mật khẩu?" link. */
  labelAction?: ReactNode
  error?: string
  /** Read-out line below the input — mandatory for VND amounts (§22.5). */
  hint?: string
  className?: string
  /** Adds a show/hide eye to a `secureTextEntry` field. */
  revealable?: boolean
}) {
  const { t } = useTranslation()
  const [focused, setFocused] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const secure = revealable ? props.secureTextEntry && !revealed : props.secureTextEntry

  return (
    <View className={className}>
      {label || labelAction ? (
        <View className="mb-2 flex-row items-center justify-between gap-3">
          {label ? <Text className="t-caption font-medium text-ink2">{label}</Text> : <View />}
          {labelAction}
        </View>
      ) : null}

      <View>
        <TextInput
          {...props}
          secureTextEntry={secure}
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
            'rounded-control border px-3.5 py-3 text-ink',
            revealable && 'pr-12',
            props.editable === false
              ? 'border-divider bg-field-disabled'
              : error
                ? 'border-alert-ink bg-card'
                : focused
                  ? 'border-data-primary bg-card'
                  : 'border-committed bg-card',
          )}
        />

        {revealable ? (
          <Pressable
            onPress={() => setRevealed((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? t('auth.password.hide') : t('auth.password.show')}
            hitSlop={8}
            className="absolute bottom-0 right-0 top-0 w-12 items-center justify-center"
          >
            {revealed ? (
              <Ionicons name="eye-off" size={18} color={colors.ink2} />
            ) : (
              <Ionicons name="eye" size={18} color={colors.ink2} />
            )}
          </Pressable>
        ) : null}
      </View>

      {hint && !error ? <Text className="mt-1.5 t-caption text-ink3">{hint}</Text> : null}
      {error ? <Text className="mt-1.5 t-caption text-alert-ink">{error}</Text> : null}
    </View>
  )
}
