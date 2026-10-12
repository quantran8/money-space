import { env } from '#/shared/api/env'
import type { BankNotificationEvent } from '#/features/bank-sync/model/bank-sync.types'

/** The URL a user pastes into the Shortcut. */
export function bankIngestUrl(): string {
  return new URL('/api/v1/bank-notifications/ingest', env.apiBaseUrl).toString()
}

/** Signed VND, or null when the parser found no amount. */
export function signedEventAmount(event: BankNotificationEvent): number | null {
  if (event.amount === null || !event.direction) return null
  return event.direction === 'IN' ? event.amount : -event.amount
}

/** The best time we have for an event, and which clock it came from. */
export function eventTime(event: BankNotificationEvent): string {
  return event.transactionAt ?? event.notificationAt ?? event.receivedAt
}

/** Translated reason, falling back for a code the client does not know yet. */
export function reasonText(t: (key: string) => string, reason: string | null): string {
  const key = `bankSync.inbox.reason.${reason ?? 'fallback'}`
  const text = t(key)
  return text === key ? t('bankSync.inbox.reason.fallback') : text
}
