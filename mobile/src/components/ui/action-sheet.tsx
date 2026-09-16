import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useRef, useState } from 'react'
import { Modal, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button as NativeButton, Host, Menu, RNHostView } from '@expo/ui/swift-ui'

import { cn } from '@money-space/core/shared/lib/utils'

import { easeOut, useReducedMotion } from '@/components/ui/motion'
import { TOUCH_TARGET, colors, overlayShadow, spacing } from '@/theme/tokens'

export type ActionSheetItem = {
  key: string
  label: string
  onPress: () => void
  destructive?: boolean
}

type ActionSheetProps = {
  title: string
  items: ActionSheetItem[]
  accessibilityLabel: string
  className?: string
}

/** iOS menu geometry: ~250 wide, rows taller than the 44pt floor, radius 14. */
const MENU_WIDTH = 250
const ROW_HEIGHT = 52
/** Gap to the "…", and the margin the menu keeps off any screen edge. */
const GAP = 6
const EDGE = spacing.page
const DURATION = 180

const IS_IOS = Platform.OS === 'ios'

/**
 * The row-level "…" menu.
 *
 * **On iOS this is the system menu** (SwiftUI `Menu` → `UIMenu`): the platform
 * owns the anchoring, the edge clamping, the flip and the dismissal. Android
 * keeps the hand-built popover — `@expo/ui` has no `Menu` there, and its
 * `DropdownMenu` is Material-styled and controlled.
 *
 * `Menu`, not `ContextMenu`: the latter is long-press only. See
 * memory/mobile-expo-ui-menu.md.
 */
export function ActionSheet(props: ActionSheetProps) {
  return IS_IOS ? <IosMenu {...props} /> : <AndroidMenu {...props} />
}

/** The "…" glyph, shared so both platforms wear the same v5 mark. */
function TriggerIcon() {
  return <Ionicons name="ellipsis-horizontal" size={18} color={colors.ink3} />
}

/**
 * iOS: the real thing. `Host` bridges SwiftUI into RN layout and needs a size
 * of its own — the trigger's 44pt box.
 */
function IosMenu({ items, accessibilityLabel, className }: ActionSheetProps) {
  return (
    // `Host` takes no className — NativeWind never reaches SwiftUI content.
    <Host
      style={{ width: TOUCH_TARGET, height: TOUCH_TARGET }}
      // Tints the native rows to the v5 interaction colour; `destructive`
      // still wins and renders red.
      seedColor={colors.action}
    >
      <Menu
        label={
          <RNHostView>
            <View
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
              className={cn('items-center justify-center rounded-control', className)}
            >
              <TriggerIcon />
            </View>
          </RNHostView>
        }
      >
        {items.map((item) => (
          // `label`, not children — Button children take elements, not strings.
          <NativeButton
            key={item.key}
            label={item.label}
            role={item.destructive ? 'destructive' : 'default'}
            onPress={item.onPress}
          />
        ))}
      </Menu>
    </Host>
  )
}

/**
 * Android: hand-built, like the iOS system menu — a popover anchored to the
 * button, hairline-separated rows, growing out of the "…". A two-entry row menu
 * is not worth a bottom sheet, and the anchor is what says which row it belongs
 * to. Tap anywhere else to dismiss.
 */
function AndroidMenu({ title, items, accessibilityLabel, className }: ActionSheetProps) {
  const anchorRef = useRef<View>(null)
  const [anchor, setAnchor] = useState<{ x: number; y: number; height: number } | null>(null)
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  // Measured on press: a row inside a ScrollView moves after layout.
  const open = () => {
    anchorRef.current?.measureInWindow((x, y, _width, height) => {
      setAnchor({ x, y, height })
    })
  }

  const menuHeight = items.length * ROW_HEIGHT
  // The "…" sits at a row's right edge, so the menu hangs left from it.
  const left = anchor
    ? Math.min(Math.max(anchor.x + TOUCH_TARGET - MENU_WIDTH, EDGE), screenWidth - MENU_WIDTH - EDGE)
    : 0
  const below = anchor ? anchor.y + anchor.height + GAP : 0
  // Flip above the anchor when the menu would run past the bottom inset.
  const flips = anchor !== null && below + menuHeight > screenHeight - insets.bottom - EDGE
  const top = anchor ? (flips ? Math.max(anchor.y - menuHeight - GAP, insets.top + EDGE) : below) : 0

  return (
    <>
      <Pressable
        ref={anchorRef}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: anchor !== null }}
        style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
        className={cn('items-center justify-center rounded-control active:bg-wash', className)}
      >
        <TriggerIcon />
      </Pressable>

      <Modal
        visible={anchor !== null}
        transparent
        animationType="none"
        onRequestClose={() => setAnchor(null)}
        statusBarTranslucent
      >
        {/* No scrim — a popover does not dim its page; this layer only catches
            the dismissing tap. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          onPress={() => setAnchor(null)}
          className="flex-1"
        >
          <MenuCard flips={flips} style={{ top, left, width: MENU_WIDTH }}>
            {items.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  setAnchor(null)
                  item.onPress()
                }}
                accessibilityRole="button"
                style={{ height: ROW_HEIGHT }}
                className={cn(
                  'justify-center px-4 active:bg-wash',
                  index > 0 && 'border-t border-divider',
                )}
              >
                <Text className={cn('t-body', item.destructive ? 'text-alert-ink' : 'text-ink')}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </MenuCard>
        </Pressable>
      </Modal>
    </>
  )
}

/** Grows out of the corner nearest the "…", the way the system menu does. */
function MenuCard({
  flips,
  style,
  children,
}: {
  flips: boolean
  style: { top: number; left: number; width: number }
  children: React.ReactNode
}) {
  const reduced = useReducedMotion()
  const progress = useSharedValue(reduced ? 1 : 0)

  useEffect(() => {
    progress.value = reduced ? 1 : withTiming(1, { duration: DURATION, easing: easeOut })
  }, [reduced, progress])

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.86 + progress.value * 0.14 }],
  }))

  return (
    <Animated.View
      style={[
        // Elevation rides outside the clipping surface, or the panel eats its
        // own shadow.
        { ...overlayShadow, position: 'absolute', ...style },
        // The origin is the anchored corner: top-right, or bottom-right flipped.
        { transformOrigin: flips ? 'bottom right' : 'top right' },
        animated,
      ]}
    >
      <View className="overflow-hidden rounded-control bg-panel">{children}</View>
    </Animated.View>
  )
}
