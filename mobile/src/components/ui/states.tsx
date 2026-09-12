import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useState } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

import type { ReactNode } from 'react'

/**
 * The UI states every section owes the reader (v4.2 §4 / §23).
 *
 * The rule that matters most: **never show `0đ` when the truth is "no data
 * yet"**. They are different facts, and confusing them destroys trust the
 * first time someone opens the app.
 */

/** A loading placeholder at the true height of what is coming. */
export function Skeleton({ className, height = 20 }: { className?: string; height?: number }) {
  const [opacity] = useState(() => new Animated.Value(0.5))

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  return (
    <Animated.View
      style={{ opacity, height }}
      className={cn('rounded-control bg-wash', className)}
    />
  )
}

/**
 * Nothing has been recorded yet.
 *
 * Says so in words and offers the action that would change it. It must never
 * be mistaken for a zero — a household with no assets recorded does not have
 * 0đ, it has an unanswered question.
 */
export function EmptyState({
  message,
  action,
  onAction,
  icon = 'file-tray',
  className,
}: {
  /** Spoken, not drawn: it becomes the icon's label. */
  message: string
  action?: string
  onAction?: () => void
  icon?: React.ComponentProps<typeof Ionicons>['name']
  className?: string
}) {
  // Not a sub-card — it sits directly inside the top-level card. The sentence
  // became a glyph: it only restated the emptiness the blank area already
  // showed. What stays in words is what an icon cannot say — the action.
  return (
    <View className={cn('items-center gap-3.5 pb-5 pt-6', className)}>
      <Ionicons name={icon} size={28} color={colors.ink3} accessibilityLabel={message} />
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" className="s-tap justify-center">
          <Text className="t-body-sm font-medium text-ink">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/** Something failed. Says what, and offers a retry — never a bare spinner. */
export function ErrorState({
  message,
  retryLabel,
  onRetry,
  className,
}: {
  message: string
  retryLabel?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <View className={cn('gap-2', className)}>
      <Text className="t-body-sm text-alert-ink">{message}</Text>
      {retryLabel && onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          className="s-tap self-start justify-center"
        >
          <Text className="t-body-sm font-medium text-ink">{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/**
 * The figure is computable but something it depends on is missing or stale.
 *
 * **Partial is the common case, not the exception.** The number still shows,
 * undimmed; this names what is missing beside it. Blocking the whole section
 * because one input is old would hide the answer the household came for.
 */
export function CaveatNote({ children, className }: { children: ReactNode; className?: string }) {
  // No tinted box: the notice sits on the card and names what is missing. The
  // figure it qualifies stays undimmed beside it, and never becomes a zero.
  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <Ionicons name="cloud-offline" size={22} color={colors.ink2} />
      <Text className="flex-1 t-body-sm text-ink2">{children}</Text>
    </View>
  )
}

/**
 * The consequence sentence under a form field (§22.7).
 *
 * One sentence, never a grid of labelled metrics — a grid is report language,
 * a sentence is how two people actually talk about money.
 */
export function ConsequenceNote({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <View className={cn('rounded-control bg-action-soft p-3.5', className)}>
      <Text className="t-body-sm leading-5 text-ink">{children}</Text>
    </View>
  )
}
