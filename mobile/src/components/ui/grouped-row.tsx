import { Pressable, Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { TOUCH_TARGET } from '@/theme/tokens'

import type { ReactNode } from 'react'

/**
 * One row of a list: what it is on the left, what it costs on the right.
 *
 * This is the mobile substitute for a table (v4.2 §8): under 640px a table
 * becomes grouped rows, and core flows must never scroll sideways. So the
 * columns a table would give are folded into two stacked lines here, with the
 * amount right-aligned where a column of them still lines up.
 *
 * Any field with no data COLLAPSES rather than rendering empty — an empty
 * column stretches the layout and says nothing.
 *
 * No divider by default. Rows are separated by spacing; a border is a fallback
 * for when spacing and alignment have already failed.
 */
export function GroupedRow({
  title,
  meta,
  value,
  valueMeta,
  valueTone = 'default',
  onPress,
  right,
  className,
}: {
  title: string
  /** Date, owner, status — the ASCII parts render in mono. */
  meta?: ReactNode
  value?: string
  /** Running balance or similar, under the amount. */
  valueMeta?: string
  valueTone?: 'default' | 'attention' | 'alert' | 'muted'
  onPress?: () => void
  right?: ReactNode
  className?: string
}) {
  const tone = {
    default: 'text-ink',
    attention: 'text-attention-ink',
    alert: 'text-alert-ink',
    muted: 'text-ink2',
  }[valueTone]

  const body = (
    <View className="flex-row items-center gap-3">
      <View className="flex-1">
        <Text className="t-body-sm leading-5 text-ink" numberOfLines={2}>
          {title}
        </Text>
        {meta ? <View className="mt-0.5">{meta}</View> : null}
      </View>

      {value ? (
        <View className="items-end">
          <Text
            className={cn('t-body-sm font-medium', tone)}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {value}
          </Text>
          {valueMeta ? (
            <Text
              className="mt-0.5 t-caption-sm text-ink3"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {valueMeta}
            </Text>
          ) : null}
        </View>
      ) : null}

      {right}
    </View>
  )

  if (!onPress) {
    return <View className={cn('py-2.5', className)}>{body}</View>
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ minHeight: TOUCH_TARGET }}
      // An interactive row highlights on the sunk surface — the same band a
      // table row uses on the web.
      className={cn('justify-center rounded-control py-2.5 active:bg-wash', className)}
    >
      {body}
    </Pressable>
  )
}

/**
 * Metadata under a row title. ASCII only — dates, counts, percentages — so the
 * mono face never touches accented Vietnamese (§5, hard constraint).
 */
export function RowMetaMono({ children }: { children: string }) {
  return <Text className="font-mono t-caption-sm text-ink3">{children}</Text>
}

/** Metadata that contains Vietnamese. Sans face, same size and weight. */
export function RowMeta({ children }: { children: ReactNode }) {
  return <Text className="t-caption-sm text-ink3">{children}</Text>
}
