import { Redirect, usePathname, useLocalSearchParams } from 'expo-router'

import { useSession } from '@money-space/core/features/auth/hooks/use-session'

import type { ReactNode } from 'react'

/**
 * Gate for authenticated routes. Sends anyone without a session to /auth.
 *
 * The blocked path travels along as `?next=`, so signing in returns the user
 * where they were headed. That exists for the invite QR: someone scanning
 * `moneyspace://join?household=…&token=…` is almost never signed in on that
 * device, and dropping the URL on the way to the login screen would silently
 * discard the invitation.
 *
 * `isLoading` is not cosmetic here. It tracks the auth store's `hydrated` flag,
 * and on native reading the keychain is a real round trip — rendering the
 * redirect before it lands would sign the user out on every cold start.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useSession()
  const pathname = usePathname()
  const params = useLocalSearchParams<Record<string, string>>()

  if (isLoading) return null

  if (!isAuthenticated) {
    const query = Object.entries(params)
      .filter(([key, value]) => key !== 'next' && typeof value === 'string')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&')
    const next = query ? `${pathname}?${query}` : pathname
    return <Redirect href={`/auth?next=${encodeURIComponent(next)}`} />
  }

  return <>{children}</>
}
