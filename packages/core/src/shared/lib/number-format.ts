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
 *
 * "." is ALWAYS a group separator here and is dropped; "," is the one decimal
 * mark. That mirrors `sanitizeIntegerInput` and is what lets the grouped
 * display round-trip: these fields render through `formatDecimalDisplay`, so
 * every keystroke feeds the previous GROUPED text back in. Reading "." as a
 * decimal made the display its own input — typing 83000 showed "8.300", which
 * came back as "8,3000". A pasted "78821.21" must therefore use "," (or be
 * pasted grouped); the field's own output never contains a decimal dot.
 */
export function sanitizeDecimalInput(input: string): string {
  const normalized = input.replace(/\./g, '')
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
