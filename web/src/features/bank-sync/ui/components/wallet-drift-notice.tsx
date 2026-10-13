import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { useWalletDrift } from '@money-space/core/features/bank-sync/hooks/use-wallet-drift'
import { formatVndExact, formatVndScale } from '@money-space/core/shared/lib/format-money'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { notify } from '@money-space/core/shared/notify'

// Shown, never applied on its own. See backend memory/cashflow-settlement.md.
export function WalletDriftNotice({ assetId }: { assetId?: string }) {
  const { t } = useTranslation()
  const { drifts } = useWalletDrift()
  const { updateAsset } = useAssets()
  const rows = assetId ? drifts.filter((d) => d.assetId === assetId) : drifts
  if (rows.length === 0) return null

  const adjust = async (id: string, value: number) => {
    try {
      await updateAsset.mutateAsync({ assetId: id, payload: { manualValue: value } })
      notify.success(t('settlement.drift.adjusted'))
    } catch (error) {
      notify.error(getErrorMessage(error, t('common.genericError')))
    }
  }

  return (
    <ul className="space-y-2">
      {rows.map((d) => (
        <li key={d.assetId} className="rounded-[10px] bg-attention-tint px-4 py-3">
          <p className="t-body-sm font-medium text-attention-ink">
            {assetId ? '' : `${d.assetName} · `}
            {t('settlement.drift.badge', { amount: formatVndScale(Math.abs(d.drift)) })}
          </p>
          <p className="mt-1 t-caption leading-5 text-ink2">
            {t('settlement.drift.description', {
              reported: formatVndExact(d.reportedBalance),
              ledger: formatVndExact(d.ledgerBalance),
              time: new Date(d.observedAt).toLocaleString('vi-VN'),
            })}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            disabled={updateAsset.isPending}
            onClick={() => void adjust(d.assetId, d.suggestedValue)}
          >
            {t('settlement.drift.adjust')}
          </Button>
        </li>
      ))}
    </ul>
  )
}
