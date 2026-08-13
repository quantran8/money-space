import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAssetsPage } from '@/features/assets/hooks/use-assets-page'
import { AssetFormDialog } from '@/features/assets/ui/components/asset-form-dialog'
import { AssetSaleDialog } from '@/features/assets/ui/components/asset-sale-dialog'
import { AssetsDebtTabs } from '@/features/assets/ui/components/assets-debt-tabs'
import { AssetsListSection } from '@/features/assets/ui/components/assets-list-section'
import { AssetsSummaryStrip } from '@/features/assets/ui/components/assets-summary-strip'
import { AS_OF } from '@/features/assets/model/assets-form'
import { useDebts } from '@/features/debts/hooks/use-debts'
import { useMembers } from '@/features/members/hooks/use-members'

export function AssetsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { debts } = useDebts()
  const { members } = useMembers()
  const {
    asOf,
    total,
    assetCount,
    filteredAssets,
    isLoading,
    query,
    setQuery,
    liquidityFilter,
    setLiquidityFilter,
    form,
    mode,
    walletOptions,
    setValue,
    isEditing,
    isSubmitting,
    submit,
    formOpen,
    openCreate,
    openEdit,
    handleFormOpenChange,
    openSale,
    sale,
    deleteId,
    setDeleteId,
    deletingAsset,
    isDeleting,
    handleDeleteAsset,
  } = useAssetsPage()
  const activeDebts = debts.filter((debt) => debt.status === 'active' || debt.status === 'overdue')
  const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.outstandingAmountValue, 0)

  return (
    <div className="space-y-4 pb-3">
      <CompactPageHeader
        eyebrow={t('assets.header.eyebrow')}
        title={t('assets.header.title')}
        actions={
          <Button className="h-10 px-4 text-[13px]" onClick={openCreate}>
            <Plus className="size-4" />
            {t('assets.demo.addSource')}
          </Button>
        }
      />

      <AssetsDebtTabs />

      <AssetsSummaryStrip
        total={total}
        assetCount={assetCount}
        totalDebt={totalDebt}
        debtCount={activeDebts.length}
        asOf={asOf || AS_OF}
      />

      <AssetsListSection
        assets={filteredAssets}
        isLoading={isLoading}
        asOf={asOf || AS_OF}
        query={query}
        onQueryChange={setQuery}
        liquidityFilter={liquidityFilter}
        onLiquidityFilterChange={setLiquidityFilter}
        members={members}
        onOpen={(assetId) => navigate(`/assets/${assetId}`)}
        onEdit={openEdit}
        onSell={openSale}
        onDelete={setDeleteId}
      />

      <AssetFormDialog
        key={formOpen ? (isEditing ? 'edit-open' : 'create-open') : 'closed'}
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        setValue={setValue}
        mode={mode}
        walletOptions={walletOptions}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        onSubmit={submit}
      />

      <AssetSaleDialog
        open={sale.saleOpen}
        onOpenChange={sale.handleOpenChange}
        asset={sale.sellingAsset}
        asOf={asOf || AS_OF}
        form={sale.form}
        walletOptions={sale.walletOptions}
        isMarketAsset={sale.isMarketAsset}
        currentQuantity={sale.currentQuantity}
        previewNet={sale.previewNet}
        isSubmitting={sale.isSubmitting}
        onSubmit={sale.submit}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('common.confirmDelete.title')}
        description={t('common.confirmDelete.description', { name: deletingAsset?.name ?? '' })}
        confirmDisabled={isDeleting}
        confirmLoadingLabel="Dang xoa..."
        onConfirm={() => (deleteId ? handleDeleteAsset(deleteId) : undefined)}
      />
    </div>
  )
}
