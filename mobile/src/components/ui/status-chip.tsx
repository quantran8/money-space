import { Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

export type StatusTone = 'neutral' | 'interactive' | 'attention' | 'alert'

/**
 * A dot and a word.
 *
 * Two rules from v4.2 §5 hold this together:
 *  - **Never a filled pill.** A normal status does not need a coloured badge;
 *    a pill for every state spends the colour budget on things nobody must act
 *    on, leaving nothing to signal with.
 *  - **The dot never carries meaning alone.** Colour is never the only channel
 *    (§9), so the text always says the state too. Removing the label because
 *    "the colour says it" is the failure this guards against.
 */
export function StatusChip({
  label,
  tone = 'neutral',
  className,
}: {
  label: string
  tone?: StatusTone
  className?: string
}) {
  const dot: Record<StatusTone, string> = {
    neutral: colors.ink3,
    interactive: colors.interactive,
    attention: colors.attention,
    alert: colors.alert,
  }

  const text: Record<StatusTone, string> = {
    neutral: 'text-ink2',
    interactive: 'text-ink',
    attention: 'text-attention',
    alert: 'text-alert',
  }

  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <View
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: dot[tone] }}
      />
      <Text className={cn('text-[14px]', text[tone])}>{label}</Text>
    </View>
  )
}
