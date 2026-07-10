import { useTranslation } from 'react-i18next'

import { SummaryStrip, SummaryTile } from '@/components/ui/summary-strip'
import type { MemberItem } from '@/features/members/model/members'

type MembersSummaryStripProps = {
  members: MemberItem[]
  activeCount: number
  invitedCount: number
}

export function MembersSummaryStrip({
  members,
  activeCount,
  invitedCount,
}: MembersSummaryStripProps) {
  const { t } = useTranslation()
  return (
    <SummaryStrip>
      <SummaryTile
        label={t('members.strip.active')}
        value={activeCount}
        dotColor="hsl(var(--status-green))"
      />
      <SummaryTile
        label={t('members.strip.invited')}
        value={invitedCount}
        dotColor="hsl(var(--status-orange))"
      />
      <SummaryTile
        label={t('members.strip.defaultShare')}
        value={t('members.strip.defaultShareValue')}
      />
      <SummaryTile
        label={t('members.strip.lastChange')}
        value={members[0]?.lastActive ?? '—'}
        inverted
      />
    </SummaryStrip>
  )
}
