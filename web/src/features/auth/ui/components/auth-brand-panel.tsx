import { useTranslation } from 'react-i18next'

import { AuthLogo } from '@/features/auth/ui/components/auth-logo'

/**
 * The left half of the auth screen on large screens.
 *
 * Sits directly on `--app` with no panel of its own: the form to its right is
 * the only white surface, so the page reads as one sheet with a single focal
 * point rather than two competing cards (design.md §2.1).
 */
export function AuthBrandPanel() {
  const { t } = useTranslation()

  const stats = [
    { value: t('auth.brand.stats.usableValue'), label: t('auth.brand.stats.usableLabel') },
    { value: t('auth.brand.stats.dueValue'), label: t('auth.brand.stats.dueLabel') },
    { value: t('auth.brand.stats.goalValue'), label: t('auth.brand.stats.goalLabel') },
  ]

  return (
    <section className="hidden min-h-[720px] flex-col justify-between px-3 py-2 lg:flex">
      <AuthLogo markClassName="size-11 rounded-[12px] bg-panel" className="text-[18px]" />

      <div className="max-w-[650px] pb-10">
        <p className="mb-5 text-[13px] font-medium text-accent">{t('auth.brand.eyebrow')}</p>

        <h1 className="max-w-[630px] text-[50px] font-medium leading-[1.08] tracking-[-0.035em] xl:text-[58px]">
          {t('auth.brand.titleLine1')}
          <br />
          {t('auth.brand.titleLine2')}
        </h1>

        <p className="mt-6 max-w-[580px] text-[16px] leading-7 text-ink2">
          {t('auth.brand.description')}
        </p>
      </div>

      {/* Sample figures, not the household's own — nobody is signed in yet.
          Kept inline and unboxed so they read as a caption under the pitch,
          never as live metrics the way a MetricCell would. */}
      <div className="mb-2 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-ink2">
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex items-center gap-6">
            {index > 0 ? (
              <span className="h-1 w-1 rounded-full bg-ink3/60" aria-hidden="true" />
            ) : null}
            <p>
              <span className="money-number font-medium text-ink">{stat.value}</span>
              <span className="ml-1">{stat.label}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
