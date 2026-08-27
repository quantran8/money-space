import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { AppLogo } from '@/components/ui/app-logo'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The Oursight wordmark. Shared by the brand panel and the mobile header so
 * the mark itself is authored once; only the surface it sits on differs.
 */
export function AuthLogo({
  className,
  markClassName,
}: {
  className?: string
  markClassName?: string
}) {
  const { t } = useTranslation()

  return (
    <Link
      to="/"
      className={cn('inline-flex w-fit items-center gap-3 font-medium tracking-[-0.02em]', className)}
    >
      <AppLogo className={markClassName} />
      <span>{t('auth.brand.appName')}</span>
    </Link>
  )
}
