import { zodResolver } from '@hookform/resolvers/zod'
import { Landmark, Plus, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { AssetCompositionChart } from '@/features/assets/ui/asset-composition-chart'
import { AssetList } from '@/features/assets/ui/asset-list'
import { AssetTrendChart } from '@/features/assets/ui/asset-trend-chart'
import { PageHeader } from '@/app/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { MetricCell } from '@/components/ui/metric-cell'
import { SubSection } from '@/components/ui/sub-section'
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
import {
  assetClassForType,
  assetTypeOrder,
  calculationTypeForType,
  computeCurrentValue,
  defaultLiquidityForType,
  liquidityOrder,
  valuationModeForType,
  type Asset,
  type AssetLiquidity,
  type AssetType,
  type ValuationMode,
} from '@/features/assets/model/assets'
import { useAssets } from '@/features/assets/hooks/use-assets'
import { formatVndShort } from '@/shared/lib/format-money'
import { localizedOptionalText, localizedRequiredText } from '@/shared/lib/validation'

const AS_OF = '2026-07-06'

type AssetForm = {
  name: string
  type: AssetType
  liquidity: AssetLiquidity
  note: string
  // manual
  value: string
  // market-priced
  symbol: string
  quantity: string
  unit: string
  // formula-calculated
  principal: string
  interestRate: string
  startDate: string
  maturityDate: string
}

const defaultValues: AssetForm = {
  name: '',
  type: 'cash',
  liquidity: 'usable_now',
  note: '',
  value: '',
  symbol: '',
  quantity: '',
  unit: '',
  principal: '',
  interestRate: '',
  startDate: AS_OF,
  maturityDate: '',
}

/** Parse a "20M" / "1,8M" / "500K" / plain number string into VND. */
function parseMoneyToVnd(raw: string): number {
  const normalized = raw.trim().replace(/,/g, '.')
  const match = normalized.match(/^(-?\d+(?:\.\d+)?)\s*([kKmMbB]?)$/)
  if (!match) return NaN
  const base = Number(match[1])
  const suffix = match[2].toLowerCase()
  const factor =
    suffix === 'k' ? 1_000 : suffix === 'm' ? 1_000_000 : suffix === 'b' ? 1_000_000_000 : 1
  return base * factor
}

/** Build an Asset from raw form values, or null if inputs are incomplete. */
function toAsset(id: string, values: AssetForm): Asset | null {
  const mode = valuationModeForType(values.type)
  const base = {
    id,
    name: values.name.trim(),
    type: values.type,
    liquidity: values.liquidity,
    currency: 'VND',
    note: values.note.trim(),
  }

  if (mode === 'manual') {
    const value = parseMoneyToVnd(values.value)
    return { ...base, valuationMode: 'manual', manualValue: Number.isFinite(value) ? value : 0 }
  }

  if (mode === 'market_priced') {
    const assetClass = assetClassForType(values.type)
    const quantity = Number(values.quantity.replace(/,/g, '.'))
    if (!assetClass || !values.symbol.trim() || !Number.isFinite(quantity)) return null
    return {
      ...base,
      valuationMode: 'market_priced',
      marketPosition: {
        assetClass,
        symbol: values.symbol.trim(),
        quantity,
        unit: values.unit.trim() || 'unit',
        quoteCurrency: 'VND',
      },
    }
  }

  // formula_calculated
  const calculationType = calculationTypeForType(values.type)
  const principal = parseMoneyToVnd(values.principal)
  const rate = Number(values.interestRate.replace(/,/g, '.'))
  if (!calculationType || !Number.isFinite(principal) || !Number.isFinite(rate) || !values.startDate)
    return null
  return {
    ...base,
    valuationMode: 'formula_calculated',
    calculationTerm: {
      calculationType,
      principalAmount: principal,
      interestRate: rate,
      startDate: values.startDate,
      maturityDate: values.maturityDate || null,
    },
  }
}

const moneyLike = /^[+-]?\d+([.,]\d+)?\s*[kKmMbB]?$/

function buildAssetSchema(t: (key: string, params?: Record<string, unknown>) => string) {
  return z
    .object({
      name: localizedRequiredText(t, t('assets.form.name')),
      type: z.enum(assetTypeOrder as [AssetType, ...AssetType[]]),
      liquidity: z.enum(['usable_now', 'not_immediately_usable', 'long_term']),
      note: localizedOptionalText(t, 120),
      value: z.string().trim(),
      symbol: z.string().trim(),
      quantity: z.string().trim(),
      unit: z.string().trim(),
      principal: z.string().trim(),
      interestRate: z.string().trim(),
      startDate: z.string().trim(),
      maturityDate: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      const mode = valuationModeForType(values.type)
      const invalidMoney = t('validation.invalidMoney')
      const required = (label: string) => t('validation.required', { label })

      if (mode === 'manual') {
        if (!values.value) {
          ctx.addIssue({ path: ['value'], code: 'custom', message: required(t('assets.form.value')) })
        } else if (!moneyLike.test(values.value)) {
          ctx.addIssue({ path: ['value'], code: 'custom', message: invalidMoney })
        }
      }

      if (mode === 'market_priced') {
        if (!values.symbol) {
          ctx.addIssue({
            path: ['symbol'],
            code: 'custom',
            message: required(t('assets.form.symbol')),
          })
        }
        const quantity = Number(values.quantity.replace(/,/g, '.'))
        if (!values.quantity) {
          ctx.addIssue({
            path: ['quantity'],
            code: 'custom',
            message: required(t('assets.form.quantity')),
          })
        } else if (!Number.isFinite(quantity) || quantity < 0) {
          ctx.addIssue({ path: ['quantity'], code: 'custom', message: invalidMoney })
        }
      }

      if (mode === 'formula_calculated') {
        if (!values.principal) {
          ctx.addIssue({
            path: ['principal'],
            code: 'custom',
            message: required(t('assets.form.principal')),
          })
        } else if (!moneyLike.test(values.principal)) {
          ctx.addIssue({ path: ['principal'], code: 'custom', message: invalidMoney })
        }
        const rate = Number(values.interestRate.replace(/,/g, '.'))
        if (!values.interestRate || !Number.isFinite(rate) || rate < 0) {
          ctx.addIssue({
            path: ['interestRate'],
            code: 'custom',
            message: required(t('assets.form.interestRate')),
          })
        }
        if (!values.startDate) {
          ctx.addIssue({ path: ['startDate'], code: 'custom', message: t('validation.requiredDate') })
        }
      }
    })
}

function modeSuffix(mode: ValuationMode): 'Manual' | 'Market' | 'Formula' {
  if (mode === 'market_priced') return 'Market'
  if (mode === 'formula_calculated') return 'Formula'
  return 'Manual'
}

export function AssetsPage() {
  const { t } = useTranslation()
  const { assets: seedAssets, snapshots } = useAssets()
  const [assets, setAssets] = useState<Asset[]>(seedAssets)
  const [formOpen, setFormOpen] = useState(false)
  const assetSchema = useMemo(() => buildAssetSchema(t), [t])

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
    defaultValues,
    mode: 'onChange',
  })

  const selectedType = watch('type')
  const mode = valuationModeForType(selectedType)
  const watchedValues = watch()

  // Live preview of the computed value for market/formula assets.
  const previewValue = useMemo(() => {
    if (mode === 'manual') return null
    const draft = toAsset('preview', watchedValues)
    return draft ? computeCurrentValue(draft, AS_OF) : null
  }, [mode, watchedValues])

  const totals = useMemo(() => {
    const acc: Record<AssetLiquidity, number> = {
      usable_now: 0,
      not_immediately_usable: 0,
      long_term: 0,
    }
    for (const asset of assets) {
      acc[asset.liquidity] += computeCurrentValue(asset, AS_OF) ?? 0
    }
    return acc
  }, [assets])

  const total = totals.usable_now + totals.not_immediately_usable + totals.long_term

  useEffect(() => {
    if (!formOpen) return
    reset({ ...defaultValues })
  }, [formOpen, reset])

  function openCreate() {
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
  }

  function onSubmit(values: AssetForm) {
    const nextAsset = toAsset(crypto.randomUUID(), values)
    if (!nextAsset) return
    setAssets((current) => [nextAsset, ...current])
    handleFormOpenChange(false)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t('assets.header.eyebrow')}
        title={t('assets.header.title')}
        description={t('assets.header.description')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            {t('assets.form.submit')}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <div className="mb-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('assets.charts.compositionEyebrow')}
            </p>
            <h2 className="section-title mt-1 text-2xl font-semibold">
              {t('assets.charts.compositionTitle')}
            </h2>
          </div>
          <AssetCompositionChart totals={totals} />
        </Card>

        <Card className="lg:col-span-7">
          <div className="mb-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {t('assets.charts.trendEyebrow')}
            </p>
            <h2 className="section-title mt-1 text-2xl font-semibold">
              {t('assets.charts.trendTitle')}
            </h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {t('assets.charts.trendSubtitle')}
            </p>
          </div>
          <AssetTrendChart snapshots={snapshots} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t('assets.list.eyebrow')}
              </p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                {t('assets.list.title')}
              </h2>
            </div>
            <Wallet className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <AssetList assets={assets} asOf={AS_OF} />
        </Card>

        <div className="space-y-4 lg:col-span-5">
          <Card>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t('assets.summary.eyebrow')}
                </p>
                <h2 className="mt-1 text-lg font-semibold">{t('assets.summary.title')}</h2>
              </div>
              <Landmark className="size-5 text-[hsl(var(--accent))]" />
            </div>

            <div className="space-y-4">
              <SubSection
                title={t('assets.summary.liquidityGroup')}
                aside={
                  <Badge className="bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]">
                    {t('assets.summary.healthy')}
                  </Badge>
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <MetricCell
                    label={t('assets.summary.usableNow')}
                    value={formatVndShort(totals.usable_now)}
                  />
                  <MetricCell
                    label={t('assets.summary.reserve')}
                    value={formatVndShort(totals.not_immediately_usable)}
                  />
                </div>
              </SubSection>

              <SubSection title={t('assets.summary.holdingsGroup')}>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCell
                    label={t('assets.summary.longTerm')}
                    value={formatVndShort(totals.long_term)}
                  />
                  <MetricCell
                    label={t('assets.summary.total')}
                    value={formatVndShort(total)}
                  />
                </div>
              </SubSection>
            </div>
          </Card>
        </div>
      </div>

      <ResponsiveDialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t('assets.form.title')}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{t('assets.form.eyebrow')}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                <Input
                  placeholder={t('assets.form.valuePlaceholder')}
                  aria-invalid={!!errors.value}
                  {...register('value')}
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
                    <Input
                      placeholder={t('assets.form.quantityPlaceholder')}
                      aria-invalid={!!errors.quantity}
                      {...register('quantity')}
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
                    <Input
                      placeholder={t('assets.form.principalPlaceholder')}
                      aria-invalid={!!errors.principal}
                      {...register('principal')}
                    />
                  </FormField>
                  <FormField
                    label={t('assets.form.interestRate')}
                    error={errors.interestRate?.message}
                  >
                    <Input
                      placeholder={t('assets.form.interestRatePlaceholder')}
                      aria-invalid={!!errors.interestRate}
                      {...register('interestRate')}
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
              <Button type="button" variant="secondary" onClick={() => handleFormOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={!isValid}>
                <Plus className="mr-2 size-4" />
                {t('assets.form.submit')}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}

function ComputedPreview({ value }: { value: number | null }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between rounded-2xl border border-dashed border-[hsl(var(--accent))] px-4 py-3">
      <span className="text-sm text-[hsl(var(--muted-foreground))]">
        {t('assets.form.computedValue')}
      </span>
      <span className="money-number text-lg text-[hsl(var(--accent))]">
        {value === null ? t('assets.form.computedUnavailable') : formatVndShort(value)}
      </span>
    </div>
  )
}
