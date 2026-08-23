import { useEffect, useState } from 'react'
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET } from '@/theme/tokens'

import type { ReactNode } from 'react'

/** v4.2 §8: 120–550ms on this curve. */
const DURATION = 260
const EASING = Easing.bezier(0.2, 0.7, 0.3, 1)

/**
 * A bottom sheet — what a modal becomes on a phone (v4.2 §22.9).
 *
 * Built on RN's `Modal` rather than a gesture library: what the app needs is a
 * sheet that opens, holds a form, and closes. Drag-to-dismiss over a form with
 * unsaved input is a way to lose work by accident, so it is deliberately absent.
 *
 * **The two layers animate separately, and that is the whole point.** `Modal`'s
 * own `animationType="slide"` moves everything inside it as one block, so the
 * scrim slid up from the bottom edge with the sheet — the page appeared to be
 * dimmed by a rising sheet of grey rather than by a layer sitting over it. The
 * scrim now fades in place while only the panel travels, which is what every
 * platform sheet does and what makes the sheet read as being *in front of* the
 * page instead of pasted to it.
 *
 * The sheet is the one surface that genuinely floats, so it is also the one
 * place a shadow would be allowed — but on the scrim it reads as grime, so it
 * separates by radius and lightness like everything else.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Pinned below the scroll area, so the primary action stays reachable. */
  footer?: ReactNode
  className?: string
}) {
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()

  /**
   * The Modal has to outlive `open` or the closing animation would be cut off
   * by the unmount — callers flip `open` and drop the sheet in the same render.
   *
   * Only the CLOSE is deferred. `open` mounts during render, so the state is
   * "is the exit still playing", not a mirror of the prop.
   */
  const [closing, setClosing] = useState(false)
  // Lazy state, not a ref: the value is created once, and reading `.current`
  // during render is what the rules of hooks forbid.
  const [progress] = useState(() => new Animated.Value(0))

  // Derive the exit from the prop CHANGING, during render — React's documented
  // way to adjust state on a prop change, and it keeps the effect free of
  // `setState`, which the rules of hooks flag.
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    setClosing(!open)
  }

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: DURATION,
      easing: EASING,
      useNativeDriver: true,
    })
    animation.start(({ finished }) => {
      if (finished && !open) setClosing(false)
    })

    return () => animation.stop()
  }, [open, progress])

  if (!open && !closing) return null

  return (
    <Modal
      visible
      transparent
      // No `animationType`: the two layers below animate independently, and
      // Modal's own transition would slide them together as one block.
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        {/* The scrim FADES, in place. Tapping it closes — the standard way out. */}
        <Animated.View className="absolute inset-0" style={{ opacity: progress }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={onClose}
            className="flex-1"
            style={{ backgroundColor: 'rgba(21, 24, 28, 0.34)' }}
          />
        </Animated.View>

        {/* Only the panel travels. */}
        <Animated.View
          style={{
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight, 0],
                }),
              },
            ],
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className={cn('max-h-[88%] overflow-hidden rounded-t-panel bg-panel', className)}
          >
            {/* Grabber: says "this can be dismissed" without promising a drag. */}
            <View className="items-center pt-2.5">
              <View className="h-1 w-9 rounded-full bg-hair" />
            </View>

            {title ? (
              <View className="flex-row items-center justify-between gap-3 px-5 pb-1 pt-3">
                <Text className="flex-1 text-[19px] font-medium text-ink">{title}</Text>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
                  className="items-end justify-center"
                >
                  <Text className="text-[14px] text-ink2">✕</Text>
                </Pressable>
              </View>
            ) : null}

            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingTop: title ? 12 : 16, paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>

            {footer ? (
              <View className="px-5 pt-2" style={{ paddingBottom: insets.bottom + 12 }}>
                {footer}
              </View>
            ) : (
              <View style={{ height: insets.bottom }} />
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  )
}
