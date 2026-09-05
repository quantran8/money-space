import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { useAssetsPage } from '@money-space/core/features/assets/hooks/use-assets-page'
import { AS_OF } from '@money-space/core/features/assets/model/assets-form'
import { computeCurrentValue } from '@money-space/core/features/assets/model/assets'
import { useDebts } from '@money-space/core/features/debts/hooks/use-debts'
import { useMembers } from '@money-space/core/features/members/hooks/use-members'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

import { Button, ConfirmDialog, Screen, Sections, Segmented, SwitchPane } from '@/components/ui'
import { AssetFormSheet } from '@/features/assets/components/asset-form-sheet'
import { AssetQuantitySheet } from '@/features/assets/components/asset-quantity-sheet'
import { AssetSaleSheet } from '@/features/assets/components/asset-sale-sheet'
import { AssetsListSection } from '@/features/assets/components/assets-list-section'
import { AssetsSummary } from '@/features/assets/components/assets-summary'
import { DebtsTab } from '@/features/debts/debts-tab'

type NetWorthTab = 'assets' | 'debts'

/**
 * Tài sản & Nợ — one destination for both halves of the balance sheet.
 *
 * The tab is **page state, not a route**. The bottom bar is capped at five
 * (§13), and net worth is one question with two halves: switching sides costs
 * no navigation and the shared summary stays mounted rather than flickering.
 * The two detail routes (`/assets/[assetId]`, `/debts/[debtId]`) stay separate —
 * an asset and a debt are different things once you open one.
 */
export default function NetWorthScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [tab, setTab] = useState<NetWorthTab>('assets')

  const { members } = useMembers()
  const { debts: allDebts } = useDebts()
  const {
    asOf,
    totals,
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
    editingAsset,
    isSubmitting,
    submit,
    formOpen,
    openCreate,
    handleFormOpenChange,
    sale,
    deleteId,
    setDeleteId,
    deletingAsset,
    isDeleting,
    handleDeleteAsset,
    quantity,
    openBuyMore,
    openAdjustQuantity,
  } = useAssetsPage()

  // Fetched as soon as the delete dialog has a target, so the confirmation can
  // say what the delete would detach rather than the household meeting the
  // server's refusal as a bare error.

  // The debt half of the shared strip. Read here, not inside `DebtsTab`: the
  // strip spans both tabs, so it cannot depend on the debts tab being mounted.
  const activeDebts = allDebts.filter(
    (debt) => debt.status === 'active' || debt.status === 'overdue',
  )
  const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.outstandingAmountValue, 0)

  const onAssets = tab === 'assets'

  return (
    <Screen
      withAccountHeader
      title={t('networth.header.title')}
      right={
        onAssets ? (
          // Wrapped, not passed by reference: `openCreate` takes an optional
          // acquisition, and a press event would land in it.
          <Button className="px-4" onPress={() => openCreate()}>
            {t('assets.demo.addSource')}
          </Button>
        ) : undefined
      }
    >
      <Sections>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'assets' as const, label: t('nav.assets') },
            { value: 'debts' as const, label: t('nav.debts') },
          ]}
        />

        {/* ONE strip for both tabs: net worth is the point of putting the two
            halves on one destination, so it must not flicker when the tab
            changes. */}
        <AssetsSummary
          totals={totals}
          total={total}
          assetCount={assetCount}
          totalDebt={totalDebt}
          debtCount={activeDebts.length}
          asOf={asOf || AS_OF}
        />

        {/* Tài sản ↔ Nợ is a swap in one slot, not two lists appearing: the
            strip above stays put and only the body below it changes. */}
        <SwitchPane activeKey={onAssets ? 'assets' : 'debts'}>
          {onAssets ? (
            <AssetsListSection
              assets={filteredAssets}
              members={members}
              isLoading={isLoading}
              asOf={asOf || AS_OF}
              total={total}
              query={query}
              onQueryChange={setQuery}
              liquidityFilter={liquidityFilter}
              onLiquidityFilterChange={setLiquidityFilter}
              onOpen={(assetId) => router.push(`/assets/${assetId}`)}
              onAdd={() => openCreate()}
            />
          ) : (
            // ── SEAM: the debts half ────────────────────────────────────────
            // Owned by the debts port, not this file. `DebtsTab` is
            // deliberately prop-less and self-contained: it reads
            // `useDebtsPage` itself and renders its own list, sheets and add
            // action. The only thing this screen borrows from the debts side is
            // the outstanding total above, which comes from core's `useDebts`
            // rather than from the component — the strip has to be right
            // whether or not this tab is mounted.
            <DebtsTab />
          )}
        </SwitchPane>
      </Sections>

      <AssetFormSheet
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        setValue={setValue}
        mode={mode}
        walletOptions={walletOptions}
        isEditing={isEditing}
        onBuyMore={openBuyMore}
        onAdjustQuantity={openAdjustQuantity}
        editingAsset={editingAsset}
        isSubmitting={isSubmitting}
        onSubmit={submit}
        onRemove={editingAsset ? () => setDeleteId(editingAsset.id) : undefined}
      />

      <AssetQuantitySheet
        mode={quantity.mode}
        onClose={quantity.close}
        asset={quantity.asset}
        currentQuantity={quantity.currentQuantity}
        walletOptions={quantity.walletOptions}
        purchaseForm={quantity.purchaseForm}
        adjustmentForm={quantity.adjustmentForm}
        isSubmitting={quantity.isSubmitting}
        onSubmitPurchase={quantity.submitPurchase}
        onSubmitAdjustment={quantity.submitAdjustment}
      />

      <AssetSaleSheet
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
        isEditing={sale.isEditing}
        onSubmit={sale.submit}
      />

      {/* §22.11 — "Gỡ nguồn tiền", not "Xoá tài khoản", and the consequence
          stated in money. Confirmed by a sheet, never by retyping a name. */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title={t('assets.form.removeTitle')}
        consequence={[
          t('assets.form.removeBody', {
            amount: formatVndShort(
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
        cancelLabel={t('common.cancel')}
        loading={isDeleting}
        onConfirm={() => {
          // Always cascading. The server refuses a delete that still has links
          // unless it is told the household confirmed, and this dialog IS that
          // confirmation — it states what a delete can take before asking.
          if (deleteId) void handleDeleteAsset(deleteId, true).catch(() => {})
        }}
      />
    </Screen>
  )
}
