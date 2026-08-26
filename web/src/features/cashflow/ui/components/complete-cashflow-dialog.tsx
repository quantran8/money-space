import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, fieldControlReset, fieldShell } from '@/components/ui/form-22'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { canSettleCashflow } from '@money-space/core/features/assets/model/assets'
import type { Asset } from '@money-space/core/features/assets/model/assets.types'
import { formatVndScale } from '@money-space/core/shared/lib/format-money'

/**
 * "Which wallet did this money move through?" — asked when confirming a
 * cashflow event.
 *
 * This exists because confirming without a wallet was silently a no-op: the
 * money event got written, but the debit and credit both had nothing to act on,
 * so the household confirmed "lương 20tr" and every balance stayed exactly
 * where it was. The backend now rejects that, and this is where the answer is
 * collected.
 *
 * Only assets that can actually settle are offered (`canSettleCashflow`):
 * flexible money, and a type that holds a spendable balance. Offering a gold
 * bar here would just surface a 400 the household cannot act on.
 *
 * The event may already carry a wallet chosen when it was created — that is
 * pre-selected, so the common case is one tap.
 */
export function CompleteCashflowDialog({
  open,
  onOpenChange,
  eventName,
  amount,
  direction,
  defaultAssetId,
  assets,
  isSubmitting = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventName: string
  amount: number
  direction: 'incoming' | 'outgoing'
  /** The wallet stored on the event, when it has one. */
  defaultAssetId?: string | null
  assets: Asset[]
  isSubmitting?: boolean
  onConfirm: (assetId: string) => void
}) {
  const { t } = useTranslation()

  const options = React.useMemo(() => assets.filter(canSettleCashflow), [assets])

  // Seeded once per mount rather than synced in an effect. The caller renders
  // this only while an occurrence is being confirmed, so a new occurrence is a
  // new mount — there is no stale selection to carry over.
  const [assetId, setAssetId] = React.useState<string>(() => {
    const stored = defaultAssetId ?? ''
    return options.some((asset) => asset.id === stored) ? stored : ''
  })

  const hasOptions = options.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-4">
        <DialogHeader>
          <DialogTitle className="t-subhead">
            {t('upcoming.complete.title')}
          </DialogTitle>
          <DialogDescription>
            {t('upcoming.complete.description', {
              name: eventName,
              amount: formatVndScale(amount),
            })}
          </DialogDescription>
        </DialogHeader>

        {hasOptions ? (
          <Field
            label={t(
              direction === 'incoming'
                ? 'upcoming.complete.walletIn'
                : 'upcoming.complete.walletOut',
            )}
          >
            <div className={fieldShell}>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger className={fieldControlReset}>
                  <SelectValue placeholder={t('upcoming.complete.walletPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Field>
        ) : (
          // Nothing can settle this. Say why rather than showing an empty
          // dropdown the household would read as a bug.
          <p className="rounded-[10px] bg-attention-tint px-4 py-3 t-body-sm leading-5 text-ink2">
            {t('upcoming.complete.noWallet')}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            disabled={!assetId || isSubmitting}
            onClick={() => onConfirm(assetId)}
          >
            {isSubmitting
              ? t('upcoming.complete.submitting')
              : t('upcoming.complete.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
