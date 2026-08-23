/**
 * Number input formatting for the app's forms.
 *
 * Users type pure numbers; we display them grouped with a "." thousands
 * separator (Vietnamese convention), e.g. 10000 -> "10.000". The RAW value
 * stored in the form state is always a plain, separator-free string of digits
 * (money) or digits with a single "," decimal (quantities) — never grouped —
 * so downstream parsing stays trivial (`Number(raw)`).
 */

const GROUP_SEPARATOR = '.'
const DECIMAL_SEPARATOR = ','

/**
 * Keep only the digits from user input (for whole-number money fields).
 * Drops leading zeros but preserves a single "0".
 */
export function sanitizeIntegerInput(input: string): string {
  const digits = input.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return digits
}

/**
 * Keep digits plus at most one decimal separator (for quantity / rate fields).
 * Accepts "." or "," as the decimal mark and normalizes to ",".
 */
export function sanitizeDecimalInput(input: string): string {
  const normalized = input.replace(/\./g, DECIMAL_SEPARATOR)
  let seenSeparator = false
  let out = ''
  for (const char of normalized) {
    if (char >= '0' && char <= '9') {
      out += char
    } else if (char === DECIMAL_SEPARATOR && !seenSeparator && out.length > 0) {
      out += DECIMAL_SEPARATOR
      seenSeparator = true
    }
  }
  return out
}

/** Group the integer part of a raw numeric string with "." separators. */
export function groupThousands(raw: string): string {
  if (!raw) return ''
  const [intPart, decPart] = raw.split(DECIMAL_SEPARATOR)
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR)
  return decPart !== undefined ? `${grouped}${DECIMAL_SEPARATOR}${decPart}` : grouped
}

/** Format a raw integer money string ("10000") for display ("10.000"). */
export function formatIntegerDisplay(raw: string): string {
  return groupThousands(sanitizeIntegerInput(raw))
}

/** Format a raw decimal string ("5,5") for display ("5,5" grouped). */
export function formatDecimalDisplay(raw: string): string {
  return groupThousands(sanitizeDecimalInput(raw))
}

/** Parse a raw (separator-free) money string into a VND number, or NaN. */
export function parseRawMoney(raw: string): number {
  const cleaned = raw.replace(/\./g, '').trim()
  if (cleaned === '') return NaN
  return Number(cleaned)
}

/** Parse a raw decimal string ("5,5") into a number, or NaN. */
export function parseRawDecimal(raw: string): number {
  const cleaned = raw.replace(/\./g, '').replace(DECIMAL_SEPARATOR, '.').trim()
  if (cleaned === '') return NaN
  return Number(cleaned)
}
