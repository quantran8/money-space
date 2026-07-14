import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { EventField, EventMoneyInput } from '@/components/ui/event-field'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { useAssets } from '@/features/assets/hooks/use-assets'
import type { Asset } from '@/features/assets/model/assets'
import { getErrorMessage } from '@/shared/lib/get-error-message'

type AssetPriceUpdateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset
}

function currentRawPrice(asset: Asset): string {
  const value =
    asset.type === 'bond'
      ? asset.calculationTerm?.principalAmount
      : (asset.marketPosition?.lastPrice ?? asset.marketPosition?.purchasePrice)
  return typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value)) : ''
}

export function AssetPriceUpdateDialog({
  open,
  onOpenChange,
  asset,
}: AssetPriceUpdateDialogProps) {
  const { t } = useTranslation()
  const { updateAsset } = useAssets()
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')
  const isBond = asset.type === 'bond'

  useEffect(() => {
    if (!open) return
    setPrice(currentRawPrice(asset))
    setError('')
  }, [open, asset])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextPrice = Number(price)
    if (!price || !Number.isFinite(nextPrice) || nextPrice <= 0) {
      setError(t('validation.invalidMoney'))
      return
    }

    try {
      if (isBond && asset.calculationTerm) {
        await updateAsset.mutateAsync({
          assetId: asset.id,
          payload: {
            calculationTerm: {
              ...asset.calculationTerm,
              principalAmount: nextPrice,
            },
          },
        })
      } else if (asset.marketPosition) {
        await updateAsset.mutateAsync({
          assetId: asset.id,
          payload: {
            marketPosition: {
              ...asset.marketPosition,
              lastPrice: nextPrice,
              lastPriceAt: new Date().toISOString(),
            },
          },
        })
      } else {
        setError(t('assets.priceUpdate.unavailable'))
        return
      }
      toast.success(t('assets.priceUpdate.success'))
      onOpenChange(false)
    } catch (caught) {
      toast.error(getErrorMessage(caught, t('assets.priceUpdate.failed')))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="p-0 sm:max-w-[500px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <ResponsiveDialogTitle className="text-[28px] font-semibold tracking-[-0.035em]">
            {t('assets.priceUpdate.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            {t(isBond ? 'assets.priceUpdate.bondHelp' : 'assets.priceUpdate.marketHelp', {
              name: asset.name,
              unit: asset.marketPosition?.unit ?? '',
            })}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={submit} noValidate>
          <div className="px-6 py-6 sm:px-8">
            <EventField
              label={t(isBond ? 'assets.priceUpdate.bondValue' : 'assets.priceUpdate.unitPrice')}
              error={error}
              trailing={
                <span className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">₫</span>
              }
            >
              <EventMoneyInput value={price} onChange={(value) => { setPrice(value); setError('') }} placeholder="0" />
            </EventField>
          </div>
          <ResponsiveDialogFooter className="border-t border-black/[0.06] px-6 py-4 sm:px-8">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={updateAsset.isPending}>
              {updateAsset.isPending ? t('assets.priceUpdate.submitting') : t('assets.priceUpdate.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
