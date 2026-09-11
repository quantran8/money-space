/**
 * The copy for a failed action. Never the server's own words.
 *
 * A server message is a diagnostic — English, sometimes carrying an id or a
 * Prisma/Supabase detail — so it is logged, never shown. The caller's `fallback`
 * is what the user reads. See memory/error-handling.md.
 */
export function getErrorMessage(error: unknown, fallback: string) {
  if (error !== undefined && error !== null) {
    logServerDetail(error)
  }

  return fallback
}

/** Keeps the real cause reachable in devtools without putting it on screen. */
function logServerDetail(error: unknown) {
  if (typeof console === 'undefined') return
  console.error('[api]', error)
}
