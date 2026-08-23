import { useEffect, useState } from 'react'
import { Animated, Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { Button } from '@/components/ui/button'

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
      className={cn('rounded-control bg-sunk', className)}
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
  className,
}: {
  message: string
  action?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <View className={cn('rounded-sunk bg-sunk p-4', className)}>
      <Text className="text-[14px] leading-5 text-ink2">{message}</Text>
      {action && onAction ? (
        <Button className="mt-3 self-start" variant="ghost" onPress={onAction}>
          {action}
        </Button>
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
    <View className={cn('rounded-sunk bg-sunk p-4', className)}>
      <Text className="text-[14px] leading-5 text-alert">{message}</Text>
      {retryLabel && onRetry ? (
        <Button className="mt-3 self-start" variant="ghost" onPress={onRetry}>
          {retryLabel}
        </Button>
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
  return (
    <View className={cn('rounded-sunk bg-attention-soft p-3.5', className)}>
      <Text className="text-[12px] leading-5 text-ink2">{children}</Text>
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
    <View className={cn('rounded-sunk bg-interactive-soft p-3.5', className)}>
      <Text className="text-[14px] leading-5 text-ink">{children}</Text>
    </View>
  )
}
