import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { notify } from '#/shared/notify'

import { useAssets } from '#/features/assets/hooks/use-assets'
import { useAssetSale } from '#/features/assets/hooks/use-asset-sale'
import { useAssetQuantity } from '#/features/assets/hooks/use-asset-quantity'
import {
  buildAssetSchema,
  canBePurchased,
  defaultAssetFormValues,
  fromAsset,
  toAsset,
  type AssetForm,
  type AssetTotals,
} from '#/features/assets/model/assets-form'
import { valuationModeForType, type AssetLiquidity } from '#/features/assets/model/assets'
import { createId } from '#/shared/lib/create-id'
import { getErrorMessage } from '#/shared/lib/get-error-message'

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
  // The two non-sale ways a holding moves. They live beside `sale` because the
  // three together are the complete set of things that may change a quantity —
  // the asset form no longer does.
  const quantity = useAssetQuantity()

  function openSale(assetId: string) {
    const asset = assets.find((item) => item.id === assetId)
    if (asset) sale.openSale(asset)
  }

  /**
   * Buy more of a holding, addressed by id — the row menu and the detail page
   * both have an id, not the record. `openBuyMore` below stays for the edit
   * dialog, which already holds the asset it is editing.
   */
  function openPurchase(assetId: string) {
    const asset = assets.find((item) => item.id === assetId)
    if (asset) quantity.openPurchase(asset)
  }

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [createAcquisition, setCreateAcquisition] =
    useState<AssetForm['acquisition']>('owned')
  const [query, setQuery] = useState('')
  const [liquidityFilter, setLiquidityFilter] = useState<AssetLiquidity | 'all'>('all')

  const isEditing = editingId !== null
  const isSubmitting = createAsset.isPending || updateAsset.isPending

  // Wallet (cash/bank) assets: they receive auto-credited saving interest, and
  // they are what a purchase can be paid from. `balance` rides along so the
  // form can show what each holds and reject an unaffordable purchase without a
  // round-trip.
  const walletOptions = useMemo(
    () =>
      assets
        .filter((asset) => asset.type === 'cash' || asset.type === 'bank_account')
        .map((asset) => ({
          value: asset.id,
          label: asset.name,
          balance: asset.currentValue ?? asset.manualValue ?? 0,
        })),
    [assets],
  )

  const walletBalances = useMemo(
    () => new Map(walletOptions.map((option) => [option.value, option.balance])),
    [walletOptions],
  )

  const assetSchema = useMemo(
    () => buildAssetSchema(t, walletBalances),
    [t, walletBalances],
  )

  // §22.10 — the primary button is never disabled, so validation runs on submit
  // and errors explain what is missing. Re-validating on change afterwards is
  // what makes an error clear the moment the user starts fixing that field.
  const form = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
    defaultValues: defaultAssetFormValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  const { watch, reset, setValue, handleSubmit } = form

  const selectedType = watch('type')
  const mode = valuationModeForType(selectedType)

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
    reset(
      editingAsset
        ? fromAsset(editingAsset)
        : { ...defaultAssetFormValues, acquisition: createAcquisition },
    )
  }, [formOpen, editingAsset, createAcquisition, reset])

  /**
   * `acquisition` defaults to `owned` — a household's first act is entering
   * what it already has. Coming in through "Mua tài sản" on the events page
   * says otherwise, so that entry point opens the form already set to
   * `purchased`.
   */
  function openCreate(acquisition: AssetForm['acquisition'] = 'owned') {
    setEditingId(null)
    setCreateAcquisition(acquisition)
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
      // `createId`, not `crypto.randomUUID`: React Native has no global
      // `crypto`, and the id is local anyway — the payload below never sends it.
      const nextAsset = toAsset(editingId ?? createId(), values)
      // `toAsset` returns null on incomplete market/formula input. The schema
      // should have caught that first, but with the submit button always
      // enabled (§22.10) this path is reachable — so it must say something
      // rather than silently doing nothing.
      if (!nextAsset) {
        notify.error(t('assets.form.incomplete'))
        return
      }
      const payload = {
        name: nextAsset.name,
        type: nextAsset.type,
        valuationMode: nextAsset.valuationMode,
        currency: nextAsset.currency,
        note: nextAsset.note,
        areaSqm: nextAsset.areaSqm,
        manualValue: nextAsset.manualValue,
        marketPosition: nextAsset.marketPosition,
        calculationTerm: nextAsset.calculationTerm,
        // The one liquidity input the server accepts: it derives the bucket
        // from this, and every figure reads that same bucket.
        countsAsFlexible: values.countsAsFlexible,
        // `holderMemberId` sends null rather than '' so the backend stores an
        // absent value.
        holderMemberId: values.holderMemberId || null,
        // Naming a wallet is what turns "we own this" into "we bought this":
        // the server logs an `asset_purchase` and debits that wallet, so net
        // worth stays put. `null` (not undefined) — `JSON.stringify` drops
        // undefined keys, and the absence has to reach the server as an answer.
        fundingAssetId:
          values.acquisition === 'purchased' && canBePurchased(values.type)
            ? values.fundingAssetId || null
            : null,
      }

      if (editingId) {
        await updateAsset.mutateAsync({ assetId: editingId, payload })
        notify.success('Cap nhat tai san thanh cong.')
      } else {
        await createAsset.mutateAsync(payload)
        notify.success('Tao tai san thanh cong.')
      }
      handleFormOpenChange(false)
    } catch (error) {
      notify.error(
        getErrorMessage(error, editingId ? 'Khong the cap nhat tai san.' : 'Khong the tao tai san.'),
      )
    }
  }

  /**
   * `cascade` carries the household's confirmation through to the server, which
   * refuses the delete without it while the asset still backs a goal, an event
   * or a debt. The dialog asks for it only after `useAssetDeleteImpact` has
   * said what those are.
   */
  async function handleDeleteAsset(assetId: string, cascade = false) {
    try {
      await deleteAsset.mutateAsync({ assetId, cascade })
      notify.success('Da xoa tai san.')
      setDeleteId(null)
      if (editingId === assetId) handleFormOpenChange(false)
    } catch (error) {
      notify.error(getErrorMessage(error, 'Khong the xoa tai san.'))
      throw error
    }
  }

  return {
    // data
    snapshots,
    asOf,
    totals,
    total,
    assetCount: assets.length,
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
    walletOptions,
    setValue,
    isEditing,
    /** The stored record behind an edit — drives the §22.8 change sentence. */
    editingAsset,
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
    // buy more, addressed by id
    openPurchase,
    // quantity: buy more / correct the holding
    quantity,
    openBuyMore: () => {
      if (editingAsset) quantity.openPurchase(editingAsset)
    },
    openAdjustQuantity: () => {
      if (editingAsset) quantity.openAdjustment(editingAsset)
    },
    // delete
    deleteId,
    setDeleteId,
    deletingAsset,
    isDeleting: deleteAsset.isPending,
    handleDeleteAsset,
  }
}
