import { ChessQueen, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { GoalPriority } from '@money-space/core/features/goals/model/goals'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * Priority, as a rank rather than a flag: a high-priority goal is funded first
 * when the wallet cannot cover every goal, a low one last.
 *
 * `low` carries no mark. It is the quietest rank, and an icon on every card
 * would spend attention on the goals least in need of it — absence is the
 * signal. Only the two ranks that pull funding forward get a glyph, so a scan
 * down the list finds them first.
 *
 * Shared by the goals list and Home's goal section: one concept, one look
 * (§2.10). `size` is the only thing that differs between them — Home's rows are
 * denser and cannot spend a 44px tap target on a non-interactive mark.
 */
const PRIORITY_ICON: Partial<Record<GoalPriority, LucideIcon>> = {
  high: ChessQueen,
  medium: Star,
}

export function GoalPriorityMark({
  priority,
  size = 'default',
}: {
  priority: GoalPriority
  /** `compact` drops the tap-target box — for dense rows that are not buttons. */
  size?: 'default' | 'compact'
}) {
  const { t } = useTranslation()
  const Icon = PRIORITY_ICON[priority]
  if (!Icon) return null

  const label = t(`options.priority.${priority}`)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        size === 'compact' ? 'size-[18px]' : 'size-11 rounded-control',
      )}
      role="img"
      aria-label={label}
      title={label}
    >
      <Icon
        className={cn('size-[18px]', priority === 'high' ? 'text-attention-ink' : 'text-ink3')}
        strokeWidth={1.75}
      />
    </span>
  )
}
