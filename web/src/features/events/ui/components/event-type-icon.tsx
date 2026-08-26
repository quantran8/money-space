import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Circle,
  Gem,
  Landmark,
  ReceiptText,
  RefreshCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { MoneyEventItem } from '@money-space/core/features/events/model/events.types'

export type EventTypeKey = MoneyEventItem['type']

/**
 * One glyph per kind of money event, shared by every list that shows them.
 *
 * The type used to be a text line under each row's title ("Điều chỉnh · TCB"),
 * which spent a whole line restating something the row's own shape already
 * implies. As a glyph it costs 24px, leaves the title the full width, and still
 * carries the words for a screen reader and on hover — every caller labels it.
 *
 * Keyed by the WIDER `MoneyEventItem['type']` rather than the timeline's
 * `RecordType`, because the asset page draws raw events and those include
 * `asset_update`, which the timeline model folds into `adjustment`.
 */
export const EVENT_TYPE_ICONS: Record<EventTypeKey, LucideIcon> = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
  asset_purchase: Gem,
  asset_sale: Gem,
  asset_update: RefreshCw,
  payment_paid: ReceiptText,
  debt_update: Landmark,
  adjustment: RefreshCw,
  other: Circle,
}

/**
 * Read it as `EVENT_TYPE_ICONS[type]` at the call site rather than through a
 * helper that returns one: a capitalised binding assigned from a CALL trips
 * `react-hooks/static-components`, which cannot tell a lookup from a component
 * factory. A plain member access is the same thing and stays legible to it.
 */
