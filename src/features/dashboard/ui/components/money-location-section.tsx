import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'
import type { AssetBucket } from '@/features/dashboard/model/dashboard'
import { formatVndShort } from '@/shared/lib/format-money'

/**
 * Home section 5 — Money Location ("Tiền đang ở đâu?").
 *
 * Borrows the segmented share bar from the old `assets-breakdown-section.tsx`.
 *
 * The plan calls for grouping by **holder** by default. Assets do not carry a
 * holder field until Phase 11 adds `financial_nature` / holder / sharing, so
 * `holders` is empty for now and the section falls back to the bucket
 * breakdown. Once Phase 11 lands, pass real holder rows and this renders the
 * intended default with no further change here.
 */
const BUCKET_COLOR: Record<AssetBucket['key'], string> = {
  saving: 'hsl(var(--accent))',
  invest: 'hsl(var(--foreground))',
  gold: 'hsl(var(--status-orange))',
  cash: 'hsl(var(--muted-foreground))',
}

export type HolderRow = {
  id: string
  name: string
  amount: number
  percent: number
}

export function MoneyLocationSection({
  buckets,
  holders,
}: {
  buckets: AssetBucket[]
  holders: HolderRow[]
}) {
  const { t } = useTranslation()

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title text-xl font-semibold">{t('home.moneyLocation.title')}</h2>
        <Link
          to="/assets"
          className="text-sm font-medium text-[hsl(var(--muted-foreground))] transition hover:text-foreground"
        >
          {t('home.moneyLocation.viewAll')}
        </Link>
      </div>

      {buckets.length === 0 ? (
        <p className="mt-8 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t('home.moneyLocation.empty')}
        </p>
      ) : (
        <>
          <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
            {buckets.map((bucket) => (
              <div
                key={bucket.key}
                style={{
                  width: `${bucket.percent}%`,
                  backgroundColor: BUCKET_COLOR[bucket.key],
                }}
              />
            ))}
          </div>

          {/* Grouped by holder — "who is responsible for this money", never
              "who spent it" (design §16). */}
          {holders.length > 0 ? (
            <div className="mt-6 divide-y divide-border">
              {holders.map((holder) => (
                <div
                  key={holder.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{holder.name}</p>
                    <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                      {t('home.moneyLocation.share', { percent: holder.percent })}
                    </p>
                  </div>
                  <p className="money-number shrink-0 text-sm font-semibold">
                    {formatVndShort(holder.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 divide-y divide-border">
              {buckets.map((bucket) => (
                <div
                  key={bucket.key}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: BUCKET_COLOR[bucket.key] }}
                    />
                    <p className="text-sm font-medium">
                      {t(`dashboard.redesign.assets.bucket.${bucket.key}`)}
                    </p>
                  </div>
                  <p className="money-number shrink-0 text-sm font-semibold">
                    {formatVndShort(bucket.value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
