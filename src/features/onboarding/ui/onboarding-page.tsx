import { useOnboardingPage } from '@/features/onboarding/hooks/use-onboarding-page'
import { OnboardingForm } from '@/features/onboarding/ui/components/onboarding-form'
import { OnboardingHeader } from '@/features/onboarding/ui/components/onboarding-header'
import { OnboardingSidebar } from '@/features/onboarding/ui/components/onboarding-sidebar'

export function OnboardingPage() {
  const { user, form, isCreating, submit } = useOnboardingPage()

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] p-4 text-[hsl(var(--foreground))] md:p-6">
      <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[32px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_18px_48px_rgba(0,0,0,0.06)] md:min-h-[calc(100vh-3rem)]">
        <OnboardingHeader user={user} />

        <div className="grid min-h-[calc(100vh-7.5rem)] lg:grid-cols-[.78fr_1.22fr]">
          <OnboardingSidebar />

          <section className="px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-10">
            <OnboardingForm form={form} isCreating={isCreating} onSubmit={submit} />
          </section>
        </div>
      </div>
    </main>
  )
}
