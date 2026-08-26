import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CalmNoteCard } from '@/features/freshness/ui/components/calm-note-card'
import { useFreshness } from '@money-space/core/features/freshness/hooks/use-freshness'

/**
 * Home section 7 — Freshness.
 *
 * When everything is current this is a quiet reassurance, not a blank space.
 * When something is stale it states the fact and offers the one-tap
 * "nothing changed" confirmation — never a reprimand.
 */
export function FreshnessSection() {
  const { t } = useTranslation()
  const { freshness, isLoading, confirmUnchanged } = useFreshness()

  if (isLoading || !freshness) {
    return (
      <Card>
        <div className="h-16 animate-pulse rounded-2xl bg-muted" />
      </Card>
    )
  }

  if (!freshness.needsAttention) {
    return (
      <CalmNoteCard
        icon={ShieldCheck}
        title={t('freshness.upToDate.title')}
        description={t('freshness.upToDate.description', {
          count: freshness.total,
        })}
      />
    )
  }

  const staleIds = freshness.items
    .filter((item) => item.state === 'stale')
    .map((item) => item.assetId)

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{t('freshness.needsCheck.title')}</p>
          <p className="mt-1 t-body-sm leading-6 text-ink2">
            {t('freshness.needsCheck.description', {
              count: freshness.counts.stale,
              days: freshness.oldestDaysSinceUpdate ?? 0,
            })}
          </p>
        </div>
        <Button
          variant="outline"
          className="shrink-0"
          disabled={confirmUnchanged.isPending}
          onClick={() => confirmUnchanged.mutate(staleIds)}
        >
          <RefreshCw className="mr-2 size-4" strokeWidth={1.8} />
          {t('freshness.confirmUnchanged')}
        </Button>
      </div>
    </Card>
  )
}
