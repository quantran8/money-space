import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/app/layout/page-header'
import { Button } from '@/components/ui/button'
import { useAssetsPage } from '@/features/assets/hooks/use-assets-page'
import { AssetFormDialog } from '@/features/assets/ui/components/asset-form-dialog'
import { AssetsCharts } from '@/features/assets/ui/components/assets-charts'
import { AssetsListSection } from '@/features/assets/ui/components/assets-list-section'
import { AssetsSummaryCard } from '@/features/assets/ui/components/assets-summary-card'
import { AssetsSummaryStrip } from '@/features/assets/ui/components/assets-summary-strip'
import { AS_OF } from '@/features/assets/model/assets-form'

export function AssetsPage() {
  const { t } = useTranslation()
  const {
    snapshots,
    asOf,
    totals,
    total,
    filteredAssets,
    query,
    setQuery,
    liquidityFilter,
    setLiquidityFilter,
    form,
    mode,
    previewValue,
    setValue,
    isSubmitting,
    submit,
    formOpen,
    openCreate,
    handleFormOpenChange,
  } = useAssetsPage()

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

      <AssetsSummaryStrip totals={totals} total={total} />

      <AssetsCharts totals={totals} snapshots={snapshots} />

      <div className="grid gap-4 lg:grid-cols-12">
        <AssetsListSection
          assets={filteredAssets}
          asOf={asOf || AS_OF}
          query={query}
          onQueryChange={setQuery}
          liquidityFilter={liquidityFilter}
          onLiquidityFilterChange={setLiquidityFilter}
        />

        <div className="space-y-4 lg:col-span-5">
          <AssetsSummaryCard totals={totals} total={total} />
        </div>
      </div>

      <AssetFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        setValue={setValue}
        mode={mode}
        previewValue={previewValue}
        isSubmitting={isSubmitting}
        onSubmit={submit}
      />
    </div>
  )
}
