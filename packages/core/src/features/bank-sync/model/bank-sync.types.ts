export type BankProviderCode = 'TECHCOMBANK' | 'VCB'
export const BANK_PROVIDERS: readonly BankProviderCode[] = ['TECHCOMBANK', 'VCB']

export type BankPostingMode = 'REVIEW' | 'AUTO'

export type BankEventStatus =
  | 'RECEIVED'
  | 'PARSE_FAILED'
  | 'UNMAPPED'
  | 'REVIEW'
  | 'PROCESSED'
  | 'DUPLICATE'
  | 'FAILED'
  | 'IGNORED'

/** The inbox tabs; FAILED shows beside REVIEW since both need a decision. */
export type BankInboxTab = 'unmapped' | 'review' | 'parse_failed'
export const BANK_INBOX_TAB_STATUSES: Record<BankInboxTab, BankEventStatus[]> = {
  unmapped: ['UNMAPPED'],
  review: ['REVIEW', 'FAILED'],
  parse_failed: ['PARSE_FAILED'],
}

export type BankCredential = {
  id: string
  deviceLabel: string
  tokenPrefix: string | null
  status: 'ACTIVE' | 'REVOKED'
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

/** `token` exists only in this response; it is never readable again. */
export type CreatedBankCredential = {
  credential: BankCredential
  token: string
}

export type BankSourceLink = {
  id: string
  assetId: string
  assetName: string
  postingMode: BankPostingMode
  validFrom: string
}

export type BankSource = {
  id: string
  providerCode: BankProviderCode
  sourceType: 'BANK_ACCOUNT' | 'EWALLET'
  last4: string | null
  displayLabel: string | null
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
  link: BankSourceLink | null
}

export type BankNotificationEvent = {
  id: string
  status: BankEventStatus
  statusReason: string | null
  providerCode: BankProviderCode | null
  appName: string
  last4: string | null
  /** Positive VND; the sign is `direction`. */
  amount: number | null
  direction: 'IN' | 'OUT' | null
  reportedBalance: number | null
  transactionAt: string | null
  notificationAt: string | null
  timeSource: 'CONTENT' | 'NOTIFICATION' | 'RECEIVED' | null
  receivedAt: string
  processedAt: string | null
  sourceId: string | null
  matchedAssetId: string | null
  moneyEventId: string | null
  /** Transfer content extracted from the body. */
  note: string
  /** Note-rule suggestion; see backend memory/cashflow-settlement.md. */
  suggestedCashflowEventId: string | null
  matchStatus: BankMatchStatus | null
  matchReason: string | null
  canReparse: boolean
}

export type BankMatchStatus = 'none' | 'matched' | 'ambiguous' | 'blocked' | 'replace_manual'

export type BankResolvePayload =
  | { action: 'post'; assetId?: string; cashflowEventId?: string }
  | { action: 'replace_manual'; assetId?: string; cashflowEventId: string }
  | { action: 'ignore' }

export type BankEventPage = {
  items: BankNotificationEvent[]
  nextCursor: string | null
}

export type BankEventCounts = {
  counts: Partial<Record<BankEventStatus, number>>
  total: number
}
