import { useTranslation } from 'react-i18next'

import { formatVndShort } from '@/shared/lib/format-money'

type ComputedPreviewProps = {
  value: number | null
}

export function ComputedPreview({ value }: ComputedPreviewProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between rounded-2xl border border-dashed border-[hsl(var(--accent))] px-4 py-3">
      <span className="text-sm text-[hsl(var(--muted-foreground))]">
        {t('assets.form.computedValue')}
      </span>
      <span className="money-number text-lg text-[hsl(var(--accent))]">
        {value === null ? t('assets.form.computedUnavailable') : formatVndShort(value)}
      </span>
    </div>
  )
}
