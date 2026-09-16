import { Text, View } from 'react-native'

import { cn } from '@money-space/core/shared/lib/utils'

import { colors } from '@/theme/tokens'

export type StatusTone = 'neutral' | 'positive' | 'attention' | 'alert'

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
    positive: colors.positive,
    attention: colors.attention,
    alert: colors.alert,
  }

  // A state needing action states itself in ink at 500; a settled one recedes
  // to ink2. The dot carries the tone, the word carries the meaning.
  const text: Record<StatusTone, string> = {
    neutral: 'text-ink2',
    positive: 'text-ink2',
    attention: 'font-medium text-ink',
    alert: 'font-medium text-ink',
  }

  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot[tone] }} />
      <Text className={cn('t-body-sm', text[tone])}>{label}</Text>
    </View>
  )
}
