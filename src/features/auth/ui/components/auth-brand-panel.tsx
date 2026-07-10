import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** The dark, full-height brand panel shown alongside the auth form on large screens. */
export function AuthBrandPanel() {
  const { t } = useTranslation()

  const stats = [
    { label: t('auth.brand.stats.usableLabel'), value: t('auth.brand.stats.usableValue') },
    { label: t('auth.brand.stats.dueLabel'), value: t('auth.brand.stats.dueValue') },
    { label: t('auth.brand.stats.goalLabel'), value: t('auth.brand.stats.goalValue') },
  ]

  return (
    <section className="relative hidden overflow-hidden bg-[hsl(var(--primary))] p-10 text-[hsl(var(--primary-foreground))] lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-24 -top-24 size-80 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-[hsla(var(--accent),0.2)] blur-3xl" />

      <div className="relative z-10 inline-flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-[hsl(var(--primary))] shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <Wallet className="size-6" />
        </span>
        <span className="text-lg font-semibold tracking-[-0.03em]">{t('auth.brand.appName')}</span>
      </div>

      <div className="relative z-10 max-w-xl">
        <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/80">
          {t('auth.brand.eyebrow')}
        </span>
        <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-[-0.055em]">
          {t('auth.brand.title')}
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
          {t('auth.brand.description')}
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur"
          >
            <p className="text-xs font-medium text-white/50">{stat.label}</p>
            <p className="money-number mt-2 text-xl font-semibold tracking-[-0.04em]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
