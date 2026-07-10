import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Compact brand mark shown above the form on small screens (brand panel is hidden there). */
export function AuthMobileHeader() {
  const { t } = useTranslation()
  return (
    <div className="mb-8 flex items-center justify-between lg:hidden">
      <div className="inline-flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
          <Wallet className="size-5" />
        </span>
        <span className="font-semibold tracking-[-0.03em]">{t('auth.brand.appName')}</span>
      </div>
    </div>
  )
}
