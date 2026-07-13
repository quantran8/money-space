import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { useAssetSale } from '@/features/assets/hooks/use-asset-sale'
import {
  AS_OF,
  buildAssetSchema,
  defaultAssetFormValues,
  fromAsset,
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
  const { assets, snapshots, summary, asOf, isLoading, createAsset, updateAsset, deleteAsset } =
    useAssets()
  const sale = useAssetSale()

  function openSale(assetId: string) {
    const asset = assets.find((item) => item.id === assetId)
    if (asset) sale.openSale(asset)
  }

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [liquidityFilter, setLiquidityFilter] = useState<AssetLiquidity | 'all'>('all')

  const isEditing = editingId !== null
  const isSubmitting = createAsset.isPending || updateAsset.isPending

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

  // Wallet (cash/bank) assets that can receive auto-credited saving interest.
  const walletOptions = useMemo(
    () =>
      assets
        .filter((asset) => asset.type === 'cash' || asset.type === 'bank_account')
        .map((asset) => ({ value: asset.id, label: asset.name })),
    [assets],
  )

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

  const editingAsset = editingId ? assets.find((asset) => asset.id === editingId) : undefined
  const deletingAsset = deleteId ? assets.find((asset) => asset.id === deleteId) : undefined

  useEffect(() => {
    if (!formOpen) return
    reset(editingAsset ? fromAsset(editingAsset) : { ...defaultAssetFormValues })
  }, [formOpen, editingAsset, reset])

  function openCreate() {
    setEditingId(null)
    setFormOpen(true)
  }

  function openEdit(assetId: string) {
    setEditingId(assetId)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) setEditingId(null)
  }

  async function onSubmit(values: AssetForm) {
    try {
      const nextAsset = toAsset(editingId ?? crypto.randomUUID(), values)
      if (!nextAsset) return
      const payload = {
        name: nextAsset.name,
        type: nextAsset.type,
        valuationMode: nextAsset.valuationMode,
        liquidity: nextAsset.liquidity,
        currency: nextAsset.currency,
        note: nextAsset.note,
        manualValue: nextAsset.manualValue,
        marketPosition: nextAsset.marketPosition,
        calculationTerm: nextAsset.calculationTerm,
      }

      if (editingId) {
        await updateAsset.mutateAsync({ assetId: editingId, payload })
        toast.success('Cap nhat tai san thanh cong.')
      } else {
        await createAsset.mutateAsync(payload)
        toast.success('Tao tai san thanh cong.')
      }
      handleFormOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(error, editingId ? 'Khong the cap nhat tai san.' : 'Khong the tao tai san.'),
      )
    }
  }

  async function handleDeleteAsset(assetId: string) {
    try {
      await deleteAsset.mutateAsync(assetId)
      toast.success('Da xoa tai san.')
      setDeleteId(null)
      if (editingId === assetId) handleFormOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Khong the xoa tai san.'))
      throw error
    }
  }

  return {
    // data
    snapshots,
    asOf,
    totals,
    total,
    filteredAssets,
    isLoading,
    // toolbar state
    query,
    setQuery,
    liquidityFilter,
    setLiquidityFilter,
    // form
    form,
    mode,
    previewValue,
    walletOptions,
    setValue,
    isEditing,
    isSubmitting,
    submit: handleSubmit(onSubmit),
    // dialog
    formOpen,
    openCreate,
    openEdit,
    handleFormOpenChange,
    // sale
    openSale,
    sale,
    // delete
    deleteId,
    setDeleteId,
    deletingAsset,
    isDeleting: deleteAsset.isPending,
    handleDeleteAsset,
  }
}
