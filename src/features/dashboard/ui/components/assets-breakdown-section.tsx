import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { AssetBucket } from '@/features/dashboard/model/dashboard'
import { formatVndShort } from '@/shared/lib/format-money'

type AssetsBreakdownSectionProps = {
  buckets: AssetBucket[]
}

/** Segment/legend swatch color per bucket, drawn from the design-system tokens. */
const BUCKET_COLOR: Record<AssetBucket['key'], string> = {
  saving: 'hsl(var(--accent))',
  invest: 'hsl(var(--foreground))',
  gold: 'hsl(var(--status-orange))',
  cash: 'hsl(var(--muted-foreground))',
}

/**
 * "Tiền đang ở đâu?" (mockup `#assets`): a segmented share bar over a legend
 * list breaking the household's assets into four glanceable buckets.
 */
export function AssetsBreakdownSection({ buckets }: AssetsBreakdownSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-[28px] border border-border bg-card p-6 apple-shadow-soft xl:col-span-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t('dashboard.redesign.assets.eyebrow')}
          </p>
          <h3 className="section-title mt-1 text-xl font-semibold">
            {t('dashboard.redesign.assets.title')}
          </h3>
        </div>
        <Link
          to="/assets"
          className="text-sm font-medium text-[hsl(var(--muted-foreground))] transition hover:text-foreground"
        >
          {t('dashboard.redesign.assets.viewAll')}
        </Link>
      </div>

      {buckets.length === 0 ? (
        <p className="mt-8 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t('dashboard.redesign.assets.empty')}
        </p>
      ) : (
        <>
          <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
            {buckets.map((bucket) => (
              <div
                key={bucket.key}
                style={{ width: `${bucket.percent}%`, backgroundColor: BUCKET_COLOR[bucket.key] }}
              />
            ))}
          </div>

          <div className="mt-6 divide-y divide-border">
            {buckets.map((bucket) => (
              <div
                key={bucket.key}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: BUCKET_COLOR[bucket.key] }}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {t(`dashboard.redesign.assets.bucket.${bucket.key}`)}
                    </p>
                    <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                      {t('dashboard.redesign.assets.share', { percent: bucket.percent })}
                    </p>
                  </div>
                </div>
                <p className="money-number text-sm">{formatVndShort(bucket.value)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
