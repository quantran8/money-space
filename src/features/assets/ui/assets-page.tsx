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
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow={t('assets.header.eyebrow')}
        title={t('assets.header.title')}
        description={t('assets.header.description')}
        className="gap-5 [&_h1]:mt-2 [&_h1]:max-w-4xl [&_h1]:text-[34px] [&_h1]:leading-[1.05] sm:[&_h1]:text-[46px] [&_p:last-child]:mt-3 [&_p:last-child]:max-w-3xl [&_p:last-child]:text-[15px] sm:[&_p:last-child]:text-base"
        actions={
          <Button className="h-12 rounded-full px-6" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            {t('assets.form.submit')}
          </Button>
        }
      />

      <AssetsSummaryStrip
        totals={totals}
        total={total}
        asOf={asOf || AS_OF}
        snapshots={snapshots}
      />

      <AssetsCharts totals={totals} snapshots={snapshots} />

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
