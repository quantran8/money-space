import { useTranslation } from 'react-i18next'

import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateSpace } from '@money-space/core/features/settings/hooks/use-create-space'
import { useSpaceSwitcher } from '@money-space/core/features/settings/hooks/use-space-switcher'
import { CreateSpaceDialog } from '@/features/settings/ui/components/create-space-dialog'

/**
 * Which space this page is describing, and the way to start another one.
 *
 * With one space there is no picker (it could not do anything) — only the
 * create action.
 *
 * Shaped like `DataCard` — description left, control right — rather than like
 * `SpaceCard`'s name field. The name below is what this space is CALLED; this
 * row is which space is OPEN. Giving them the same treatment would read as two
 * spellings of one fact.
 */
export function SpaceSwitcherCard() {
  const { t } = useTranslation()
  const { spaces, activeSpaceId, canSwitch, switchTo } = useSpaceSwitcher()
  const createSpace = useCreateSpace()

  return (
    <Panel>
      <PanelHeader
        title={t('settings.spaces.title')}
        action={
          <Button type="button" variant="ghost" size="sm" onClick={createSpace.openDialog}>
            <Plus className="size-4" strokeWidth={1.75} />
            {t('settings.spaces.create.action')}
          </Button>
        }
      />

      <div className="s-head-body grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <p className="min-w-0 t-body-sm leading-5 text-ink2">
          {canSwitch ? t('settings.spaces.description') : t('settings.spaces.single')}
        </p>
        {canSwitch ? (
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
        ) : null}
      </div>
      <CreateSpaceDialog space={createSpace} />
    </Panel>
  )
}
