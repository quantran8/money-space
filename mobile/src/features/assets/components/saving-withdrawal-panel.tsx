import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react-native'

import {
  computeSavingEarly,
  computeSavingOnTime,
  termMonthsOf,
  type CalculationTerm,
} from '@money-space/core/features/assets/model/assets'
import { formatVndShort } from '@money-space/core/shared/lib/format-money'

import { CaveatNote, GroupedRow, Panel, PanelHeader, RowMetaMono, Sunk } from '@/components/ui'
import { TOUCH_TARGET, colors } from '@/theme/tokens'

/**
 * Rút đúng hạn vs rút trước hạn, for a saving deposit.
 *
 * Both figures are DISPLAY projections derived from the term — they never touch
 * the stored valuation. `computeCurrentValue` stays the single source of truth
 * for what the deposit is worth.
 *
 * A stepper rather than the web's slider: a 1pt-precision drag on a term of
 * twelve months is a control that fights the thumb, and the reader wants a
 * specific month, not a sweep.
 *
 * The comparison is a three-column table on the web. Here it is one grouped row
 * per line item with both figures on the right — no horizontal scroll, and the
 * two columns still line up because every amount is tabular.
 */
export function SavingWithdrawalPanel({ term }: { term: CalculationTerm }) {
  const { t } = useTranslation()
  const termMonths = termMonthsOf(term)

  // A sub-month term has no meaningful "early" point to pick.
  const hasEarly = termMonths > 1
  const [month, setMonth] = useState(() => (hasEarly ? Math.max(1, Math.floor(termMonths / 2)) : 1))
  const maxMonth = Math.max(termMonths - 1, 1)
  const clampedMonth = Math.min(Math.max(month, 1), maxMonth)

  const onTime = computeSavingOnTime(term)
  const early = computeSavingEarly(term, clampedMonth)
  // Never show a below-zero payout (an extreme rate/tenor edge case).
  const earlyTotal = Math.max(0, early.total)
  const difference = onTime.total - earlyTotal

  return (
    <Panel>
      <PanelHeader
        title={t('assets.detail.withdrawal.title')}
        right={<RowMetaMono>{t(`options.interestPayment.${term.interestPayment}`)}</RowMetaMono>}
      />

      {hasEarly ? (
        <Sunk className="mt-5 flex-row items-center justify-between">
          <Text className="flex-1 text-[13px] text-ink2">
            {t('assets.detail.withdrawal.withdrawMonth', {
              month: clampedMonth,
              total: termMonths,
            })}
          </Text>
          <View className="flex-row items-center gap-1">
            <StepButton
              icon="minus"
              label={t('assets.detail.withdrawal.withdrawMonth', {
                month: Math.max(clampedMonth - 1, 1),
                total: termMonths,
              })}
              onPress={() => setMonth(Math.max(clampedMonth - 1, 1))}
            />
            <StepButton
              icon="plus"
              label={t('assets.detail.withdrawal.withdrawMonth', {
                month: Math.min(clampedMonth + 1, maxMonth),
                total: termMonths,
              })}
              onPress={() => setMonth(Math.min(clampedMonth + 1, maxMonth))}
            />
          </View>
        </Sunk>
      ) : null}

      {/* Column headings, once. The rows below carry the two figures in the
          same order, so the labels do not repeat per row. */}
      <View className="mt-5 flex-row items-center justify-end gap-4 pb-1">
        <Text className="w-[86px] text-right text-[11px] text-ink3">
          {t('assets.detail.withdrawal.onTime')}
        </Text>
        <Text className="w-[86px] text-right text-[11px] text-ink3">
          {t('assets.detail.withdrawal.early')}
        </Text>
      </View>

      <ComparisonRow
        label={t('assets.detail.withdrawal.principal')}
        onTime={onTime.principal}
        early={early.principal}
      />
      <ComparisonRow
        // A negative early interest is the bank clawing back what it already
        // paid, which is a different fact from "less interest" and is named so.
        label={
          early.interest < 0
            ? t('assets.detail.withdrawal.clawback')
            : t('assets.detail.withdrawal.interest')
        }
        onTime={onTime.interest}
        early={early.interest}
        earlyTone={early.interest < 0 ? 'attention' : 'default'}
      />
      <ComparisonRow
        label={t('assets.detail.withdrawal.total')}
        onTime={onTime.total}
        early={earlyTotal}
        emphasis
      />

      {/* The consequence of withdrawing early, in money. Attention, not alert:
          this is a cost to weigh, not a mistake — the product never tells a
          household what it should do. */}
      <CaveatNote className="mt-4">
        {`${t('assets.detail.withdrawal.difference')}: −${formatVndShort(Math.abs(difference))}`}
      </CaveatNote>
    </Panel>
  )
}

function ComparisonRow({
  label,
  onTime,
  early,
  earlyTone = 'default',
  emphasis = false,
}: {
  label: string
  onTime: number
  early: number
  earlyTone?: 'default' | 'attention'
  emphasis?: boolean
}) {
  return (
    <GroupedRow
      title={label}
      right={
        <View className="flex-row items-center gap-4">
          <Amount value={onTime} muted={!emphasis} />
          <Amount value={early} muted={!emphasis} tone={earlyTone} />
        </View>
      }
      className={emphasis ? 'mt-1' : undefined}
    />
  )
}

function Amount({
  value,
  muted,
  tone = 'default',
}: {
  value: number
  muted: boolean
  tone?: 'default' | 'attention'
}) {
  const color = tone === 'attention' ? 'text-attention' : muted ? 'text-ink2' : 'text-ink'
  return (
    <Text
      className={`w-[86px] text-right text-[14px] ${muted ? '' : 'font-medium'} ${color}`}
      style={{ fontVariant: ['tabular-nums'] }}
    >
      {value < 0 ? '−' : ''}
      {formatVndShort(Math.abs(value))}
    </Text>
  )
}

function StepButton({
  icon,
  label,
  onPress,
}: {
  icon: 'minus' | 'plus'
  label: string
  onPress: () => void
}) {
  const Icon = icon === 'minus' ? Minus : Plus
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
      className="items-center justify-center rounded-control bg-panel active:opacity-80"
    >
      <Icon size={16} color={colors.ink} strokeWidth={2} />
    </Pressable>
  )
}
