import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET } from '@/theme/tokens'

import type { ReactNode } from 'react'

/**
 * A bottom sheet — what a modal becomes on a phone (v4.2 §22.9).
 *
 * Built on RN's `Modal` rather than a gesture library: what the app needs is a
 * sheet that opens, holds a form, and closes. Drag-to-dismiss over a form with
 * unsaved input is a way to lose work by accident, so it is deliberately absent.
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

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        {/* The scrim. Tapping it closes — the standard way out of a sheet. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          onPress={onClose}
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(21, 24, 28, 0.34)' }}
        />

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
      </View>
    </Modal>
  )
}
