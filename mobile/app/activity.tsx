import { useTranslation } from 'react-i18next'

import { useActivity } from '@money-space/core/features/activity/hooks/use-activity'
import { useNavigate } from '@money-space/core/shared/navigation'

import { BackLink, Screen, Sections } from '@/components/ui'
import { ActivityListSection } from '@/features/activity/ui/activity-list-section'

/**
 * `/activity` — Nhật ký, the household journal.
 *
 * Reached from Gia đình, and deliberately **not** a sixth tab: the bottom bar
 * is capped at five (§13), and this is a "what changed" question people ask
 * occasionally, not one of the five destinations they live in.
 *
 * It records the events that moved the shared picture — not every transaction.
 * A personal purchase never appears here, which is what keeps the journal a
 * record of the household's money rather than a log of each other's day.
 */
export default function ActivityScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { entries, isLoading, isRefetching, refetch } = useActivity()

  return (
    <Screen
      title={t('activity.header.title')}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
    >
      <Sections>
        {/* Named in words, not left to an arrow: a deep link can land here with
            no stack behind it, and the system gesture is invisible (§9). */}
        <BackLink label={t('nav.household')} onPress={() => navigate('/household')} />

        <ActivityListSection entries={entries} isLoading={isLoading} />
      </Sections>
    </Screen>
  )
}
