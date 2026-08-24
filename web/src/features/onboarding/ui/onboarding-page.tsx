import { useState, type ReactNode } from 'react'
import { ArrowLeft, ChevronRight, Home, QrCode } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useOnboardingPage } from '@money-space/core/features/onboarding/hooks/use-onboarding-page'
import { OnboardingForm } from '@/features/onboarding/ui/components/onboarding-form'
import { OnboardingHeader } from '@/features/onboarding/ui/components/onboarding-header'
import { JoinByCodePanel } from '@/features/invites/ui/components/join-by-code-panel'

type Mode = 'choose' | 'create' | 'join'

/**
 * Onboarding — one question, two answers: **create a household, or join one.**
 *
 * This replaced a nine-screen wizard (financial mode, money sources, recurring
 * income, obligations, first goal, first picture, first what-if). Every one of
 * those screens set up a feature that already has its own entry point inside the
 * app, so the wizard was asking for the household's entire financial position
 * before showing them anything — and a resumable step meant closing the tab
 * pinned you back into setup rather than letting you in.
 *
 * What is left is the only thing that genuinely must happen before the app can
 * render at all: the user needs a household to write against. Everything else
 * they can now do from the place that owns it, in whatever order they like.
 *
 * Every screen here is a heading and the controls that answer it. No eyebrow, no
 * paragraph explaining the heading — the two cards, the one field and the one
 * code box say what they are, and copy above them only delayed the answer.
 */
export function OnboardingPage() {
  const [mode, setMode] = useState<Mode>('choose')
  const { user, form, isCreating, submit } = useOnboardingPage()

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <OnboardingHeader user={user} />

      <div className="mx-auto w-full max-w-[960px] px-5 pb-12 pt-3 sm:px-7 sm:pb-16 sm:pt-7">
        <section className="panel p-5 sm:p-8 lg:p-10">
          {mode === 'choose' ? (
            <ChooseMode onCreate={() => setMode('create')} onJoin={() => setMode('join')} />
          ) : (
            <BackTo onBack={() => setMode('choose')}>
              {mode === 'create' ? (
                <OnboardingForm form={form} isCreating={isCreating} onSubmit={submit} />
              ) : (
                <JoinByCodePanel />
              )}
            </BackTo>
          )}
        </section>
      </div>
    </main>
  )
}

/** The back link and the branch it returns from, in one column. */
function BackTo({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-[620px]">
      <button
        type="button"
        onClick={onBack}
        className="mb-7 -ml-1 flex min-h-11 items-center gap-2 rounded-control px-1 text-[13px] text-ink2 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-[17px]" strokeWidth={1.8} aria-hidden />
        {t('onboarding.choose.back')}
      </button>

      {children}
    </div>
  )
}

/**
 * The two branches, side by side and equally weighted.
 *
 * Creating is not the default and joining is not the afterthought: the second
 * person in a couple is *always* a joiner, so exactly half of the people who
 * ever see this screen are here for the right-hand card. Burying it behind
 * "already have an invite?" small print would hide the path from the person with
 * the least patience for hunting — the one who just scanned a code and got sent
 * here instead.
 */
function ChooseMode({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="page-title max-w-[620px] text-[31px] leading-[1.2] sm:text-[38px]">
        {t('onboarding.choose.title')}
      </h1>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <ModeCard
          icon={<Home className="size-[22px]" strokeWidth={1.75} aria-hidden />}
          title={t('onboarding.choose.create.title')}
          onClick={onCreate}
        />
        <ModeCard
          icon={<QrCode className="size-[22px]" strokeWidth={1.75} aria-hidden />}
          title={t('onboarding.choose.join.title')}
          onClick={onJoin}
        />
      </div>
    </div>
  )
}

function ModeCard({
  icon,
  title,
  onClick,
}: {
  icon: ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[176px] flex-col rounded-card bg-wash p-6 text-left transition-[background-color,transform] duration-150 hover:-translate-y-px hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2 sm:p-7"
    >
      <span className="flex size-11 items-center justify-center rounded-control bg-accent-soft text-action transition-colors group-hover:bg-action group-hover:text-white">
        {icon}
      </span>

      <span className="mt-auto flex items-center justify-between pt-8">
        <span className="text-[18px] font-medium">{title}</span>
        <ChevronRight
          className="size-[18px] text-action transition-transform group-hover:translate-x-[3px]"
          strokeWidth={1.8}
          aria-hidden
        />
      </span>
    </button>
  )
}
