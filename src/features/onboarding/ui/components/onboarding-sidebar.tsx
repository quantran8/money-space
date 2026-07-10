import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function OnboardingSidebar() {
  const { t } = useTranslation()

  return (
    <aside className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
      <div className="lg:sticky lg:top-10">
        <span className="inline-flex rounded-full bg-[hsl(var(--card))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--accent))] shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          {t('onboarding.sidebar.eyebrow')}
        </span>

        <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl">
          {t('onboarding.sidebar.title')}
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-7 text-[hsl(var(--muted-foreground))]">
          {t('onboarding.sidebar.description')}
        </p>

        <div className="mt-8 rounded-3xl bg-[hsl(var(--card))] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-sm font-semibold text-[hsl(var(--primary-foreground))]">
              1
            </span>
            <div>
              <p className="text-sm font-semibold">{t('onboarding.sidebar.stepTitle')}</p>
              <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {t('onboarding.sidebar.stepDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsla(var(--accent),0.1)] text-[hsl(var(--accent))]">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{t('onboarding.sidebar.privacyTitle')}</p>
              <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {t('onboarding.sidebar.privacyDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
