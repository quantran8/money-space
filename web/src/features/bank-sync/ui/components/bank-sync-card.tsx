import { Landmark } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { StatusChip } from '@/components/ui/status-chip'
import { useBankInboxCounts } from '@money-space/core/features/bank-sync/hooks/use-bank-inbox'

/** Settings entry point; the setup itself is its own page. */
export function BankSyncCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { total } = useBankInboxCounts()

  return (
    <Panel>
      <PanelHeader title={t('bankSync.card.title')} meta={t('bankSync.card.meta')} />
      <div className="s-head-body grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="max-w-[680px] t-body-sm leading-5 text-ink2">
            {t('bankSync.card.description')}
          </p>
          {total > 0 ? (
            <button
              type="button"
              className="mt-2 text-left"
              onClick={() => navigate('/bank-inbox')}
            >
              <StatusChip tone="attention">{t('bankSync.card.pending', { count: total })}</StatusChip>
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="justify-self-start"
          onClick={() => navigate('/settings/bank-sync')}
        >
          <Landmark className="size-4" strokeWidth={1.75} />
          {t('bankSync.card.open')}
        </Button>
      </div>
    </Panel>
  )
}
