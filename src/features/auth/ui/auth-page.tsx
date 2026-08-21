import type { ReactNode } from 'react'

import { AuthBrandPanel } from '@/features/auth/ui/components/auth-brand-panel'
import { AuthMobileHeader } from '@/features/auth/ui/components/auth-mobile-header'

/**
 * Shell shared by `/auth` and `/auth/signup`.
 *
 * Login and signup are separate routes, not tabs: each is a destination people
 * link to and land on directly, and a tab would make the URL lie about which
 * one is showing.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-app text-ink antialiased">
      <div className="mx-auto flex min-h-screen w-full max-w-[1360px] items-stretch px-5 py-5 sm:px-7 sm:py-7 lg:px-10 lg:py-10">
        <div className="grid w-full gap-5 lg:grid-cols-[1.08fr_.92fr] lg:gap-8">
          <AuthBrandPanel />

          <section className="flex items-center justify-center">
            <div className="w-full max-w-[500px] rounded-panel bg-panel px-6 py-8 sm:px-10 sm:py-10 lg:px-11 lg:py-11">
              <AuthMobileHeader />
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
