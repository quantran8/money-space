import { useTranslation } from 'react-i18next'

import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSpaceSwitcher } from '@money-space/core/features/settings/hooks/use-space-switcher'

/**
 * Which space this page is describing.
 *
 * Absent for the household with one space, which is most of them: a picker
 * holding a single option is a control that cannot do anything, and it would
 * sit directly above the panel naming the space it cannot change.
 *
 * Shaped like `DataCard` — description left, control right — rather than like
 * `HouseholdOverviewCard`'s field grid. The name below is what this space is
 * CALLED; this row is which space is OPEN. Giving them the same treatment would
 * read as two spellings of one fact.
 */
export function SpaceSwitcherCard() {
  const { t } = useTranslation()
  const { spaces, activeSpaceId, canSwitch, switchTo } = useSpaceSwitcher()

  if (!canSwitch) return null

  return (
    <Panel>
      <PanelHeader
        title={t('settings.spaces.title')}
        meta={t('settings.spaces.count', { count: spaces.length })}
      />

      <div className="s-head-body grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <p className="min-w-0 t-body-sm leading-5 text-ink2">
          {t('settings.spaces.description')}
        </p>
        <Select value={activeSpaceId ?? undefined} onValueChange={switchTo}>
          <SelectTrigger
            aria-label={t('settings.spaces.label')}
            className="justify-self-start sm:w-64"
          >
            <SelectValue placeholder={t('settings.spaces.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {spaces.map((space) => (
              <SelectItem key={space.id} value={space.id}>
                {space.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Panel>
  )
}
