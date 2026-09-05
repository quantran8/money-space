import { Children, isValidElement, useEffect, useState } from 'react'
import { AccessibilityInfo, View } from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import type { ReactNode } from 'react'

/**
 * Shared motion primitives, the RN counterpart of `web/src/components/ui/motion.tsx`.
 *
 * Same budget, same reasoning — the curve, the durations and the enter offsets
 * live here so every animated surface reads the same, rather than each screen
 * hand-tuning its own.
 *
 * Motion budget (keep every value inside these ranges):
 *   - duration: 160–260ms
 *   - movement: 4–12px
 *
 * What is deliberately NOT here: `CountUp`, `GrowBar` and `RevealSequence`.
 * Those pace the web's what-if dialog, which is a 56rem surface watched still;
 * mobile's what-if is a sheet, and the block ORDER is the argument there —
 * it survives without the choreography.
 */

/** Apple-like "ease-out-expo" curve, matching the web's `easeOut`. */
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1)

/** Card / list-row enter. */
const ITEM_DURATION = 200
/** How much each item in an `AppearGroup` waits behind the one before it. */
const STAGGER_MS = 50

/**
 * Whether the reader has asked for less motion.
 *
 * RN has no `prefers-reduced-motion` media query, so this is read from the
 * accessibility service and kept current — the setting can change while the
 * app is open. Every primitive here degrades to no animation, never to a
 * blank frame: reduced motion means arriving instantly, not not arriving.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    let active = true
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value)
    })
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  return reduced
}

/**
 * Content that unrolls from under its trigger instead of appearing outright.
 *
 * The one thing React cannot do alone: an unmounted child is gone on the next
 * frame, so a disclosure written as `{open ? <View/> : null}` can only blink.
 *
 * Height carries the movement and `overflow: hidden` clips it mid-transition,
 * exactly as on web — but the height is MEASURED rather than animated to
 * `auto`, which RN has no equivalent for. The child is laid out once at its
 * natural size, `onLayout` reports it, and that number is what the container
 * animates to. Until the first measurement the height is left undriven so the
 * content can size itself; after it, opacity runs shorter than height so the
 * text is not readable while it is still sliding.
 */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const reduced = useReducedMotion()
  const [height, setHeight] = useState<number | null>(null)
  const progress = useSharedValue(open ? 1 : 0)

  useEffect(() => {
    progress.value = reduced
      ? open
        ? 1
        : 0
      : withTiming(open ? 1 : 0, { duration: 240, easing: easeOut })
  }, [open, reduced, progress])

  const containerStyle = useAnimatedStyle(() => ({
    height: height === null ? undefined : progress.value * height,
    opacity: progress.value,
    overflow: 'hidden',
  }))

  // Nothing collapsed is reachable by a screen reader: it is not absent, it is
  // just not open yet.
  return (
    <Animated.View style={containerStyle} accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}>
      <View onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>{children}</View>
    </Animated.View>
  )
}

/**
 * One surface swapped for another in the same slot — a tab body, a step, a
 * result replacing a form.
 *
 * Keyed on `activeKey`, so remounting is what drives the transition. The
 * outgoing pane fades out while the incoming one fades in from a small offset;
 * `LinearTransition` on the wrapper absorbs the height difference so a taller
 * pane does not snap the container.
 */
export function SwitchPane({
  activeKey,
  children,
  className,
}: {
  activeKey: string
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()

  if (reduced) return <View className={className}>{children}</View>

  return (
    <Animated.View className={className} layout={LinearTransition.duration(180)}>
      <Animated.View
        key={activeKey}
        entering={FadeIn.duration(180).easing(easeOut)}
        exiting={FadeOut.duration(120)}
      >
        {children}
      </Animated.View>
    </Animated.View>
  )
}

/**
 * A container whose children fade and drift in with a small stagger on mount.
 * For page section stacks, card stacks and list rows.
 *
 * RN has no `staggerChildren`, so each item delays itself — and the delay is
 * counted HERE rather than by the caller. A page whose sections are
 * conditional (`{forecast ? <X/> : null}`) would otherwise have to hand-number
 * them and renumber on every change, and a wrong number is invisible until it
 * is watched. Nulls are skipped, so the visible children always count 0, 1, 2.
 *
 * Children already wrapped in `AppearItem` keep their own index; anything else
 * is wrapped automatically.
 */
export function AppearGroup({ children, className }: { children: ReactNode; className?: string }) {
  let index = 0
  return (
    <View className={className}>
      {Children.map(children, (child) => {
        if (child === null || child === undefined || typeof child === 'boolean') return child
        const position = index++
        if (isValidElement(child) && child.type === AppearItem) return child
        return <AppearItem index={position}>{child}</AppearItem>
      })}
    </View>
  )
}

/** A single item that fades and drifts in, `index` steps behind the first. */
export function AppearItem({
  index = 0,
  children,
  className,
}: {
  index?: number
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  const progress = useSharedValue(0)

  useEffect(() => {
    if (reduced) {
      progress.value = 1
      return
    }
    progress.value = withDelay(
      index * STAGGER_MS,
      withTiming(1, { duration: ITEM_DURATION, easing: easeOut }),
    )
  }, [index, reduced, progress])

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }))

  return (
    <Animated.View style={style} className={className}>
      {children}
    </Animated.View>
  )
}
