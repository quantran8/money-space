import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@money-space/core/shared/lib/utils'
import type { Asset } from '@money-space/core/features/assets/model/assets.types'
import type { CashflowLinkCandidate } from '@money-space/core/features/cashflow/api/cashflow-events.repository'
import {
  useCashflowSettlementActions,
  useCashflowSettlements,
  useLinkCandidates,
} from '@money-space/core/features/cashflow/hooks/use-cashflow-settlement'
import type { CashflowEvent } from '@money-space/core/features/cashflow/model/cashflow.types'
import type { MemberItem } from '@money-space/core/features/members/model/members.types'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { notify } from '@money-space/core/shared/notify'

// Event-first manual link. See backend memory/cashflow-settlement.md.
export function LinkBankTransactionDialog({
  event,
  assets,
  members,
  onOpenChange,
  onCompleteManually,
}: {
  event: CashflowEvent
  assets: Asset[]
  members: MemberItem[]
  onOpenChange: (open: boolean) => void
  onCompleteManually: () => void
}) {
  const { t } = useTranslation()
  const [query, setQuery] = React.useState('')
  const [debounced, setDebounced] = React.useState('')
  const [selected, setSelected] = React.useState<CashflowLinkCandidate | null>(null)
  const [unlinking, setUnlinking] = React.useState<string | null>(null)

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(id)
  }, [query])

  const candidates = useLinkCandidates(event.id, debounced)
  const settlements = useCashflowSettlements(event.id)
  const actions = useCashflowSettlementActions()

  const assetName = (id: string | null) => assets.find((a) => a.id === id)?.name
  const memberName = (profileId: string | null) =>
    members.find((m) => m.profileId === profileId)?.name

  const latest = settlements.data?.[0]
  const canReplace =
    latest?.settledVia === 'manual_complete' && !latest.notificationEventId
  const bankWallet =
    selected?.kind === 'bank_event'
      ? (selected.assetId ?? event.settlementAssetId ?? undefined)
      : undefined
  const missingWallet = selected?.kind === 'bank_event' && !bankWallet
  const isSubmitting =
    actions.link.isPending ||
    actions.replaceManual.isPending ||
    actions.postBankAndLink.isPending

  const submit = async (replaceManual: boolean) => {
    if (!selected) return
    try {
      if (selected.kind === 'bank_event') {
        await actions.postBankAndLink.mutateAsync({
          bankEventId: selected.id,
          eventId: event.id,
          assetId: bankWallet,
          replaceManual,
        })
      } else if (replaceManual) {
        await actions.replaceManual.mutateAsync({ eventId: event.id, moneyEventId: selected.id })
      } else {
        await actions.link.mutateAsync({ eventId: event.id, moneyEventId: selected.id })
      }
      notify.success(t('settlement.link.linked'))
      onOpenChange(false)
    } catch (error) {
      notify.error(getErrorMessage(error, t('settlement.link.failed')))
    }
  }

  const unlink = async () => {
    if (!unlinking) return
    try {
      await actions.unlink.mutateAsync({ eventId: event.id, moneyEventId: unlinking })
      notify.success(t('settlement.history.unlinked'))
      setUnlinking(null)
    } catch (error) {
      notify.error(getErrorMessage(error, t('settlement.history.unlinkFailed')))
    }
  }

  const rows = candidates.data ?? []

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg gap-4">
          <DialogHeader>
            <DialogTitle className="t-subhead">{t('settlement.link.title')}</DialogTitle>
            <DialogDescription>
              {t('settlement.link.description', {
                name: event.name,
                amount: formatVndScale(event.amount),
              })}
            </DialogDescription>
          </DialogHeader>

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('settlement.link.searchPlaceholder')}
          />

          <section className="space-y-2">
            <h3 className="t-caption font-medium text-ink3">
              {t('settlement.link.candidatesTitle')}
            </h3>
            {rows.length === 0 && !candidates.isLoading ? (
              <p className="t-body-sm leading-5 text-ink2">
                {t('settlement.link.empty')}
              </p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {rows.map((row) => {
                  const active = selected?.kind === row.kind && selected.id === row.id
                  return (
                    <li key={`${row.kind}:${row.id}`}>
                      <button
                        type="button"
                        onClick={() => setSelected(row)}
                        className={cn(
                          'grid w-full grid-cols-[1fr_auto] gap-x-3 rounded-control px-3 py-2 text-left transition-colors hover:bg-wash',
                          active && 'bg-wash ring-1 ring-interactive',
                        )}
                      >
                        <span className="truncate t-body-sm text-ink">
                          {row.note || t('settlement.link.noNote')}
                        </span>
                        <span className="num t-body-sm font-medium text-ink">
                          {formatVndScale(row.amount)}
                        </span>
                        <span className="t-caption text-ink3">
                          {formatDayMonth(row.date)}
                          {assetName(row.assetId) ? ` · ${assetName(row.assetId)}` : ''}
                        </span>
                        {row.kind === 'bank_event' ? (
                          <span className="t-caption text-attention-ink">
                            {t('settlement.link.inbox')}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {selected ? (
            <div className="space-y-1 border-t border-divider pt-3">
              <p className="num t-body-sm font-medium text-ink">
                {t('settlement.link.preview', {
                  expected: formatVndScale(event.amount),
                  actual: formatVndScale(selected.amount),
                })}
              </p>
              <p className="t-caption text-ink2">
                {missingWallet
                  ? t('settlement.link.noWallet')
                  : canReplace
                    ? t('settlement.link.replaceHint', {
                        date: formatDayMonth(latest.occurrenceDate),
                      })
                    : t('settlement.link.previewNote')}
              </p>
            </div>
          ) : null}

          <section className="space-y-2">
            <h3 className="t-caption font-medium text-ink3">{t('settlement.history.title')}</h3>
            {(settlements.data ?? []).length === 0 ? (
              <p className="t-body-sm text-ink3">{t('settlement.history.empty')}</p>
            ) : (
              <ul className="space-y-1">
                {(settlements.data ?? []).slice(0, 3).map((row, index) => (
                  <li
                    key={row.moneyEventId}
                    className="flex items-center justify-between gap-3 px-1 py-1"
                  >
                    <div className="min-w-0">
                      <p className="t-body-sm text-ink">
                        {formatDayMonth(row.occurrenceDate)} ·{' '}
                        <span className="num">{formatVndScale(row.amount)}</span>
                      </p>
                      <p className="truncate t-caption text-ink3">
                        {t(`settlement.history.via.${row.settledVia}`)}
                        {memberName(row.settledById)
                          ? ` ${t('settlement.history.by', { name: memberName(row.settledById) })}`
                          : ''}
                      </p>
                    </div>
                    {index === 0 && row.settledVia !== 'manual_complete' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setUnlinking(row.moneyEventId)}
                      >
                        {t('settlement.history.unlink')}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <DialogFooter className="-mx-6 mt-2 px-6 py-3">
            <Button type="button" variant="secondary" onClick={onCompleteManually}>
              {t('settlement.link.completeManually')}
            </Button>
            {canReplace ? (
              <Button
                type="button"
                variant="secondary"
                disabled={!selected || missingWallet || isSubmitting}
                onClick={() => void submit(true)}
              >
                {t('settlement.link.replaceSubmit')}
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={!selected || missingWallet || isSubmitting}
              onClick={() => void submit(false)}
            >
              {isSubmitting ? t('settlement.link.submitting') : t('settlement.link.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={unlinking !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinking(null)
        }}
        title={t('settlement.history.unlinkTitle')}
        description={t('settlement.history.unlinkDescription', {
          date: latest ? formatDayMonth(latest.occurrenceDate) : '',
        })}
        confirmLabel={t('settlement.history.unlink')}
        destructive
        onConfirm={unlink}
      />
    </>
  )
}

function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
