import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'
import { useAssets } from '@money-space/core/features/assets/hooks/use-assets'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

/** Assets summary + link (Phase 10). The full management surface stays on `/assets`. */
export function HouseholdAssetsCard() {
  const { t } = useTranslation()
  const { assets, summary, isLoading } = useAssets()

  const total = summary?.groups?.reduce((sum, group) => sum + group.value, 0) ?? 0

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="t-title">{t('household.assets.title')}</h2>
        <Link
          to="/networth"
          className="flex items-center gap-1 t-body-sm font-medium text-ink2 transition hover:text-foreground"
        >
          {t('household.assets.viewAll')}
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-5 h-12 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <div className="mt-5 flex items-baseline justify-between gap-4">
          <p className="t-body-sm text-ink2">
            {t('household.assets.count', { count: assets.length })}
          </p>
          <p className="money-number t-metric font-medium">{formatVndShort(total)}</p>
        </div>
      )}
    </Card>
  )
}
