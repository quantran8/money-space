import { JOIN_ROUTE } from '@/features/invites/model/invites.types'

/**
 * Where to land after a successful sign-in.
 *
 * `?next=` comes from the URL bar, so it is attacker-controllable and must be
 * constrained to an in-app path: a value like `https://evil.example` or
 * `//evil.example` handed to `navigate()` would be an open redirect, and
 * `/auth` itself would loop. Anything that is not a plain single-slash path
 * falls back to the dashboard.
 */
export function resolveNextPath(next: string | null): string {
  if (!next) return '/'
  if (!next.startsWith('/') || next.startsWith('//')) return '/'
  if (next === '/auth' || next.startsWith('/auth/') || next.startsWith('/auth?')) return '/'
  return next
}

/**
 * Router state attached when a successful sign-in hands control to `?next=`.
 *
 * `/join` uses it to accept the invite without a second tap: someone who just
 * created an account *in order to* open an invite link has already said yes —
 * once by opening the link, again by signing up. Asking a third time is a
 * confirmation of a decision they already made twice.
 *
 * Deliberately router **state** rather than a query param. State can only be
 * set by our own auth completion inside this router session, so a forwarded or
 * bookmarked URL cannot auto-join anyone; it also does not survive a reload,
 * which degrades to the ordinary confirm screen — the safe direction.
 */
export type AuthHandoffState = { fromAuth: true }

export const authHandoffState: AuthHandoffState = { fromAuth: true }

/** True when this navigation is the tail end of a sign-in. */
export function isAuthHandoff(state: unknown): boolean {
  return (state as AuthHandoffState | null)?.fromAuth === true
}

/** Whether `?next=` points at the invite-join route. */
export function isJoinPath(path: string): boolean {
  return path === JOIN_ROUTE || path.startsWith(`${JOIN_ROUTE}?`)
}
