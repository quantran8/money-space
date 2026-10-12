import { Inbox } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusChip } from '@/components/ui/status-chip'
import { cn } from '@money-space/core/shared/lib/utils'
import { EventDetailDialog } from '@/features/bank-sync/ui/components/event-detail-dialog'
import {
  useBankInbox,
  useBankInboxCounts,
} from '@money-space/core/features/bank-sync/hooks/use-bank-inbox'
import { useBankSources } from '@money-space/core/features/bank-sync/hooks/use-bank-sources'
import {
  eventTime,
  reasonText,
  signedEventAmount,
} from '@money-space/core/features/bank-sync/model/bank-sync'
import type {
  BankInboxTab,
  BankNotificationEvent,
} from '@money-space/core/features/bank-sync/model/bank-sync.types'
import { formatVndSigned } from '@money-space/core/shared/lib/format-money'

const TABS: BankInboxTab[] = ['review', 'unmapped', 'parse_failed']

/** `/bank-inbox` — notifications not yet recorded. Status always comes from the server. */
export function BankInboxPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<BankInboxTab>('review')
  const [selected, setSelected] = useState<BankNotificationEvent | null>(null)
  const counts = useBankInboxCounts()
  const inbox = useBankInbox(tab)
  const { walletOptions } = useBankSources()

  return (
    <div className="s-page">
      <CompactPageHeader title={t('bankSync.inbox.title')} />
      <p className="mt-1 max-w-[680px] t-body-sm text-ink2">{t('bankSync.inbox.subtitle')}</p>

      <div role="tablist" className="s-head-body flex flex-wrap gap-2">
        {TABS.map((key) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'rounded-pill px-4 py-2 t-body-sm transition-colors',
              tab === key ? 'bg-action text-action-inverse' : 'bg-wash text-ink2 hover:text-ink',
            )}
          >
            {t(`bankSync.inbox.tabs.${key}`)}
            {counts.byTab[key] > 0 ? <span className="num ml-1">({counts.byTab[key]})</span> : null}
          </button>
        ))}
      </div>

      <Panel className="s-head-body">
        {inbox.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : inbox.events.length === 0 ? (
          <EmptyState icon={Inbox}>{t(`bankSync.inbox.empty.${tab}`)}</EmptyState>
        ) : (
          <ul className="divide-y divide-divider">
            {inbox.events.map((event) => {
              const signed = signedEventAmount(event)
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 text-left"
                    onClick={() => setSelected(event)}
                  >
                    <div className="min-w-0">
                      <p className="truncate t-body-sm font-medium text-ink">
                        {event.providerCode
                          ? t(`bankSync.providers.${event.providerCode}`)
                          : event.appName}
                        {' · '}
                        <span className="num">
                          {event.last4
                            ? t('bankSync.sources.account', { last4: event.last4 })
                            : t('bankSync.inbox.noAccount')}
                        </span>
                      </p>
                      <StatusChip
                        tone={event.status === 'FAILED' ? 'alert' : 'attention'}
                        className="mt-1"
                      >
                        {reasonText(t, event.statusReason)}
                      </StatusChip>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'num t-body-sm font-medium',
                          signed !== null && signed > 0 ? 'text-positive-ink' : 'text-ink',
                        )}
                      >
                        {signed === null ? '—' : formatVndSigned(signed)}
                      </p>
                      <p className="num t-caption text-ink3">
                        {new Date(eventTime(event)).toLocaleString('vi-VN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {inbox.hasMore ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3"
            disabled={inbox.isLoadingMore}
            onClick={inbox.loadMore}
          >
            {t('bankSync.inbox.loadMore')}
          </Button>
        ) : null}
      </Panel>

      <EventDetailDialog
        event={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        walletOptions={walletOptions}
        onPost={inbox.post}
        onIgnore={inbox.ignore}
        onReparse={inbox.reparse}
        busy={inbox.isResolving || inbox.isReparsing}
      />
    </div>
  )
}
