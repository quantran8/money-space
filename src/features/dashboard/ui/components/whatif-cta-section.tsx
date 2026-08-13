import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { WhatIfTrigger } from '@/features/whatif/ui/components/whatif-trigger'

/**
 * Home section 3 — the what-if CTA. Decision support is the thing people pay
 * for, so it sits above the fold rather than buried in a menu.
 */
export function WhatIfCtaSection() {
  const { t } = useTranslation()

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold">{t('home.whatifCta.title')}</p>
          <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {t('home.whatifCta.description')}
          </p>
        </div>
        <WhatIfTrigger prefill={{ source: 'home' }} variant="default" className="shrink-0" />
      </div>
    </Card>
  )
}
