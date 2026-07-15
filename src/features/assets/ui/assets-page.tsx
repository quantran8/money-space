import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAssetsPage } from '@/features/assets/hooks/use-assets-page'
import { AssetFormDialog } from '@/features/assets/ui/components/asset-form-dialog'
import { AssetSaleDialog } from '@/features/assets/ui/components/asset-sale-dialog'
import { AssetsCharts } from '@/features/assets/ui/components/assets-charts'
import { AssetsListSection } from '@/features/assets/ui/components/assets-list-section'
import { AssetsSummaryStrip } from '@/features/assets/ui/components/assets-summary-strip'
import { AS_OF } from '@/features/assets/model/assets-form'

export function AssetsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    snapshots,
    asOf,
    totals,
    total,
    filteredAssets,
    isLoading,
    query,
    setQuery,
    liquidityFilter,
    setLiquidityFilter,
    form,
    mode,
    previewValue,
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

  return (
    <div className="space-y-4">
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

      <AssetsSummaryStrip totals={totals} total={total} asOf={asOf || AS_OF} />

      <div className="grid gap-4 xl:grid-cols-12">
        <AssetsListSection
          assets={filteredAssets}
          isLoading={isLoading}
          asOf={asOf || AS_OF}
          query={query}
          onQueryChange={setQuery}
          liquidityFilter={liquidityFilter}
          onLiquidityFilterChange={setLiquidityFilter}
          onOpen={(assetId) => navigate(`/assets/${assetId}`)}
          onEdit={openEdit}
          onSell={openSale}
          onDelete={setDeleteId}
        />

        <AssetsCharts totals={totals} snapshots={snapshots} />
      </div>

      <AssetFormDialog
        key={formOpen ? (isEditing ? 'edit-open' : 'create-open') : 'closed'}
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        setValue={setValue}
        mode={mode}
        previewValue={previewValue}
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
