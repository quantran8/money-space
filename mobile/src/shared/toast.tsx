import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Animated, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { configureNotifier } from '@money-space/core/shared/notify'

import type { ReactNode } from 'react'

/**
 * Transient feedback, in the shape core's `notify` expects.
 *
 * Hand-rolled rather than pulled from a library: the app needs exactly two
 * variants and one animation, and v4.2 has opinions about both — a toast is a
 * panel, so no border and no shadow, and the alert tone is the only one that
 * earns colour.
 *
 * It sits at the BOTTOM, above the tab bar, because that is where the thumb is
 * and because a top toast on a phone covers the page title.
 */

const VISIBLE_MS = 3200
const FADE_MS = 180

type ToastTone = 'success' | 'error'
type ToastState = { message: string; tone: ToastTone } | null

const ToastContext = createContext<((message: string, tone: ToastTone) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null)
  // Lazy state, not a ref: the value must be created once, and reading
  // `ref.current` during render is what the rules of hooks forbid.
  const [opacity] = useState(() => new Animated.Value(0))
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(
    (message: string, tone: ToastTone) => {
      if (timer.current) clearTimeout(timer.current)
      setToast({ message, tone })
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start()

      timer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setToast(null)
        })
      }, VISIBLE_MS)
    },
    [opacity],
  )

  // Wire core's notifier to this provider. Done in an effect so the first
  // render has already mounted the host view that will display the toast.
  useEffect(() => {
    configureNotifier({
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    })
  }, [show])

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastHost toast={toast} opacity={opacity} />
    </ToastContext.Provider>
  )
}

function ToastHost({ toast, opacity }: { toast: ToastState; opacity: Animated.Value }) {
  const insets = useSafeAreaInsets()
  if (!toast) return null

  return (
    <Animated.View
      pointerEvents="none"
      style={{ opacity, bottom: insets.bottom + 72 }}
      className="absolute left-4 right-4 z-50"
    >
      <View className="rounded-panel bg-panel px-4 py-3.5">
        <Text
          accessibilityLiveRegion="polite"
          className={`text-[14px] leading-5 ${
            toast.tone === 'error' ? 'text-alert' : 'text-ink'
          }`}
        >
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  )
}

/** Show a toast from a component, without going through core's notifier. */
export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
