import { useTranslation } from 'react-i18next'

import { StatusChip } from '@/components/ui/status-chip'
import {
  eventTime,
  reasonText,
  signedEventAmount,
} from '@money-space/core/features/bank-sync/model/bank-sync'
import type { BankNotificationEvent } from '@money-space/core/features/bank-sync/model/bank-sync.types'
import { formatVndSigned } from '@money-space/core/shared/lib/format-money'
import { cn } from '@money-space/core/shared/lib/utils'

export function BankEventRow({
  event,
  onSelect,
}: {
  event: BankNotificationEvent
  onSelect: (event: BankNotificationEvent) => void
}) {
  const { t } = useTranslation()
  const signed = signedEventAmount(event)
  return (
    <button
      type="button"
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 text-left"
      onClick={() => onSelect(event)}
    >
      <div className="min-w-0">
        <p className="truncate t-body-sm font-medium text-ink">
          {event.providerCode ? t(`bankSync.providers.${event.providerCode}`) : event.appName}
          {' · '}
          <span className="num">
            {event.last4
              ? t('bankSync.sources.account', { last4: event.last4 })
              : t('bankSync.inbox.noAccount')}
          </span>
        </p>
        <StatusChip tone={event.status === 'FAILED' ? 'alert' : 'attention'} className="mt-1">
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
  )
}
