import { useTranslation } from 'react-i18next'

import { EmptyState, Screen } from '@/components/ui'

/**
 * Stand-in for a screen whose feature has not been ported yet.
 *
 * It says plainly that the screen is not built, rather than showing an empty
 * panel — §23 is explicit that "no data yet" and "nothing here" must never be
 * confusable, and that rule starts with the scaffolding.
 */
export function ScreenPlaceholder({ title }: { title: string }) {
  const { t } = useTranslation()

  return (
    <Screen title={title}>
      <EmptyState message={t('common.comingSoon')} />
    </Screen>
  )
}
