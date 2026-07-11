import { HandCoins } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { DecimalInput, MoneyInput } from '@/components/ui/number-input'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
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
import { AS_OF } from '@/features/assets/model/assets-form'
import type { AssetSaleForm } from '@/features/assets/model/asset-sale-form'
import { computeCurrentValue, type Asset } from '@/features/assets/model/assets'
import { formatVndShort } from '@/shared/lib/format-money'

type Option = { value: string; label: string }

type AssetSaleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
  asOf: string
  form: UseFormReturn<AssetSaleForm>
  walletOptions: Option[]
  isMarketAsset: boolean
  currentQuantity: number
  previewNet: number
  isSubmitting: boolean
  onSubmit: () => void
}

export function AssetSaleDialog({
  open,
  onOpenChange,
  asset,
  asOf,
  form,
  walletOptions,
  isMarketAsset,
  currentQuantity,
  previewNet,
  isSubmitting,
  onSubmit,
}: AssetSaleDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = form

  const sellAll = watch('sellAll')
  const holdingLabel = asset
    ? isMarketAsset
      ? t('assets.sale.holdingQuantity', {
          quantity: currentQuantity,
          unit: asset.marketPosition?.unit ?? '',
        })
      : t('assets.sale.holdingValue', {
          value: formatVndShort(computeCurrentValue(asset, asOf || AS_OF) ?? 0),
        })
    : ''

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t('assets.sale.title')}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {asset ? `${asset.name} · ${holdingLabel}` : t('assets.sale.eyebrow')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {isMarketAsset ? (
            <FormField label={t('assets.sale.quantity')} error={errors.quantity?.message}>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <DecimalInput
                    placeholder={t('assets.sale.quantityPlaceholder')}
                    aria-invalid={!!errors.quantity}
                    disabled={sellAll}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <label className="mt-2 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Controller
                  control={control}
                  name="sellAll"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => {
                        const next = event.target.checked
                        field.onChange(next)
                        if (next) setValue('quantity', '', { shouldValidate: true })
                      }}
                    />
                  )}
                />
                {t('assets.sale.sellAll')}
              </label>
            </FormField>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('assets.sale.proceeds')} error={errors.proceeds?.message}>
              <Controller
                control={control}
                name="proceeds"
                render={({ field }) => (
                  <MoneyInput
                    placeholder={t('assets.sale.proceedsPlaceholder')}
                    aria-invalid={!!errors.proceeds}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>

            <FormField label={t('assets.sale.fee')} error={errors.fee?.message}>
              <Controller
                control={control}
                name="fee"
                render={({ field }) => (
                  <MoneyInput
                    placeholder={t('assets.sale.feePlaceholder')}
                    aria-invalid={!!errors.fee}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-[hsla(var(--accent),0.08)] px-4 py-3 text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">
              {t('assets.sale.receivedNet')}
            </span>
            <span className="money-number text-lg font-semibold text-[hsl(var(--accent))]">
              {formatVndShort(previewNet)}
            </span>
          </div>

          <FormField label={t('assets.sale.receiveInto')} error={errors.toAssetId?.message}>
            <Controller
              control={control}
              name="toAssetId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.toAssetId}>
                    <SelectValue placeholder={t('assets.sale.receiveIntoPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {walletOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('assets.sale.date')} error={errors.date?.message}>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>

            <FormField label={t('assets.sale.note')} error={errors.note?.message}>
              <Input
                placeholder={t('assets.sale.notePlaceholder')}
                aria-invalid={!!errors.note}
                {...register('note')}
              />
            </FormField>
          </div>

          <ResponsiveDialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              <HandCoins className="mr-2 size-4" />
              {isSubmitting ? t('assets.sale.submitting') : t('assets.sale.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
