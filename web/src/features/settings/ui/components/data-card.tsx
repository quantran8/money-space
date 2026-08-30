import { Download, LogOut, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { useLogout } from '@money-space/core/features/auth/hooks/use-logout'

/**
 * Exporting and deleting used to share one card, as two sunk boxes side by
 * side. They are not the same kind of action: one takes a copy away, the other
 * ends the space for everyone in it. Side by side, the destructive one inherited
 * the neutral weight of its neighbour — so they are two panels now, and the
 * second says what it is before it says what it does.
 */
export function DataCard() {
  const { t } = useTranslation()

  return (
    <Panel>
      <PanelHeader title={t('settings.data.eyebrow')} meta={t('household.merged.householdData')} />

      <div className="s-head-body grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="t-subtitle">{t('settings.data.export')}</p>
          <p className="mt-1 t-body-sm leading-5 text-ink2">
            {t('settings.data.exportDescription')}
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" className="justify-self-start">
          <Download className="size-4" strokeWidth={1.75} />
          {t('settings.data.exportAction')}
        </Button>
      </div>
    </Panel>
  )
}

/**
 * Sign-out lives on this page because the mobile drawer that used to hold it is
 * gone — the bottom tab bar covers navigation, and `/household` is the tab a
 * household already opens to manage who they are.
 *
 * Shaped like `DataCard`, deliberately NOT like `DangerCard`: signing out is
 * reversible and costs nothing, so it must not borrow the one bordered card's
 * weight. It is also not confirmed, for the same reason.
 */
export function SignOutCard() {
  const { t } = useTranslation()
  const logout = useLogout()

  return (
    <Panel>
      <PanelHeader title={t('shell.logout')} meta={t('shell.logoutMeta')} />

      <div className="s-head-body grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <p className="max-w-[680px] t-body-sm leading-5 text-ink2">
          {t('shell.logoutDescription')}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="justify-self-start"
          onClick={() => void logout()}
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          {t('shell.logout')}
        </Button>
      </div>
    </Panel>
  )
}

export function DangerCard({ onDelete }: { onDelete: () => void }) {
  const { t } = useTranslation()

  return (
    // The one bordered card in the app. Every other surface separates by
    // lightness (§2.2) — this one is the exception the rule exists for: it is
    // the only panel whose action cannot be undone, and the stroke is what
    // stops it reading as another settings row.
    <Panel className="border border-alert-ink/34">
      <PanelHeader title={t('settings.data.delete')} meta={t('settings.data.dangerMeta')} />

      <div className="s-head-body grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <p className="max-w-[680px] t-body-sm leading-5 text-ink2">
          {t('settings.data.deleteDescription')}
        </p>
        <Button
          type="button"
          size="sm"
          className="justify-self-start bg-alert-tint text-alert-ink hover:bg-alert-tint hover:opacity-80"
          onClick={onDelete}
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
          {t('settings.data.deleteAction')}
        </Button>
      </div>
    </Panel>
  )
}
