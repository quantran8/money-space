import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  EventField,
  EventDecimalInput,
  EventFieldTextarea,
  EventMoneyInput,
  eventDateTriggerClass,
  eventSelectTriggerClass,
} from '@/components/ui/event-field'
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
import { Switch } from '@/components/ui/switch'
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
  isEditing?: boolean
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
  isEditing = false,
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
          unit: asset.type === 'real_estate' ? 'm²' : (asset.marketPosition?.unit ?? ''),
        })
      : t('assets.sale.holdingValue', {
          value: formatVndShort(computeCurrentValue(asset, asOf || AS_OF) ?? 0),
        })
    : ''

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[90dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            {t('assets.sale.action')}
          </p>
          <ResponsiveDialogTitle className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">
            {isEditing ? t('assets.sale.editTitle') : t('assets.sale.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            {asset ? `${asset.name} · ${holdingLabel}` : t('assets.sale.eyebrow')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="grid min-h-0 min-w-0 grid-rows-[1fr_auto]" onSubmit={onSubmit} noValidate>
          <div className="min-h-0 space-y-4 overflow-y-auto overflow-x-hidden px-6 pb-2 pt-6 sm:px-8">
            {/* Hero proceeds field */}
            <EventField
              label={t('assets.sale.proceeds')}
              error={errors.proceeds?.message}
              trailing={
                <span className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">₫</span>
              }
            >
              <Controller
                control={control}
                name="proceeds"
                render={({ field }) => (
                  <EventMoneyInput
                    placeholder="0"
                    disabled={isMarketAsset}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </EventField>

            {isMarketAsset ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <EventField label={asset?.type === 'real_estate' ? t('assets.sale.areaSqm') : t('assets.sale.quantity')} error={errors.quantity?.message} trailing={asset?.type === 'real_estate' ? <span className="text-base font-semibold text-[hsl(var(--muted-foreground))]">m²</span> : undefined}>
                    <Controller control={control} name="quantity" render={({ field }) => (
                      <EventDecimalInput placeholder={t('assets.sale.quantityPlaceholder')} disabled={sellAll} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                    )} />
                  </EventField>
                  <EventField label={asset?.type === 'real_estate' ? t('assets.sale.pricePerSqm') : t('assets.sale.unitPrice')} error={errors.unitPrice?.message} trailing={<span className="text-base font-semibold text-[hsl(var(--muted-foreground))]">₫</span>}>
                    <Controller control={control} name="unitPrice" render={({ field }) => (
                      <EventMoneyInput placeholder="0" className="text-[22px] sm:text-[24px]" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                    )} />
                  </EventField>
                </div>

                {currentQuantity > 0 ? <div className="flex items-center justify-between rounded-[18px] bg-[hsl(var(--muted))] px-5 py-4">
                  <p className="text-[15px] font-medium text-foreground">
                    {t('assets.sale.sellAll')}
                  </p>
                  <Controller
                    control={control}
                    name="sellAll"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(next) => {
                          field.onChange(next)
                          if (next) setValue('quantity', '', { shouldValidate: true })
                        }}
                      />
                    )}
                  />
                </div> : null}
              </>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <EventField
                label={t('assets.sale.fee')}
                error={errors.fee?.message}
                trailing={
                  <span className="text-base font-semibold text-[hsl(var(--muted-foreground))]">₫</span>
                }
              >
                <Controller
                  control={control}
                  name="fee"
                  render={({ field }) => (
                    <EventMoneyInput
                      placeholder="0"
                      className="text-[22px] sm:text-[24px]"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </EventField>

              <EventField label={t('assets.sale.date')} error={errors.date?.message}>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      className={eventDateTriggerClass}
                    />
                  )}
                />
              </EventField>
            </div>

            <div className="flex items-center justify-between rounded-[18px] bg-[hsla(var(--accent),0.08)] px-5 py-4 text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">
                {t('assets.sale.receivedNet')}
              </span>
              <span className="money-number text-lg font-semibold text-[hsl(var(--accent))]">
                {formatVndShort(previewNet)}
              </span>
            </div>

            <EventField label={t('assets.sale.receiveInto')} error={errors.toAssetId?.message}>
              <Controller
                control={control}
                name="toAssetId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={eventSelectTriggerClass}>
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
            </EventField>

            <EventField label={t('assets.sale.note')} error={errors.note?.message}>
              <EventFieldTextarea
                rows={3}
                placeholder={t('assets.sale.notePlaceholder')}
                {...register('note')}
              />
            </EventField>
          </div>

          <ResponsiveDialogFooter className="border-t border-black/[0.06] px-6 py-4 sm:px-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-foreground hover:bg-[hsl(var(--muted))]"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-[hsl(var(--accent))] px-6 text-white hover:bg-[hsl(var(--accent))]/90"
            >
              {isSubmitting
                ? t('assets.sale.submitting')
                : isEditing
                  ? t('assets.sale.submitEdit')
                  : t('assets.sale.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
