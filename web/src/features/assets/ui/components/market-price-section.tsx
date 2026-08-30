import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { MarketQuote } from '@money-space/core/features/assets/api/symbols.repository'
import { formatMoney } from '@money-space/core/shared/lib/format-money'
import { formatRelativeDay } from '@money-space/core/shared/lib/format-relative-day'
import { cn } from '@money-space/core/shared/lib/utils'

type MarketPriceSectionProps = {
  quote: MarketQuote | null
  isLoading: boolean
  isFetching: boolean
  isUnavailable: boolean
  unit: string
  onRefresh: () => void
  /** Where the divider goes: above the fields (buy) or below them (sell). */
  placement?: 'top' | 'bottom'
}

/**
 * What one unit trades at right now, beside the fields it informs.
 *
 * A reading, not a control — it states the market's number so the household can
 * see how the price they are about to record compares. Inline rows under a
 * divider rather than a tinted card (§8): nothing floats, and a fill here would
 * make a live figure look like a warning.
 *
 * Renders nothing at all when the instrument cannot be priced, rather than
 * holding an empty row open — neither a purchase nor a sale depends on it.
 */
export function MarketPriceSection({
  quote,
  isLoading,
  isFetching,
  isUnavailable,
  unit,
  onRefresh,
  placement = 'top',
}: MarketPriceSectionProps) {
  const { t } = useTranslation()
  const edge = placement === 'top' ? 'border-b border-divider pb-4' : 'border-t border-divider pt-4'

  if (isLoading) {
    return (
      <p className={cn(edge, 't-body-sm text-ink3')} aria-live="polite">
        {t('assets.form.market.quoteLoading')}
      </p>
    )
  }

  if (isUnavailable || !quote) return null

  const observed = new Date(quote.priceTime)
  const isRealDate = !Number.isNaN(observed.getTime())

  return (
    <section className={edge} aria-live="polite">
      <div className="flex items-baseline justify-between gap-5">
        <div className="flex items-center gap-2">
          <span className="t-body-sm text-ink2">{t('assets.marketPrice.label')}</span>
          {/* The price shown is cached — server-side for 5 minutes — so this
              asks for it again rather than promising a brand-new tick. */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            aria-label={t('assets.marketPrice.refresh')}
            title={t('assets.marketPrice.refresh')}
            className="s-tap -m-1 rounded-full p-1 text-ink3 transition-opacity hover:opacity-70 disabled:opacity-40"
          >
            <RefreshCw
              className={cn('size-3.5', isFetching && 'animate-spin')}
              strokeWidth={1.75}
            />
          </button>
        </div>
        <span className="num t-subhead font-medium">
          {/* Priced in the quote's OWN currency: a USD quote that reached here
              must read as USD, never relabelled as đồng. */}
          {quote.quoteCurrency === 'VND'
            ? formatMoney(quote.price)
            : `${quote.price} ${quote.quoteCurrency}`}
        </span>
      </div>

      <div className="mt-1 flex items-baseline justify-between gap-5">
        <span className="t-caption text-ink3">
          {/* "hôm nay" / "hôm qua" rather than a bare date — how STALE the
              price is, is the point of the line; a reader should not have to
              subtract dates to find out. The clock time stays: unlike the
              journal, where `formatRelativeDay` is day-granular on purpose,
              a quote genuinely moves through the trading day. */}
          {isRealDate
            ? t('assets.marketPrice.observedAt', {
                time: observed.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                date: formatRelativeDay(quote.priceTime, t),
              })
            : null}
        </span>
        {unit ? (
          <span className="shrink-0 t-caption text-ink3">
            {t('assets.marketPrice.perUnit', { unit })}
          </span>
        ) : null}
      </div>
    </section>
  )
}
