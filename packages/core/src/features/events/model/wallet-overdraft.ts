import type { EventWalletImpact } from '#/features/events/api/events.repository'
import { formatMoney } from '#/shared/lib/format-money'

type Translate = (key: string, values?: Record<string, unknown>) => string

/**
 * The sentence to show before an edit or delete that would leave a wallet
 * overdrawn — or `null` when nothing would.
 *
 * Editing an event replays each wallet it touches from that wallet's opening
 * balance, so changing a back-dated amount re-bases everything after it (see
 * wallet-replay-on-edit). A negative result is permitted — it truthfully records
 * spending in excess of income — so this is a warning the household reads before
 * confirming, never a block.
 *
 * Lives in core rather than beside a screen because web and mobile show the same
 * warning in their own dialogs.
 */
export function describeOverdraft(
  impact: EventWalletImpact | undefined,
  t: Translate,
  language?: string,
): string | null {
  if (!impact || impact.isClear || impact.wallets.length === 0) {
    return null
  }
  const locale = language?.startsWith('en') ? 'en-US' : 'vi-VN'

  // One wallet is the common case and deserves the specific sentence: which
  // wallet, how deep, and from when. Several wallets only happens on a transfer,
  // where naming each one's depth would bury the point.
  if (impact.wallets.length === 1) {
    const wallet = impact.wallets[0]
    return t('events.history.overdraftWarning', {
      wallet: wallet.assetName,
      // The balance is negative; the sentence already says "âm"/"negative", so
      // show the magnitude rather than repeating the sign.
      amount: formatMoney(Math.abs(wallet.lowestBalance)),
      date: formatDay(wallet.firstOverdraftDate, locale),
    })
  }
  return t('events.history.overdraftWarningMany', {
    count: impact.wallets.length,
    wallets: impact.wallets.map((wallet) => wallet.assetName).join(', '),
  })
}

function formatDay(isoDate: string, locale: string): string {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) {
    return isoDate
  }
  return parsed.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
