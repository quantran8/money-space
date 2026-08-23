/**
 * Household invites (spec §6). Mirrors the backend's `invites` module entities.
 *
 * An invite is a **token**, not an email. The email/phone fields exist so the
 * inviter can note who a token was meant for, but nothing in the join flow
 * depends on them — whoever holds the token and is signed in can accept. That
 * is what makes a QR code a complete invitation: the code *is* the token.
 */

/** Matches the backend `InviteStatus` enum exactly — `cancelled` is withdrawal. */
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export type HouseholdInvite = {
  id: string
  householdId: string
  invitedById: string
  inviteeEmail: string | null
  inviteePhone: string | null
  /** The secret. Returned to the INVITER only — it is what the QR encodes. */
  token: string
  status: InviteStatus
  expiresAt: string
  acceptedById: string | null
  acceptedAt: string | null
  createdAt: string
  /**
   * Computed server-side from `expiresAt`. The stored `status` is only updated
   * lazily, so a `pending` row can already be past its expiry — trust this.
   */
  expired?: boolean
}

/**
 * What the invitee sees BEFORE accepting: who is asking, and nothing about the
 * household's money. A token holder has been granted nothing yet.
 */
export type InvitePreview = {
  householdName: string
  invitedByName: string | null
  status: InviteStatus
  expiresAt: string
  /** True when the token is still usable — the only thing the UI branches on. */
  acceptable: boolean
}

export type AcceptInviteResult = {
  householdId: string
  memberId: string
  alreadyMember: boolean
}

/** The route a scanned QR code opens. Kept next to the types so both sides agree. */
export const JOIN_ROUTE = '/join'

/** Query params on the join route. Named once so both sides cannot drift. */
export const JOIN_PARAM_HOUSEHOLD = 'household'
export const JOIN_PARAM_TOKEN = 'token'

/**
 * The absolute URL encoded into the QR.
 *
 * Carries **both** the household id and the invite token, and needs both:
 *
 * - `household` says which household the code is for, so the join screen can
 *   name the destination and route there without waiting on a round-trip;
 * - `token` is what actually authorizes the join. There is no join-by-id on the
 *   server — `POST /api/invites/:token/accept` is the only way in, because a
 *   household id is not a secret (it appears in every request path a member
 *   makes) and anything scannable by an id alone would be an open door.
 *
 * The base is injected by the host, because what makes a scannable link differs
 * per platform: the web uses its own origin (the person scanning is on a phone
 * next to the person sharing, so the origin that works for the inviter works
 * for them), while the mobile app has no origin and shares a `moneyspace://`
 * deep link instead.
 *
 * On localhost the web's QR only scans from the same machine — expected in dev,
 * and the copyable link covers it.
 */
let joinUrlBase = 'http://localhost:5173'

/** Set once at startup: `window.location.origin` on web, the scheme on native. */
export function configureJoinUrlBase(base: string) {
  if (base.trim()) joinUrlBase = base
}

export function buildJoinUrl(householdId: string, token: string) {
  const url = new URL(JOIN_ROUTE, joinUrlBase)
  url.searchParams.set(JOIN_PARAM_HOUSEHOLD, householdId)
  url.searchParams.set(JOIN_PARAM_TOKEN, token)
  return url.toString()
}

/** A pending, not-yet-expired invite is the one worth putting on screen. */
export function isShareable(invite: HouseholdInvite) {
  return invite.status === 'pending' && !invite.expired
}

/** Tokens are `randomUUID()` server-side, so a bare code is a plain UUID. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ParsedInvite = { token: string; householdId: string | null }

/**
 * Reads an invite out of whatever the user actually pastes or scans.
 *
 * Accepts the full join URL, a URL from a different origin (someone sharing
 * from staging, or a link mangled by a chat app into a bare host), and a bare
 * token on its own — because the thing people paste is whatever their clipboard
 * happened to hold, and rejecting a recognizable token on a formatting
 * technicality is the most annoying possible failure here.
 *
 * The `household` param is optional: it only names the destination, so an invite
 * missing it still joins correctly (the accept response is authoritative).
 * Returns `null` when there is no token to be found — the one thing that is not
 * recoverable.
 */
export function parseInviteInput(input: string): ParsedInvite | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (UUID_RE.test(trimmed)) return { token: trimmed, householdId: null }

  // A bare `example.com/join?...` has no scheme, so `new URL` would throw.
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }

  const token = url.searchParams.get(JOIN_PARAM_TOKEN)?.trim()
  if (token) {
    return { token, householdId: url.searchParams.get(JOIN_PARAM_HOUSEHOLD)?.trim() || null }
  }

  // Tolerate the older path shape (`/join/<token>`) and any link that simply
  // ends in the token.
  const last = url.pathname.split('/').filter(Boolean).pop()
  if (last && UUID_RE.test(last)) return { token: last, householdId: null }

  return null
}

/** The in-app path to send a parsed invite to. */
export function joinPathFor({ token, householdId }: ParsedInvite): string {
  const params = new URLSearchParams()
  if (householdId) params.set(JOIN_PARAM_HOUSEHOLD, householdId)
  params.set(JOIN_PARAM_TOKEN, token)
  return `${JOIN_ROUTE}?${params.toString()}`
}
