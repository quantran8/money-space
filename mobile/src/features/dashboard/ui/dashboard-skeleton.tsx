import { View } from 'react-native'

import { Panel, Sections, Skeleton } from '@/components/ui'

/**
 * Home while its fan-out lands.
 *
 * Blocks at the true height of what is coming, so the page does not jump when
 * the figures arrive. Nothing here shows a zero: a placeholder that reads as a
 * number is the exact confusion §23 forbids.
 *
 * The whole page is gated rather than each section, because Home's sections are
 * not independent — the hero, the low point and the source list are three
 * readings of the same inputs, and letting them trickle in would let the
 * household read a figure before the block that qualifies it exists (§2.15).
 */
export function DashboardSkeleton() {
  return (
    <Sections>
      <Panel>
        <Skeleton height={16} className="w-1/2" />
        <Skeleton height={48} className="mt-5 w-3/4" />
        <Skeleton height={14} className="mt-4 w-2/3" />
        <Skeleton height={10} className="mt-6 rounded-full" />
      </Panel>

      <Panel>
        <Skeleton height={16} className="w-1/3" />
        <Skeleton height={30} className="mt-5 w-1/2" />
        <View className="mt-6 gap-2">
          <Skeleton height={44} className="rounded-control" />
          <Skeleton height={44} className="rounded-control" />
          <Skeleton height={44} className="rounded-control" />
        </View>
      </Panel>

      <Panel>
        <Skeleton height={16} className="w-2/5" />
        <View className="mt-5 gap-2">
          <Skeleton height={64} className="rounded-control" />
          <Skeleton height={64} className="rounded-control" />
        </View>
      </Panel>
    </Sections>
  )
}
