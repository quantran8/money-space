/**
 * Client-side copy of the code rules.
 *
 * Duplicated from `backend/src/modules/billing/domain/redeem-code-format.ts`
 * — about twenty lines, specced on the backend copy — rather than introducing a
 * shared package for it. What it buys: a mistyped character is caught here, so
 * the field says so instantly, with no request and no rate-limit attempt spent.
 *
 * The server re-checks everything regardless. This is only ever an early no.
 */
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const PREFIX = 'OURS'
const RANDOM_LENGTH = 7
const BODY_LENGTH = RANDOM_LENGTH + 1

const NORMALIZED_PATTERN = new RegExp(`^${PREFIX}[${CODE_ALPHABET}]{${BODY_LENGTH}}$`)

function checksum(body: string): string {
  let total = 0
  for (const char of body) total += CODE_ALPHABET.indexOf(char)
  return CODE_ALPHABET[total % CODE_ALPHABET.length]
}

/**
 * Fold what was typed into the canonical form.
 *
 * The confusable mapping is what matters for a Vietnamese audience: codes
 * arrive as a screenshot in a Zalo message and get typed by hand, so someone
 * entering the letter they SEE still matches the stored code. The prefix is
 * left alone — `OURS` contains two of the letters the fold rewrites, and
 * folding it would turn every code into `0VRS…`.
 */
export function normalizeRedeemCode(raw: string): string {
  const cleaned = (raw ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (!cleaned.startsWith(PREFIX)) return cleaned

  const body = cleaned
    .slice(PREFIX.length)
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V')

  return `${PREFIX}${body}`
}

export function isValidRedeemCode(normalized: string): boolean {
  if (!NORMALIZED_PATTERN.test(normalized)) return false
  const body = normalized.slice(PREFIX.length)
  return checksum(body.slice(0, RANDOM_LENGTH)) === body[RANDOM_LENGTH]
}

/** `OURS01123456` → `OURS-0112-3456`. What the field shows while typing. */
export function formatRedeemCode(normalized: string): string {
  const body = normalized.slice(PREFIX.length)
  if (!normalized.startsWith(PREFIX)) return normalized
  if (body.length <= 4) return body ? `${PREFIX}-${body}` : PREFIX
  return `${PREFIX}-${body.slice(0, 4)}-${body.slice(4, 8)}`
}

/** Full length of a normalized code, for knowing when to validate. */
export const REDEEM_CODE_LENGTH = PREFIX.length + BODY_LENGTH
