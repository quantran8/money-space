import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useAssets } from '@/features/assets/hooks/use-assets'
import {
  AS_OF,
  buildAssetSchema,
  defaultAssetFormValues,
  toAsset,
  type AssetForm,
  type AssetTotals,
} from '@/features/assets/model/assets-form'
import {
  computeCurrentValue,
  valuationModeForType,
  type AssetLiquidity,
} from '@/features/assets/model/assets'
import { getErrorMessage } from '@/shared/lib/get-error-message'

const EMPTY_TOTALS: AssetTotals = {
  usable_now: 0,
  not_immediately_usable: 0,
  long_term: 0,
  totalAssets: 0,
}

export function useAssetsPage() {
  const { t } = useTranslation()
  const { assets, snapshots, summary, asOf, createAsset } = useAssets()

  const [formOpen, setFormOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [liquidityFilter, setLiquidityFilter] = useState<AssetLiquidity | 'all'>('all')

  const assetSchema = useMemo(() => buildAssetSchema(t), [t])

  const form = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
    defaultValues: defaultAssetFormValues,
    mode: 'onChange',
  })

  const { watch, reset, setValue, handleSubmit } = form

  const selectedType = watch('type')
  const mode = valuationModeForType(selectedType)
  const watchedValues = watch()

  // Live preview of the computed value for market/formula assets.
  const previewValue = useMemo(() => {
    if (mode === 'manual') return null
    const draft = toAsset('preview', watchedValues)
    return draft ? computeCurrentValue(draft, AS_OF) : null
  }, [mode, watchedValues])

  const totals = summary?.totals ?? EMPTY_TOTALS
  const total = totals.usable_now + totals.not_immediately_usable + totals.long_term

  const filteredAssets = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return assets.filter((asset) => {
      if (liquidityFilter !== 'all' && asset.liquidity !== liquidityFilter) return false
      if (!needle) return true
      return (
        asset.name.toLowerCase().includes(needle) || asset.note.toLowerCase().includes(needle)
      )
    })
  }, [assets, query, liquidityFilter])

  useEffect(() => {
    if (!formOpen) return
    reset({ ...defaultAssetFormValues })
  }, [formOpen, reset])

  function openCreate() {
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
  }

  async function onSubmit(values: AssetForm) {
    try {
      const nextAsset = toAsset(crypto.randomUUID(), values)
      if (!nextAsset) return
      await createAsset.mutateAsync({
        name: nextAsset.name,
        type: nextAsset.type,
        valuationMode: nextAsset.valuationMode,
        liquidity: nextAsset.liquidity,
        currency: nextAsset.currency,
        note: nextAsset.note,
        manualValue: nextAsset.manualValue,
        marketPosition: nextAsset.marketPosition,
        calculationTerm: nextAsset.calculationTerm,
      })
      toast.success('Tao tai san thanh cong.')
      handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the tao tai san.'))
    }
  }

  return {
    // data
    snapshots,
    asOf,
    totals,
    total,
    filteredAssets,
    // toolbar state
    query,
    setQuery,
    liquidityFilter,
    setLiquidityFilter,
    // form
    form,
    mode,
    previewValue,
    setValue,
    isSubmitting: createAsset.isPending,
    submit: handleSubmit(onSubmit),
    // dialog
    formOpen,
    openCreate,
    handleFormOpenChange,
  }
}
