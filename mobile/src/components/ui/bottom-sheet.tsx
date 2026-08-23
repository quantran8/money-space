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

/** v4.2 §8: 120–550ms on this curve. Android only; iOS uses its own. */
const DURATION = 260
const EASING = Easing.bezier(0.2, 0.7, 0.3, 1)

const IS_IOS = Platform.OS === 'ios'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Pinned below the scroll area, so the primary action stays reachable. */
  footer?: ReactNode
  className?: string
}

/**
 * A bottom sheet — what a modal becomes on a phone (v4.2 §22.9).
 *
 * **On iOS this is the system sheet** (`presentationStyle="pageSheet"`): the
 * platform owns the scrim, the corner radius, the rubber-banding and the
 * swipe-to-dismiss, and it stops at the top inset the way every other iOS sheet
 * does. Hand-rolling that was a mistake — the version before this one dimmed
 * the page with a grey layer that rose from the bottom edge, and its panel
 * floated above the tab bar instead of covering it.
 *
 * Android has no equivalent, so it keeps the hand-built version: scrim fading
 * in place, panel sliding, which is what Material does anyway.
 *
 * Drag-to-dismiss is the platform's on iOS and deliberately absent on Android —
 * a swipe over a half-filled form is a way to lose work by accident. iOS asks
 * for confirmation itself when the sheet is dismissed with unsaved input only
 * if the app opts in, which is a refinement worth adding once the forms settle.
 */
export function BottomSheet(props: BottomSheetProps) {
  return IS_IOS ? <IosSheet {...props} /> : <AndroidSheet {...props} />
}

/** The chrome inside the sheet — identical on both platforms. */
function SheetBody({
  title,
  children,
  footer,
  onClose,
  /** iOS draws its own grabber; Android needs ours. */
  showGrabber,
}: Pick<BottomSheetProps, 'title' | 'children' | 'footer' | 'onClose'> & {
  showGrabber: boolean
}) {
  const insets = useSafeAreaInsets()

  return (
    <>
      {showGrabber ? (
        <View className="items-center pt-2.5">
          <View className="h-1 w-9 rounded-full bg-hair" />
        </View>
      ) : null}

      {title ? (
        <View className="flex-row items-center justify-between gap-3 px-5 pb-1 pt-4">
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
        <View
          className="px-5 pt-2"
          // A pageSheet already clears the home indicator, so adding the inset
          // again would leave a band of empty panel under the button.
          style={{ paddingBottom: IS_IOS ? 12 : insets.bottom + 12 }}
        >
          {footer}
        </View>
      ) : (
        <View style={{ height: IS_IOS ? 8 : insets.bottom }} />
      )}
    </>
  )
}

/**
 * iOS: the real thing. `pageSheet` cannot be combined with `transparent` —
 * UIKit supplies the dimming and the rounded card itself.
 */
function IosSheet({ open, onClose, title, children, footer, className }: BottomSheetProps) {
  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior="padding" className={cn('flex-1 bg-panel', className)}>
        <SheetBody title={title} footer={footer} onClose={onClose} showGrabber={false}>
          {children}
        </SheetBody>
      </KeyboardAvoidingView>
    </Modal>
  )
}

/**
 * Android: hand-built, because there is no system sheet behind `Modal`.
 *
 * The two layers animate SEPARATELY. `animationType="slide"` moves everything
 * inside the modal as one block, which drags the scrim up from the bottom edge
 * with the panel — the page then reads as being dimmed by a rising sheet of
 * grey rather than by a layer sitting over it.
 */
function AndroidSheet({ open, onClose, title, children, footer, className }: BottomSheetProps) {
  const { height: screenHeight } = useWindowDimensions()

  /**
   * The Modal has to outlive `open` or the closing animation is cut off by the
   * unmount — callers flip `open` and drop the sheet in the same render. Only
   * the CLOSE is deferred; `open` mounts during render.
   */
  const [closing, setClosing] = useState(false)
  // Lazy state, not a ref: created once, and reading `.current` during render
  // is what the rules of hooks forbid.
  const [progress] = useState(() => new Animated.Value(0))

  // Derive the exit from the prop CHANGING, during render — React's documented
  // way to adjust state on a prop change, and it keeps `setState` out of the
  // effect.
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
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
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
            className={cn('max-h-[88%] overflow-hidden rounded-t-panel bg-panel', className)}
          >
            <SheetBody title={title} footer={footer} onClose={onClose} showGrabber>
              {children}
            </SheetBody>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  )
}
