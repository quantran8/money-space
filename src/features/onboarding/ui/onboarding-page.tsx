import { useTranslation } from 'react-i18next'

import { AssetFormDialog } from '@/features/assets/ui/components/asset-form-dialog'
import { useAssetsPage } from '@/features/assets/hooks/use-assets-page'
import { useOnboardingPage } from '@/features/onboarding/hooks/use-onboarding-page'
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard'
import { OnboardingForm } from '@/features/onboarding/ui/components/onboarding-form'
import { OnboardingHeader } from '@/features/onboarding/ui/components/onboarding-header'
import { WizardShell } from '@/features/onboarding/ui/components/wizard-shell'
import {
  CashflowStep,
  FirstPictureStep,
  FirstWhatIfStep,
  MainGoalStep,
} from '@/features/onboarding/ui/components/wizard-steps'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Onboarding — the spec's steps folded into 9 screens (04 §onboarding), resumable
 * via `{onboardingStep, householdId}` in the persisted household store.
 *
 * It ends on two deliberate beats: the **Clarity Moment** (the household's
 * first financial picture) and the **Consequence Moment** (their first
 * what-if). Those are the product's thesis, so the setup earns its length by
 * paying off in them rather than dumping the user on an empty Home.
 *
 * Every step composes an existing slice — this is a sequence over features that
 * already exist, never a second implementation of them.
 */
export function OnboardingPage() {
  const { t } = useTranslation()
  const wizard = useOnboardingWizard()
  const { user, form, isCreating, submit } = useOnboardingPage()
  const assetsPage = useAssetsPage()

  const stepTitle = t(`onboarding.steps.${wizard.step}.title`)
  const stepDescription = t(`onboarding.steps.${wizard.step}.description`)

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] p-4 text-[hsl(var(--foreground))] md:p-6">
      <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-3xl overflow-hidden rounded-[32px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_18px_48px_rgba(0,0,0,0.06)] md:min-h-[calc(100vh-3rem)]">
        <OnboardingHeader user={user} />

        <section className="px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-10">
          {/*
            Step 1 keeps the existing household-creation form: it is the one
            step that must complete before any other slice has a household to
            write against.
          */}
          {wizard.step === 'household' ? (
            <WizardShell
              title={stepTitle}
              description={stepDescription}
              stepIndex={wizard.stepIndex}
              stepCount={wizard.stepCount}
              isFirstStep={wizard.isFirstStep}
              isLastStep={false}
              canContinue={!isCreating}
              isBusy={isCreating}
              onBack={wizard.goBack}
              onNext={() => {
                // Creating the household IS this step's "next".
                void submit()
              }}
            >
              <OnboardingForm form={form} isCreating={isCreating} onSubmit={submit} />
            </WizardShell>
          ) : (
            <WizardShell
              title={stepTitle}
              description={stepDescription}
              stepIndex={wizard.stepIndex}
              stepCount={wizard.stepCount}
              isFirstStep={wizard.isFirstStep}
              isLastStep={wizard.isLastStep}
              canContinue={wizard.canProceed}
              onBack={wizard.goBack}
              onNext={() => (wizard.isLastStep ? void wizard.finish() : wizard.advance())}
              // Everything after the household is optional — a user who wants
              // to look around first must not be trapped in setup.
              onSkip={wizard.isLastStep ? undefined : wizard.advance}
            >
              {wizard.step === 'financial_mode' ? <FinancialModePlaceholder /> : null}

              {wizard.step === 'invite' ? (
                <Card>
                  <p className="text-sm leading-6 text-ink2">
                    {t('onboarding.steps.invite.hint')}
                  </p>
                </Card>
              ) : null}

              {wizard.step === 'money_sources' ? (
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-ink2">
                    {t('onboarding.steps.money_sources.hint')}
                  </p>
                  {/* Reuses the real asset dialog, so holder + sharing are the
                      same fields as everywhere else. */}
                  <Button variant="outline" onClick={assetsPage.openCreate}>
                    {t('onboarding.steps.money_sources.add')}
                  </Button>
                </div>
              ) : null}

                  {wizard.step === 'recurring_income' ? (
                <CashflowStep direction="incoming" />
              ) : null}
              {wizard.step === 'obligations' ? <CashflowStep direction="outgoing" /> : null}
              {wizard.step === 'main_goal' ? <MainGoalStep /> : null}
              {wizard.step === 'first_picture' ? <FirstPictureStep /> : null}
              {wizard.step === 'first_whatif' ? <FirstWhatIfStep /> : null}
            </WizardShell>
          )}
        </section>
      </div>

      <AssetFormDialog
        open={assetsPage.formOpen}
        onOpenChange={assetsPage.handleFormOpenChange}
        form={assetsPage.form}
        setValue={assetsPage.setValue}
        mode={assetsPage.mode}
        walletOptions={assetsPage.walletOptions}
        isEditing={assetsPage.isEditing}
        isSubmitting={assetsPage.isSubmitting}
        onSubmit={assetsPage.submit}
      />
    </main>
  )
}

/** Financial mode is 5 radios (§11); the household config route lands with it. */
function FinancialModePlaceholder() {
  const { t } = useTranslation()
  return (
    <Card>
      <p className="text-sm leading-6 text-ink2">
        {t('onboarding.steps.financial_mode.hint')}
      </p>
    </Card>
  )
}
