import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The Money Space wordmark. Shared by the brand panel and the mobile header so
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
      className={cn('inline-flex w-fit items-center gap-3 font-semibold tracking-[-0.02em]', className)}
    >
      <span className={cn('grid place-items-center text-action', markClassName)}>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h9.75a1.5 1.5 0 0 1 1.5 1.5v1.5H7.5A2.5 2.5 0 0 0 5 10v7.25A2.25 2.25 0 0 0 7.25 19.5h10.5A2.25 2.25 0 0 0 20 17.25V10a2.5 2.5 0 0 0-2.5-2.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M15.5 11.25h4.25v4.5H15.5a2.25 2.25 0 0 1 0-4.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="16.25" cy="13.5" r=".75" fill="currentColor" />
        </svg>
      </span>
      <span>{t('auth.brand.appName')}</span>
    </Link>
  )
}
