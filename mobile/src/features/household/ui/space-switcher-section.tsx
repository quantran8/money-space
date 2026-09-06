import { useTranslation } from 'react-i18next'

import { useSpaceSwitcher } from '@money-space/core/features/settings/hooks/use-space-switcher'

import { Panel, Select } from '@/components/ui'

/**
 * Which space this phone is showing.
 *
 * Absent for the household with one space — a sheet that opens to reveal a
 * single row is a tap that leads nowhere — so the tab looks exactly as it
 * always has for everyone the product was originally shaped around.
 *
 * `Select` rather than rows in the panel: the spaces are a single-choice set,
 * the sheet already marks the active one, and past eight it grows a search box
 * on its own.
 */
export function SpaceSwitcherSection() {
  const { t } = useTranslation()
  const { spaces, activeSpaceId, canSwitch, switchTo } = useSpaceSwitcher()

  if (!canSwitch) return null

  return (
    <Panel>
      <Select
        label={t('settings.spaces.label')}
        value={activeSpaceId}
        onChange={switchTo}
        placeholder={t('settings.spaces.placeholder')}
        options={spaces.map((space) => ({ value: space.id, label: space.name }))}
      />
    </Panel>
  )
}
