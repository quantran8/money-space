import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns'

import {
  ALLOWED_HORIZONS,
  type HorizonDays,
} from '#/features/forecast/model/forecast.types'
import type { ForecastDay, ForecastResult } from '#/features/forecast/model/forecast.types'

/**
 * The window the Sắp tới page is currently answering for.
 *
 * Three shapes, because a household asks the question three ways:
 *  - **rolling** — "the next N days", counted from today;
 *  - **month** — a calendar period ("tháng này", "tháng sau"), which is how
 *    bills and salary actually land;
 *  - **custom** — an explicit pair of dates.
 *
 * The API only accepts `horizon_days` from a fixed set, so the last two are
 * resolved to dates here and the result is windowed client-side. That is a
 * presentation concern, not a second forecast: every figure still comes from
 * the one balance walk the server ran.
 */
export type ForecastRange =
  | { kind: 'rolling'; days: HorizonDays }
  | { kind: 'month'; offset: 0 | 1 }
  | { kind: 'custom'; start: string; end: string }

export const DEFAULT_RANGE: ForecastRange = { kind: 'rolling', days: 30 }

/** ISO `yyyy-MM-dd`, the only date form that crosses the API boundary. */
const iso = (date: Date): string => format(date, 'yyyy-MM-dd')

/**
 * The concrete `[start, end]` a range covers, both inclusive.
 *
 * `today` is the forecast's own `asOfDate` rather than the device clock, so the
 * window can never disagree with the balance walk it is slicing — a phone an
 * hour ahead of the server must not shift the first day of the window.
 */
export function resolveRange(
  range: ForecastRange,
  today: string,
): { start: string; end: string } {
  const from = parseISO(today)

  if (range.kind === 'rolling') {
    return { start: today, end: iso(addDays(from, range.days)) }
  }

  if (range.kind === 'month') {
    const month = addMonths(from, range.offset)
    // The current month starts TODAY, not on the 1st: days already past are
    // not "sắp tới", and including them would put settled events in a window
    // labelled as upcoming.
    const start = range.offset === 0 ? from : startOfMonth(month)
    return { start: iso(start), end: iso(endOfMonth(month)) }
  }

  // A backwards custom range is normalised rather than rejected — the picker
  // can hand back either order while the user is mid-selection.
  return range.start <= range.end
    ? { start: range.start, end: range.end }
    : { start: range.end, end: range.start }
}

/**
 * The smallest allowed horizon that still reaches the window's end.
 *
 * Falls back to the largest when nothing covers it; `windowForecast` then
 * reports the shortfall as `truncated` rather than quietly answering for a
 * shorter period than the label promises.
 */
export function horizonFor(range: ForecastRange, today: string): HorizonDays {
  const { end } = resolveRange(range, today)
  const needed = differenceInCalendarDays(parseISO(end), parseISO(today))

  return (
    ALLOWED_HORIZONS.find((horizon) => horizon >= needed) ??
    ALLOWED_HORIZONS[ALLOWED_HORIZONS.length - 1]
  )
}

export type RangeSummary = {
  /** Days inside the window, in order. */
  days: ForecastDay[]
  /** Lowest closing balance in the window. MAY BE NEGATIVE — never clamped. */
  lowest: number
  lowestDate: string
  incoming: number
  outgoing: number
  /** Occurrences behind each total. Only what the forecast BANKS is counted. */
  incomingCount: number
  outgoingCount: number
  /**
   * True when the window runs past what the largest allowed horizon covers, so
   * the figures describe a SHORTER period than the label. The caller must say
   * so — a total that silently stops early is worse than no total (§23).
   */
  truncated: boolean
  /** The last day actually covered. Equals the requested end unless truncated. */
  coveredEnd: string
}

/**
 * Recompute the summary for one window of an existing forecast.
 *
 * The balance walk is the server's and is never redone — this only slices it.
 * `lowest` is the minimum CLOSING balance among the window's days, which is the
 * same quantity §12.2 reports, just measured over a different span: for a
 * window that starts in the future the walk has already carried today's
 * balance forward to it, so the figure stays the real projected balance rather
 * than a total of the window's own movements.
 *
 * Both totals count only occurrences the forecast banks. An estimated inflow or
 * an unconfirmed outflow still appears in the table, marked, but folding it
 * into a total here would state it as known (§2.16).
 */
export function windowForecast(
  forecast: ForecastResult,
  start: string,
  end: string,
): RangeSummary {
  const days = forecast.days.filter((day) => day.date >= start && day.date <= end)

  const last = forecast.days[forecast.days.length - 1]
  const coveredEnd = last && last.date < end ? last.date : end

  let incoming = 0
  let outgoing = 0
  let incomingCount = 0
  let outgoingCount = 0

  for (const day of days) {
    for (const occurrence of day.occurrences) {
      if (!occurrence.countedInBalance) continue
      if (occurrence.direction === 'incoming') {
        incoming += occurrence.amount
        incomingCount += 1
      } else {
        outgoing += occurrence.amount
        outgoingCount += 1
      }
    }
  }

  // An empty window has no low point of its own. The opening balance of the
  // window is the honest answer — nothing happens in it, so the balance the
  // walk arrives with is the balance it keeps.
  const lowestDay = days.reduce<ForecastDay | undefined>(
    (low, day) => (low === undefined || day.closingBalance < low.closingBalance ? day : low),
    undefined,
  )

  return {
    days,
    lowest: lowestDay?.closingBalance ?? forecast.startingLiquidBalance,
    lowestDate: lowestDay?.date ?? start,
    incoming,
    outgoing,
    incomingCount,
    outgoingCount,
    truncated: coveredEnd < end,
    coveredEnd,
  }
}
