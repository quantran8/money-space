import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'

/**
 * Chrome shared by every wizard screen: progress, title, body, and the
 * back/next pair. Screens supply only their own fields.
 */
export function WizardShell({
  title,
  description,
  stepIndex,
  stepCount,
  isFirstStep,
  isLastStep,
  canContinue = true,
  isBusy = false,
  onBack,
  onNext,
  onSkip,
  children,
}: {
  title: string
  description?: string
  stepIndex: number
  stepCount: number
  isFirstStep: boolean
  isLastStep: boolean
  canContinue?: boolean
  isBusy?: boolean
  onBack: () => void
  onNext: () => void
  /** Present only on steps the user is genuinely allowed to skip. */
  onSkip?: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: stepCount }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= stepIndex ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]',
            )}
          />
        ))}
      </div>

      <p className="mt-6 text-sm text-[hsl(var(--muted-foreground))]">
        {t('onboarding.wizard.stepCounter', {
          current: stepIndex + 1,
          total: stepCount,
        })}
      </p>
      <h1 className="page-title mt-2 text-3xl font-semibold">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
      ) : null}

      <div className="mt-6 flex-1 space-y-4">{children}</div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} disabled={isFirstStep || isBusy}>
          {t('onboarding.wizard.back')}
        </Button>

        <div className="flex items-center gap-2">
          {onSkip ? (
            <Button variant="ghost" onClick={onSkip} disabled={isBusy}>
              {t('onboarding.wizard.skip')}
            </Button>
          ) : null}
          <Button onClick={onNext} disabled={!canContinue || isBusy}>
            {isLastStep ? t('onboarding.wizard.finish') : t('onboarding.wizard.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
