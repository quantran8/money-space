import { Plus } from 'lucide-react'
import {
  Controller,
  type UseFormReturn,
  type UseFormSetValue,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { ComputedPreview } from '@/features/assets/ui/components/computed-preview'
import { modeSuffix, type AssetForm } from '@/features/assets/model/assets-form'
import {
  assetTypeOrder,
  defaultLiquidityForType,
  liquidityOrder,
  type AssetType,
  type ValuationMode,
} from '@/features/assets/model/assets'

type AssetFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<AssetForm>
  setValue: UseFormSetValue<AssetForm>
  mode: ValuationMode
  previewValue: number | null
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
  isSubmitting,
  onSubmit,
}: AssetFormDialogProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    formState: { errors, isValid },
  } = form

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t('assets.form.title')}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t('assets.form.eyebrow')}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <FormField label={t('assets.form.name')} error={errors.name?.message}>
            <Input
              placeholder={t('assets.form.namePlaceholder')}
              aria-invalid={!!errors.name}
              {...register('name')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('assets.form.type')} error={errors.type?.message}>
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
                    <SelectTrigger aria-invalid={!!errors.type}>
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
            </FormField>

            <FormField label={t('assets.form.group')} error={errors.liquidity?.message}>
              <Controller
                control={control}
                name="liquidity"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.liquidity}>
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
            </FormField>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-[hsla(var(--accent),0.08)] px-3 py-2 text-xs">
            <Badge className="bg-[hsla(var(--accent),0.15)] text-[hsl(var(--accent))]">
              {t(`options.valuationMode.${mode}`)}
            </Badge>
            <span className="text-[hsl(var(--muted-foreground))]">
              {t(`assets.form.mode${modeSuffix(mode)}`)}
            </span>
          </div>

          {mode === 'manual' ? (
            <FormField label={t('assets.form.value')} error={errors.value?.message}>
              <Controller
                control={control}
                name="value"
                render={({ field }) => (
                  <MoneyInput
                    placeholder={t('assets.form.valuePlaceholder')}
                    aria-invalid={!!errors.value}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>
          ) : null}

          {mode === 'market_priced' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label={t('assets.form.symbol')} error={errors.symbol?.message}>
                  <Input
                    placeholder={t('assets.form.symbolPlaceholder')}
                    aria-invalid={!!errors.symbol}
                    {...register('symbol')}
                  />
                </FormField>
                <FormField label={t('assets.form.quantity')} error={errors.quantity?.message}>
                  <Controller
                    control={control}
                    name="quantity"
                    render={({ field }) => (
                      <DecimalInput
                        placeholder={t('assets.form.quantityPlaceholder')}
                        aria-invalid={!!errors.quantity}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </FormField>
                <FormField label={t('assets.form.unit')} error={errors.unit?.message}>
                  <Input
                    placeholder={t('assets.form.unitPlaceholder')}
                    aria-invalid={!!errors.unit}
                    {...register('unit')}
                  />
                </FormField>
              </div>
              <ComputedPreview value={previewValue} />
            </>
          ) : null}

          {mode === 'formula_calculated' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('assets.form.principal')} error={errors.principal?.message}>
                  <Controller
                    control={control}
                    name="principal"
                    render={({ field }) => (
                      <MoneyInput
                        placeholder={t('assets.form.principalPlaceholder')}
                        aria-invalid={!!errors.principal}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </FormField>
                <FormField
                  label={t('assets.form.interestRate')}
                  error={errors.interestRate?.message}
                >
                  <Controller
                    control={control}
                    name="interestRate"
                    render={({ field }) => (
                      <DecimalInput
                        placeholder={t('assets.form.interestRatePlaceholder')}
                        aria-invalid={!!errors.interestRate}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('assets.form.startDate')} error={errors.startDate?.message}>
                  <Controller
                    control={control}
                    name="startDate"
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </FormField>
                <FormField
                  label={t('assets.form.maturityDate')}
                  error={errors.maturityDate?.message}
                >
                  <Controller
                    control={control}
                    name="maturityDate"
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </FormField>
              </div>
              <ComputedPreview value={previewValue} />
            </>
          ) : null}

          <FormField label={t('assets.form.note')} error={errors.note?.message}>
            <Input
              placeholder={t('assets.form.notePlaceholder')}
              aria-invalid={!!errors.note}
              {...register('note')}
            />
          </FormField>

          <ResponsiveDialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              <Plus className="mr-2 size-4" />
              {isSubmitting ? 'Dang luu...' : t('assets.form.submit')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
