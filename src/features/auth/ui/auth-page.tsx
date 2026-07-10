import { useAuthPage } from '@/features/auth/hooks/use-auth-page'
import { AuthBrandPanel } from '@/features/auth/ui/components/auth-brand-panel'
import { AuthMobileHeader } from '@/features/auth/ui/components/auth-mobile-header'
import { AuthTabs } from '@/features/auth/ui/components/auth-tabs'
import { LoginView } from '@/features/auth/ui/components/login-view'
import { SignupView } from '@/features/auth/ui/components/signup-view'

export function AuthPage() {
  const {
    tab,
    setTab,
    googlePending,
    loginForm,
    signupForm,
    submitLogin,
    submitSignup,
    onGoogle,
  } = useAuthPage()

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] p-4 text-[hsl(var(--foreground))] md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[32px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_18px_48px_rgba(0,0,0,0.06)] md:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_.95fr]">
        <AuthBrandPanel />

        <section className="flex items-center justify-center px-5 py-8 sm:px-10 md:px-14 lg:px-16">
          <div className="w-full max-w-md">
            <AuthMobileHeader />

            <AuthTabs tab={tab} onTabChange={setTab} />

            {tab === 'login' ? (
              <LoginView
                form={loginForm}
                onSubmit={submitLogin}
                onGoogle={onGoogle}
                googlePending={googlePending}
                onSwitchToSignup={() => setTab('signup')}
              />
            ) : (
              <SignupView
                form={signupForm}
                onSubmit={submitSignup}
                onGoogle={onGoogle}
                googlePending={googlePending}
                onSwitchToLogin={() => setTab('login')}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
