import {
  Controller,
  type UseFormReturn,
  type UseFormSetValue,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  EventField,
  EventDecimalInput,
  EventFieldInput,
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
import { ComputedPreview } from '@/features/assets/ui/components/computed-preview'
import { modeSuffix, type AssetForm } from '@/features/assets/model/assets-form'
import {
  assetTypeOrder,
  defaultLiquidityForType,
  liquidityOrder,
  type AssetType,
  type ValuationMode,
} from '@/features/assets/model/assets'

type WalletOption = { value: string; label: string }

type AssetFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<AssetForm>
  setValue: UseFormSetValue<AssetForm>
  mode: ValuationMode
  previewValue: number | null
  walletOptions: WalletOption[]
  isEditing: boolean
  isSubmitting: boolean
  onSubmit: () => void
}

export function AssetFormDialog({
  open,
  onOpenChange,
  form,
  setValue,
  mode,
  previewValue,
  walletOptions,
  isEditing,
  isSubmitting,
  onSubmit,
}: AssetFormDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    watch,
    formState: { errors, isValid },
  } = form
  const isSaving = watch('type') === 'saving_deposit'
  const isRealEstate = watch('type') === 'real_estate'
  const interestDestination = watch('interestDestination')

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[90dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <ResponsiveDialogHeader className="px-6 pt-6 sm:px-8 sm:pt-7">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            {isEditing ? t('assets.form.editEyebrow') : t('assets.form.eyebrow')}
          </p>
          <ResponsiveDialogTitle className="text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">
            {isEditing ? t('assets.form.editTitle') : t('assets.form.title')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[15px] leading-6">
            {t('assets.form.help')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="grid min-h-0 min-w-0 grid-rows-[1fr_auto]" onSubmit={onSubmit} noValidate>
          <div className="min-h-0 space-y-4 overflow-y-auto overflow-x-hidden px-6 pb-2 pt-6 sm:px-8">
            {mode === 'manual' ? (
              <div className={isRealEstate ? 'grid gap-4 sm:grid-cols-2' : undefined}>
                <EventField
                  label={t('assets.form.value')}
                  error={errors.value?.message}
                  trailing={<span className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">₫</span>}
                >
                  <Controller control={control} name="value" render={({ field }) => (
                    <EventMoneyInput placeholder="0" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                  )} />
                </EventField>
                {isRealEstate ? (
                  <EventField label={t('assets.form.areaSqm')} error={errors.areaSqm?.message} trailing={<span className="text-base font-semibold text-[hsl(var(--muted-foreground))]">m²</span>}>
                    <Controller control={control} name="areaSqm" render={({ field }) => (
                      <EventDecimalInput placeholder={t('assets.form.areaSqmPlaceholder')} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                    )} />
                  </EventField>
                ) : null}
              </div>
            ) : null}

            <EventField label={t('assets.form.name')} error={errors.name?.message}>
              <EventFieldInput
                placeholder={t('assets.form.namePlaceholder')}
                {...register('name')}
              />
            </EventField>

            <div className="grid gap-4 sm:grid-cols-2">
              <EventField label={t('assets.form.type')} error={errors.type?.message}>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(next) => {
                        const nextType = next as AssetType
                        field.onChange(nextType)
                        // App auto-picks liquidity for the chosen type (spec §34).
                        setValue('liquidity', defaultLiquidityForType(nextType), {
                          shouldValidate: true,
                        })
                      }}
                    >
                      <SelectTrigger className={eventSelectTriggerClass}>
                        <SelectValue placeholder={t('assets.form.typePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {assetTypeOrder.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`options.assetType.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </EventField>

              <EventField label={t('assets.form.group')} error={errors.liquidity?.message}>
                <Controller
                  control={control}
                  name="liquidity"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={eventSelectTriggerClass}>
                        <SelectValue placeholder={t('assets.form.groupPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {liquidityOrder.map((liquidity) => (
                          <SelectItem key={liquidity} value={liquidity}>
                            {t(`options.liquidity.${liquidity}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </EventField>
            </div>

            <div className="flex items-center gap-2 rounded-[18px] bg-[hsla(var(--accent),0.08)] px-4 py-3 text-xs">
              <Badge className="bg-[hsla(var(--accent),0.15)] text-[hsl(var(--accent))]">
                {t(`options.valuationMode.${mode}`)}
              </Badge>
              <span className="text-[hsl(var(--muted-foreground))]">
                {t(`assets.form.mode${modeSuffix(mode)}`)}
              </span>
            </div>

            {mode === 'market_priced' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <EventField label={t('assets.form.symbol')} error={errors.symbol?.message}>
                    <EventFieldInput
                      placeholder={t('assets.form.symbolPlaceholder')}
                      {...register('symbol')}
                    />
                  </EventField>
                  <EventField label={t('assets.form.quantity')} error={errors.quantity?.message}>
                    <Controller
                      control={control}
                      name="quantity"
                      render={({ field }) => (
                        <EventDecimalInput
                          placeholder={t('assets.form.quantityPlaceholder')}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </EventField>
                  <EventField label={t('assets.form.unit')} error={errors.unit?.message}>
                    <EventFieldInput
                      placeholder={t('assets.form.unitPlaceholder')}
                      {...register('unit')}
                    />
                  </EventField>
                </div>
                <EventField
                  label={t('assets.form.purchasePrice')}
                  error={errors.purchasePrice?.message}
                  trailing={
                    <span className="text-base font-semibold text-[hsl(var(--muted-foreground))]">₫</span>
                  }
                >
                  <Controller
                    control={control}
                    name="purchasePrice"
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
                <ComputedPreview value={previewValue} />
              </>
            ) : null}

            {mode === 'formula_calculated' ? (
              <>
                <EventField
                  label={t('assets.form.principal')}
                  error={errors.principal?.message}
                  trailing={
                    <span className="text-base font-semibold text-[hsl(var(--muted-foreground))]">₫</span>
                  }
                >
                  <Controller
                    control={control}
                    name="principal"
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <EventField
                    label={t('assets.form.interestRate')}
                    error={errors.interestRate?.message}
                  >
                    <Controller
                      control={control}
                      name="interestRate"
                      render={({ field }) => (
                        <EventDecimalInput
                          placeholder={t('assets.form.interestRatePlaceholder')}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </EventField>
                  <EventField
                    label={t('assets.form.interestPayment')}
                    error={errors.interestPayment?.message}
                  >
                    <Controller
                      control={control}
                      name="interestPayment"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={eventSelectTriggerClass}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="end_of_term">
                              {t('options.interestPayment.end_of_term')}
                            </SelectItem>
                            <SelectItem value="monthly">
                              {t('options.interestPayment.monthly')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </EventField>
                </div>
                {isSaving ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <EventField
                      label={t('assets.form.nonTermRate')}
                      error={errors.nonTermRate?.message}
                    >
                      <Controller
                        control={control}
                        name="nonTermRate"
                        render={({ field }) => (
                          <EventDecimalInput
                            placeholder={t('assets.form.nonTermRatePlaceholder')}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </EventField>
                    <EventField
                      label={t('assets.form.interestDestination')}
                      error={errors.interestDestination?.message}
                    >
                      <Controller
                        control={control}
                        name="interestDestination"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={eventSelectTriggerClass}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="principal">
                                {t('options.interestDestination.principal')}
                              </SelectItem>
                              <SelectItem value="wallet">
                                {t('options.interestDestination.wallet')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </EventField>
                  </div>
                ) : null}
                {isSaving && interestDestination === 'wallet' ? (
                  <EventField
                    label={t('assets.form.receivingWallet')}
                    error={errors.receivingWalletId?.message}
                  >
                    <Controller
                      control={control}
                      name="receivingWalletId"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={eventSelectTriggerClass}>
                            <SelectValue
                              placeholder={t('assets.form.receivingWalletPlaceholder')}
                            />
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
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <EventField label={t('assets.form.startDate')} error={errors.startDate?.message}>
                    <Controller
                      control={control}
                      name="startDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          className={eventDateTriggerClass}
                        />
                      )}
                    />
                  </EventField>
                  <EventField
                    label={t('assets.form.maturityDate')}
                    error={errors.maturityDate?.message}
                  >
                    <Controller
                      control={control}
                      name="maturityDate"
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
                <ComputedPreview value={previewValue} />
              </>
            ) : null}

            <EventField label={t('assets.form.note')} error={errors.note?.message}>
              <EventFieldTextarea
                rows={3}
                placeholder={t('assets.form.notePlaceholder')}
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
                ? 'Đang lưu...'
                : isEditing
                  ? t('assets.form.save')
                  : t('assets.form.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
