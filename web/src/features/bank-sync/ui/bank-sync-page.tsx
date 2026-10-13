import { Inbox } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Button } from '@/components/ui/button'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { DevicesPanel } from '@/features/bank-sync/ui/components/devices-panel'
import { MatchRulesPanel } from '@/features/bank-sync/ui/components/match-rules-panel'
import { SourcesPanel } from '@/features/bank-sync/ui/components/sources-panel'
import { useBankInboxCounts } from '@money-space/core/features/bank-sync/hooks/use-bank-inbox'

/** `/settings/bank-sync` — devices, linked accounts, and what to expect. See memory/bank-sync.md. */
export function BankSyncPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { total } = useBankInboxCounts()
  const [params, setParams] = useSearchParams()
  // The inbox links here with `?add=1` to link an unmapped account.
  const [addSourceOpen, setAddSourceOpen] = useState(params.get('add') === '1')
  const onAddOpenChange = (open: boolean) => {
    setAddSourceOpen(open)
    if (!open && params.has('add')) setParams({}, { replace: true })
  }

  return (
    <div className="s-page">
      <CompactPageHeader
        title={t('bankSync.page.title')}
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/bank-inbox')}>
            <Inbox className="size-4" strokeWidth={1.75} />
            {t('bankSync.page.openInbox')}
            {total > 0 ? <span className="num">({total})</span> : null}
          </Button>
        }
      />
      <p className="mt-1 t-body-sm text-ink2">{t('bankSync.page.subtitle')}</p>

      <div className="s-card-gap s-head-body flex flex-col">
        <DevicesPanel />
        <SourcesPanel addOpen={addSourceOpen} onAddOpenChange={onAddOpenChange} />
        <MatchRulesPanel />
        <Panel>
          <PanelHeader title={t('bankSync.limits.title')} />
          <ul className="s-head-body list-disc space-y-2 pl-5 t-body-sm leading-5 text-ink2">
            <li>{t('bankSync.limits.l1')}</li>
            <li>{t('bankSync.limits.l2')}</li>
            <li>{t('bankSync.limits.l3')}</li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}
