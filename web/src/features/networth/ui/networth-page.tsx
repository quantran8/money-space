import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { CompactPageHeader } from '@/app/layout/compact-page-header'
import { SwitchPane } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAssetsPage } from '@money-space/core/features/assets/hooks/use-assets-page'
import { AssetFormDialog } from '@/features/assets/ui/components/asset-form-dialog'
import { AssetPurchaseDialog } from '@/features/assets/ui/components/asset-purchase-dialog'
import { AssetSaleDialog } from '@/features/assets/ui/components/asset-sale-dialog'
import { AssetsListSection } from '@/features/assets/ui/components/assets-list-section'
import { AssetsSummaryStrip } from '@/features/assets/ui/components/assets-summary-strip'
import { AS_OF } from '@money-space/core/features/assets/model/assets-form'
import { computeCurrentValue } from '@money-space/core/features/assets/model/assets'
import { useDebts } from '@money-space/core/features/debts/hooks/use-debts'
import { useDebtsPage } from '@money-space/core/features/debts/hooks/use-debts-page'
import { DebtFormDialog } from '@/features/debts/ui/components/debt-form-dialog'
import { DebtUpdateModeDialog } from '@/features/debts/ui/components/debt-update-mode-dialog'
import { DebtsListSection } from '@/features/debts/ui/components/debts-list-section'
import { DebtsSummaryStrip } from '@/features/debts/ui/components/debts-summary-strip'
import { NetWorthTabs, type NetWorthTab } from '@/features/networth/ui/components/networth-tabs'
import { useMembers } from '@money-space/core/features/members/hooks/use-members'
import { formatMoney } from '@money-space/core/shared/lib/format-money'

/**
 * Tài sản & Nợ — the single route for both halves of the balance sheet.
 *
 * `/assets` and `/debts` used to be two routes with a NavLink tab bar between
 * them. They are now one route: the tab is component state, so switching sides
 * costs no navigation and the shared summary strip stays mounted. The two
 * detail routes (`/assets/:id`, `/debts/:id`) are deliberately untouched —
 * an asset and a debt are different things once you open one.
 */
export function NetWorthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  // Deep links that used to land on `/debts` (the events page "add a debt"
  // shortcut) now land here and must open on the debt side. Read once at mount:
  // `useDebtsPage` clears the history state right after, so an effect that
  // re-read it would fight that cleanup.
  const [tab, setTab] = useState<NetWorthTab>(() =>
    location.state && typeof location.state === 'object' && 'openCreate' in location.state
      ? 'debts'
      : 'assets',
  )

  const { debts: allDebts } = useDebts()
  const { members } = useMembers()
  const assetsPage = useAssetsPage()
  const debtsPage = useDebtsPage()

  const {
    asOf,
    total,
    totals,
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
    editingAsset,
    isSubmitting,
    submit,
    formOpen,
    openCreate: openAssetCreate,
    openEdit,
    handleFormOpenChange,
    openSale,
    sale,
    openPurchase,
    quantity,
    deleteId,
    setDeleteId,
    deletingAsset,
    isDeleting,
    handleDeleteAsset,
  } = assetsPage

  // Fetched as soon as the delete dialog has a target, so the confirmation can
  // say what the delete would detach rather than the household meeting the
  // server's refusal as a bare error.

  // "Mua tài sản" on the events page hands over to here. It arrives as a
  // purchase, so the form opens already set to "vừa mua" rather than making the
  // user say so again. Deferred a tick and the history state cleared, matching
  // how the debt shortcut above is handled.
  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'buyAsset' in location.state) {
      const timer = window.setTimeout(() => openAssetCreate('purchased'), 0)
      window.history.replaceState({}, document.title)
      return () => window.clearTimeout(timer)
    }
  }, [location.state, openAssetCreate])

  const activeDebts = allDebts.filter(
    (debt) => debt.status === 'active' || debt.status === 'overdue',
  )
  const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.outstandingAmountValue, 0)

  const onAssets = tab === 'assets'

  return (
    <div className="space-y-4 pb-3">
      <CompactPageHeader
        title={t('networth.header.title')}
        actions={
          <Button
            className="s-tap h-10 px-4"
            // Wrapped, not passed by reference: `openAssetCreate` takes an
            // optional acquisition and a click event would land in it.
            onClick={onAssets ? () => openAssetCreate() : debtsPage.openCreate}
          >
            <Plus className="size-4" />
            {onAssets ? t('assets.demo.addSource') : t('debts.demo.add')}
          </Button>
        }
      />

      <NetWorthTabs value={tab} onChange={setTab} />

      {/* One strip for both tabs: net worth is the point of putting the two
          halves on one route, so it must not flicker when the tab changes. */}
      <AssetsSummaryStrip
        total={total}
        totals={totals}
        totalDebt={totalDebt}
        asOf={asOf || AS_OF}
      />

      <SwitchPane activeKey={onAssets ? 'assets' : 'debts'} className="space-y-4">
        {onAssets ? (
          <AssetsListSection
            assets={filteredAssets}
            isLoading={isLoading}
            asOf={asOf || AS_OF}
            total={total}
            query={query}
            onQueryChange={setQuery}
            liquidityFilter={liquidityFilter}
            onLiquidityFilterChange={setLiquidityFilter}
            members={members}
            onOpen={(assetId) => navigate(`/assets/${assetId}`)}
            onEdit={openEdit}
            onSell={openSale}
            onBuyMore={openPurchase}
            onDelete={setDeleteId}
          />
        ) : (
          <>
            <DebtsSummaryStrip
              summary={debtsPage.summary}
              debts={debtsPage.debts}
              payments={debtsPage.payments}
            />

            <DebtsListSection
              debts={debtsPage.debts}
              members={debtsPage.members}
              assets={debtsPage.assets}
              payments={debtsPage.payments}
              isLoading={debtsPage.isLoading}
              isUpdating={debtsPage.isUpdating}
              onEdit={debtsPage.openEdit}
              onMarkPaidOff={debtsPage.markPaidOff}
              onViewDetail={debtsPage.openDetail}
              onDelete={debtsPage.requestDelete}
            />
          </>
        )}
      </SwitchPane>

      <AssetFormDialog
        key={formOpen ? (isEditing ? 'edit-open' : 'create-open') : 'closed'}
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        setValue={setValue}
        mode={mode}
        walletOptions={walletOptions}
        isEditing={isEditing}
        editingAsset={editingAsset}
        isSubmitting={isSubmitting}
        onSubmit={submit}
        onRemove={editingAsset ? () => setDeleteId(editingAsset.id) : undefined}
      />

      <AssetPurchaseDialog
        open={quantity.mode === 'purchase'}
        onOpenChange={quantity.handleOpenChange}
        asset={quantity.asset}
        currentQuantity={quantity.currentQuantity}
        walletOptions={quantity.walletOptions}
        form={quantity.purchaseForm}
        isSubmitting={quantity.isSubmitting}
        onSubmit={quantity.submitPurchase}
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

      {/* §22.11 — "Gỡ nguồn tiền", not "Xoá tài khoản", and the consequence
          stated in money. Confirmed by a small dialog, never by retyping. */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('assets.form.removeTitle')}
        description={[
          t('assets.form.removeBody', {
            amount: formatMoney(
              deletingAsset ? (computeCurrentValue(deletingAsset, asOf || AS_OF) ?? 0) : 0,
            ),
          }),
          // Stated for every asset rather than counted per asset. Reading the
          // exact links back first cost a round-trip on every delete dialog,
          // and the household's decision is the same either way: this is what
          // a delete can take with it.
          t('assets.form.removeImpactNotice'),
        ].join('\n\n')}
        confirmLabel={t('assets.form.removeConfirm')}
        confirmDisabled={isDeleting}
        confirmLoadingLabel={t('assets.form.removing')}
        onConfirm={() =>
          // Always cascading. The server refuses a delete that still has links
          // unless it is told the household confirmed, and this dialog IS that
          // confirmation — it states what a delete can take before asking.
          deleteId ? handleDeleteAsset(deleteId, true) : undefined
        }
      />

      <DebtFormDialog
        open={debtsPage.dialogOpen}
        onOpenChange={debtsPage.onOpenChange}
        editingId={debtsPage.editingId}
        control={debtsPage.control}
        register={debtsPage.register}
        errors={debtsPage.errors}
        isValid={debtsPage.isValid}
        isSavingDebt={debtsPage.isSavingDebt}
        setValue={debtsPage.setValue}
        trigger={debtsPage.trigger}
        selectedLenderType={debtsPage.selectedLenderType}
        showMoreDetails={debtsPage.showMoreDetails}
        setShowMoreDetails={debtsPage.setShowMoreDetails}
        receiveAssetOptions={debtsPage.receiveAssetOptions}
        memberOptions={debtsPage.memberOptions}
        termMonths={debtsPage.termMonths}
        onSubmit={debtsPage.submit}
        pasteAmountFromClipboard={debtsPage.pasteAmountFromClipboard}
      />

      {debtsPage.updateModeOpen ? (
        <DebtUpdateModeDialog
          open
          onOpenChange={(open) => {
            if (!open) debtsPage.cancelUpdateMode()
          }}
          originalAmountChanged={debtsPage.updateModeOriginalChanged}
          before={debtsPage.updateModeBefore}
          after={debtsPage.updateModeAfter}
          totalRepaid={debtsPage.updateModeTotalRepaid}
          isSubmitting={debtsPage.isSavingUpdateMode}
          onConfirm={debtsPage.confirmUpdateMode}
        />
      ) : null}

      <ConfirmDialog
        open={!!debtsPage.deletingDebt}
        onOpenChange={(open) => {
          if (!open) debtsPage.cancelDelete()
        }}
        title={t('debts.remove.title')}
        description={
          debtsPage.deletingDebt
            ? t('debts.remove.body', { name: debtsPage.deletingDebt.name })
            : undefined
        }
        confirmLabel={t('debts.remove.confirm')}
        confirmLoadingLabel={t('debts.remove.removing')}
        cancelLabel={t('common.cancel')}
        confirmDisabled={debtsPage.isDeleting}
        onConfirm={debtsPage.confirmDelete}
      />
    </div>
  )
}
