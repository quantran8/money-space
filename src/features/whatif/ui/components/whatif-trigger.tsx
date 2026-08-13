import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useWhatIfStore, type WhatIfPrefill } from '@/shared/stores/whatif-store'
import { cn } from '@/shared/lib/utils'

/**
 * Opens the global what-if sheet. Use this anywhere the question "what happens
 * if we spend this?" makes sense — Home, /upcoming, /goals, /goals/:id.
 */
export function WhatIfTrigger({
  prefill,
  variant = 'outline',
  className,
}: {
  prefill?: WhatIfPrefill
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}) {
  const { t } = useTranslation()
  const openWhatIf = useWhatIfStore((state) => state.openWhatIf)

  return (
    <Button variant={variant} className={className} onClick={() => openWhatIf(prefill)}>
      <Sparkles className="mr-2 size-4" strokeWidth={1.8} />
      {t('whatif.cta')}
    </Button>
  )
}

/** Mobile-only floating action button; hidden on desktop where the CTA is inline. */
export function WhatIfFab() {
  const { t } = useTranslation()
  const openWhatIf = useWhatIfStore((state) => state.openWhatIf)

  return (
    <button
      type="button"
      aria-label={t('whatif.cta')}
      onClick={() => openWhatIf({ source: 'other' })}
      className={cn(
        // Sits above the mobile bottom nav rather than on top of it.
        'fixed bottom-24 right-5 z-40 flex size-14 items-center justify-center rounded-full',
        'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-apple',
        'transition-transform active:scale-95 lg:hidden',
      )}
    >
      <Sparkles className="size-6" strokeWidth={1.8} />
    </button>
  )
}
