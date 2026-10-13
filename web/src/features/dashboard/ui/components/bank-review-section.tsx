import { ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Panel, PanelHeader } from '@/components/ui/panel'
import { BankEventRow } from '@/features/bank-sync/ui/components/bank-event-row'
import { EventDetailDialog } from '@/features/bank-sync/ui/components/event-detail-dialog'
import {
  useBankInbox,
  useBankInboxCounts,
} from '@money-space/core/features/bank-sync/hooks/use-bank-inbox'
import { useBankSources } from '@money-space/core/features/bank-sync/hooks/use-bank-sources'
import type { BankNotificationEvent } from '@money-space/core/features/bank-sync/model/bank-sync.types'
import type { CashflowEvent } from '@money-space/core/features/cashflow/model/cashflow.types'

const VISIBLE = 3

// Renders nothing when no notification waits on the household. See memory/bank-sync.md.
export function BankReviewSection({ cashflowEvents }: { cashflowEvents: CashflowEvent[] }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<BankNotificationEvent | null>(null)
  const { byTab } = useBankInboxCounts()
  const inbox = useBankInbox('review')
  const { walletOptions } = useBankSources()

  const count = byTab.review
  const hasReview = count > 0 && inbox.events.length > 0
  if (!hasReview) return null

  const cashflowOptions = cashflowEvents
    .filter((e) => e.status !== 'completed' && e.status !== 'cancelled')
    .map((e) => ({ value: e.id, label: e.name, direction: e.direction }))

  return (
    <Panel>
      <PanelHeader
        title={t('bankSync.inbox.home.title')}
        meta={hasReview ? t('bankSync.inbox.home.count', { count }) : undefined}
        action={
          <Link
            to="/bank-inbox"
            className="inline-flex min-h-11 items-center gap-1 t-body font-medium text-action"
          >
            {t('bankSync.inbox.home.viewAll')}
            <ArrowUpRight className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
          </Link>
        }
      />
      {hasReview ? (
        <>
          <p className="mt-3 max-w-[760px] t-body-sm leading-5 text-ink2">
            {t('bankSync.inbox.home.note')}
          </p>
          <ul className="mt-2 divide-y divide-divider">
            {inbox.events.slice(0, VISIBLE).map((event) => (
              <li key={event.id}>
                <BankEventRow event={event} onSelect={setSelected} />
              </li>
            ))}
          </ul>
          {count > VISIBLE ? (
            <p className="mt-3 t-caption text-ink2">
              {t('bankSync.inbox.home.more', { count: count - VISIBLE })}
            </p>
          ) : null}
        </>
      ) : null}

      <EventDetailDialog
        event={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        walletOptions={walletOptions}
        cashflowOptions={cashflowOptions}
        onPost={inbox.post}
        onReplaceManual={inbox.replaceManual}
        onIgnore={inbox.ignore}
        onReparse={inbox.reparse}
        busy={inbox.isResolving || inbox.isReparsing}
      />
    </Panel>
  )
}
