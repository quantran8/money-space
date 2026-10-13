import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  eventTime,
  reasonText,
  signedEventAmount,
} from '@money-space/core/features/bank-sync/model/bank-sync'
import type { BankNotificationEvent } from '@money-space/core/features/bank-sync/model/bank-sync.types'
import { formatVndExact, formatVndSigned } from '@money-space/core/shared/lib/format-money'

const NO_LINK = '__none'

type Props = {
  event: BankNotificationEvent | null
  onOpenChange: (open: boolean) => void
  walletOptions: { value: string; label: string }[]
  cashflowOptions: { value: string; label: string; direction: 'incoming' | 'outgoing' }[]
  onPost: (id: string, assetId?: string, cashflowEventId?: string) => Promise<unknown>
  onReplaceManual: (id: string, cashflowEventId: string, assetId?: string) => Promise<unknown>
  onIgnore: (id: string) => Promise<unknown>
  onReparse: (id: string) => Promise<unknown>
  busy: boolean
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="t-body-sm text-ink2">{label}</dt>
      <dd className="text-right t-body-sm text-ink">{children}</dd>
    </div>
  )
}

export function EventDetailDialog(props: Props) {
  if (!props.event) return null
  // Keyed so the wallet choice resets per event.
  return <EventDetail key={props.event.id} {...props} event={props.event} />
}

function EventDetail({
  event,
  onOpenChange,
  walletOptions,
  cashflowOptions,
  onPost,
  onReplaceManual,
  onIgnore,
  onReparse,
  busy,
}: Props & { event: BankNotificationEvent }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [assetId, setAssetId] = useState<string | undefined>(event.matchedAssetId ?? undefined)
  const signed = signedEventAmount(event)
  const canPost = signed !== null && !!assetId
  const close = () => onOpenChange(false)

  // Note-rule suggestion is pre-selected only when unique. See backend memory/cashflow-settlement.md.
  const suggested =
    event.matchStatus === 'matched' || event.matchStatus === 'replace_manual'
      ? (event.suggestedCashflowEventId ?? undefined)
      : undefined
  const [cashflowEventId, setCashflowEventId] = useState<string>(suggested ?? NO_LINK)
  const linkTo = cashflowEventId === NO_LINK ? undefined : cashflowEventId
  const eventDirection = event.direction === 'IN' ? 'incoming' : 'outgoing'
  const linkOptions = cashflowOptions.filter((o) => o.direction === eventDirection)
  const linkLabel = linkOptions.find((o) => o.value === linkTo)?.label
  const replacing = event.matchStatus === 'replace_manual' && !!linkTo && linkTo === suggested

  return (
    <ResponsiveDialog open onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-[520px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t('bankSync.inbox.detail.title')}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{reasonText(t, event.statusReason)}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <dl className="mt-4 divide-y divide-divider">
          <Row label={t('bankSync.inbox.detail.amount')}>
            <span className="num">
              {signed === null ? t('bankSync.inbox.unknownAmount') : formatVndSigned(signed)}
            </span>
          </Row>
          <Row label={t('bankSync.inbox.detail.account')}>
            {event.providerCode ? `${t(`bankSync.providers.${event.providerCode}`)} · ` : ''}
            <span className="num">
              {event.last4
                ? t('bankSync.sources.account', { last4: event.last4 })
                : t('bankSync.inbox.noAccount')}
            </span>
          </Row>
          {event.reportedBalance !== null ? (
            <Row label={t('bankSync.inbox.detail.balance')}>
              <span className="num">{formatVndExact(event.reportedBalance)}</span>
            </Row>
          ) : null}
          {event.note ? (
            <Row label={t('settlement.inbox.note')}>{event.note}</Row>
          ) : null}
          <Row label={t('bankSync.inbox.detail.time')}>
            <span className="num">{new Date(eventTime(event)).toLocaleString('vi-VN')}</span>
            {event.timeSource ? (
              <span className="block t-caption text-ink3">
                {t(`bankSync.inbox.timeSource.${event.timeSource}`)}
              </span>
            ) : null}
          </Row>
        </dl>

        {signed === null ? (
          <p className="mt-4 t-body-sm text-ink2">{t('bankSync.inbox.detail.manualHint')}</p>
        ) : (
          <div className="mt-4">
            <p className="label mb-2">{t('bankSync.inbox.detail.wallet')}</p>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger>
                <SelectValue placeholder={t('bankSync.inbox.detail.walletPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {walletOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {signed !== null && linkOptions.length > 0 ? (
          <div className="mt-4">
            <p className="label mb-2">{t('settlement.inbox.linkTo')}</p>
            <Select value={cashflowEventId} onValueChange={setCashflowEventId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_LINK}>{t('settlement.inbox.noLink')}</SelectItem>
                {linkOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 t-caption text-ink2">
              {event.matchStatus === 'ambiguous'
                ? t('settlement.inbox.ambiguous')
                : replacing
                  ? t('settlement.inbox.replaceManual', { name: linkLabel })
                  : linkTo && linkTo === suggested
                    ? t('settlement.inbox.suggestion', { name: linkLabel })
                    : null}
            </p>
          </div>
        ) : null}

        {!event.canReparse ? (
          <p className="mt-3 t-caption text-ink3">{t('bankSync.inbox.detail.noRaw')}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {event.status === 'UNMAPPED' && event.last4 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/settings/bank-sync?add=1')}
            >
              {t('bankSync.inbox.detail.linkAccount')}
            </Button>
          ) : null}
          {event.canReparse ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => void onReparse(event.id).then(close)}
            >
              {t('bankSync.inbox.detail.reparse')}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void onIgnore(event.id).then(close)}
          >
            {t('bankSync.inbox.detail.ignore')}
          </Button>
          {signed !== null ? (
            <Button
              type="button"
              disabled={busy || !canPost}
              onClick={() =>
                void (replacing
                  ? onReplaceManual(event.id, linkTo, assetId)
                  : onPost(event.id, assetId, linkTo)
                ).then(close)
              }
            >
              {replacing
                ? t('settlement.inbox.replace')
                : linkLabel
                  ? t('settlement.inbox.postAndLink', { name: linkLabel })
                  : t('bankSync.inbox.detail.post')}
            </Button>
          ) : null}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
