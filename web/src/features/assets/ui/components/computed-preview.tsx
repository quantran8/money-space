import { useTranslation } from 'react-i18next'

import { formatVndShort } from '@money-space/core/shared/lib/format-money'

type ComputedPreviewProps = {
  value: number | null
}

export function ComputedPreview({ value }: ComputedPreviewProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between rounded-[18px] bg-accent-tint px-5 py-4">
      <span className="t-body-sm text-ink2">
        {t('assets.form.computedValue')}
      </span>
      <span className="money-number t-subhead font-medium text-action">
        {value === null ? t('assets.form.computedUnavailable') : formatVndShort(value)}
      </span>
    </div>
  )
}
