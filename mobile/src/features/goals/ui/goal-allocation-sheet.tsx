import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import type {
  GoalAllocationKind,
  GoalAllocationPayload,
  GoalAllocationRecord,
  GoalAllocationRole,
} from '@money-space/core/features/goals/api/goals.repository'
import { parseAmount } from '@money-space/core/features/goals/model/goals'
import {
  defaultAllocationRole,
  formatAmount,
  isWalletAssetType,
} from '@money-space/core/features/goals/model/goals-form'

import {
  BottomSheet,
  Button,
  ConsequenceNote,
  MoneyInput,
  PercentInput,
  Segmented,
  Select,
} from '@/components/ui'

import type { AllocationAssetOption } from '@/features/goals/ui/types'

/**
 * Add or change one asset's share of a goal.
 *
 * A share is declared either as a **fixed amount** ("50tr of my stocks", which
 * stays put when the asset reprices) or as a **percent** ("all of my gold",
 * which moves with it) — and that choice belongs to a `holding` alone. A wallet
 * has no market price, so "a share of whatever it is worth" says nothing a
 * plain amount does not; what the household means is "this much of this account
 * is for the goal".
 *
 * The role control appears only for a wallet. Nothing is ever paid INTO gold on
 * a schedule, so a holding is the only thing gold can be, and a control with one
 * possible answer only invites a mistake.
 *
 * The primary button is never disabled (§22.10): pressing it reports what is
 * missing instead of leaving the household guessing.
 *
 * State is seeded once per mount. The caller passes a `key` that changes with
 * the row being edited, so React remounts this with fresh values — no effect
 * syncing props into state, and no draft leaking into the next open.
 */
export function GoalAllocationSheet({
  open,
  onClose,
  goalName,
  assetOptions,
  editing,
  isSubmitting,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  goalName: string
  /**
   * On add: the assets not already counted towards this goal. On edit: only the
   * asset being edited — swapping it is not an edit of this share, it is
   * removing one claim and making another.
   */
  assetOptions: AllocationAssetOption[]
  editing?: GoalAllocationRecord
  isSubmitting: boolean
  onSubmit: (payload: GoalAllocationPayload) => Promise<boolean>
}) {
  const { t } = useTranslation()

  const [submitted, setSubmitted] = useState(false)
  const [assetId, setAssetId] = useState(editing?.assetId ?? '')
  // A contribution share is always stated as an amount. A share made as a
  // percent through the API would otherwise open here showing a % box under the
  // "already behind the goal" label — the one place the two could disagree
  // about what the number means.
  const [kind, setKind] = useState<GoalAllocationKind>(
    editing?.role === 'contribution' ? 'fixed' : (editing?.kind ?? 'fixed'),
  )
  const [role, setRole] = useState<GoalAllocationRole>(
    editing?.role ??
      defaultAllocationRole(
        assetOptions.find((option) => option.value === editing?.assetId)?.type,
      ),
  )
  const [amount, setAmount] = useState(
    editing?.allocatedAmount != null
      ? String(editing.allocatedAmount)
      : // Converted from a percent above: seed with what the share is worth
        // today, so the household sees the real figure rather than an empty
        // field they have to guess at.
        editing?.role === 'contribution' && editing.kind === 'percent'
        ? String(Math.round(editing.currentValue))
        : '',
  )
  const [percent, setPercent] = useState(editing?.percent != null ? String(editing.percent) : '')
  const [monthly, setMonthly] = useState(
    editing?.monthlyContribution != null ? String(editing.monthlyContribution) : '',
  )

  const asset = useMemo(
    () => assetOptions.find((option) => option.value === assetId),
    [assetId, assetOptions],
  )

  // A contribution share is a wallet, always: money is only ever put in through
  // one, and a monthly amount has to name the account it comes out of.
  const selectableAssets = useMemo(
    () =>
      role === 'contribution'
        ? assetOptions.filter((option) => isWalletAssetType(option.type))
        : assetOptions,
    [assetOptions, role],
  )

  const canDeclareMonthly = isWalletAssetType(asset?.type) && role === 'contribution'
  const numericAmount = parseAmount(amount)
  const numericMonthly = canDeclareMonthly ? parseAmount(monthly) : 0
  const numericPercent = Number(percent)
  const percentValid = numericPercent > 0 && numericPercent <= 100

  // A wallet may hold nothing for the goal yet — that is what "we start saving
  // 6tr a month from here" looks like on day one. It cannot be empty in both
  // senses, though: no money behind it and none coming claims nothing at all.
  const contributionEmpty = role === 'contribution' && numericAmount <= 0 && numericMonthly <= 0

  const assetError = submitted && !assetId ? t('goals.allocations.assetRequired') : undefined
  const amountError =
    submitted &&
    kind === 'fixed' &&
    (role === 'contribution' ? contributionEmpty : numericAmount <= 0)
      ? role === 'contribution'
        ? t('goals.allocations.contributionEmpty')
        : t('goals.allocations.amountRequired')
      : undefined
  const percentError =
    submitted && kind === 'percent' && !percentValid
      ? t('goals.allocations.percentRange')
      : undefined

  /** What this share is worth right now — the §22.7 consequence. */
  const counted = asset
    ? kind === 'percent'
      ? percentValid
        ? (asset.balance * numericPercent) / 100
        : 0
      : Math.min(numericAmount, asset.balance)
    : 0

  async function handleSubmit() {
    setSubmitted(true)
    if (!assetId) return
    if (kind === 'fixed' && (role === 'contribution' ? contributionEmpty : numericAmount <= 0)) {
      return
    }
    if (kind === 'percent' && !percentValid) return

    // Always sent, `null` included: clearing the field has to retract the
    // declared amount, and omitting it would leave the stored one in place.
    const monthlyContribution = canDeclareMonthly
      ? monthly.trim() === ''
        ? null
        : parseAmount(monthly)
      : null

    const saved = await onSubmit(
      kind === 'percent'
        ? { assetId, kind, role, monthlyContribution, percent: numericPercent }
        : { assetId, kind, role, monthlyContribution, allocatedAmount: numericAmount },
    )
    if (saved) onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editing ? t('goals.allocations.editTitle') : t('goals.allocations.dialogTitle')}
      footer={
        <View className="gap-2">
          <Button onPress={handleSubmit} loading={isSubmitting}>
            {editing ? t('goals.allocations.saveEdit') : t('goals.allocations.save')}
          </Button>
          <Button variant="secondary" onPress={onClose}>
            {t('common.cancel')}
          </Button>
        </View>
      }
    >
      <Text className="mb-4 t-body-sm text-ink2">{goalName}</Text>

      <View className="gap-4">
        {/* Locked while editing: swapping the asset is not an edit of this
            share. `Select` with one option still reads as a settled choice. */}
        <Select
          label={t('goals.allocations.assetLabel')}
          placeholder={t('goals.allocations.assetPlaceholder')}
          value={assetId || null}
          error={assetError}
          options={selectableAssets.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          onChange={(next) => {
            if (editing) return
            setAssetId(next)
            // Re-seed the role: picking gold where a wallet stood must not
            // leave the share counting as a monthly contribution.
            const nextType = assetOptions.find((option) => option.value === next)?.type
            const nextRole = defaultAllocationRole(nextType)
            setRole(nextRole)
            if (!isWalletAssetType(nextType)) setMonthly('')
            if (nextRole === 'contribution') {
              setKind('fixed')
              setPercent('')
            }
          }}
        />

        {/* Which question this share answers: money going in monthly, or value
            already held. Only the first feeds the pace — gold's price moving is
            not the household keeping or missing a pace. */}
        {isWalletAssetType(asset?.type) ? (
          <Segmented
            label={t('goals.allocations.roleLabel')}
            value={role}
            onChange={(next) => {
              setRole(next)
              if (next === 'contribution') {
                setKind('fixed')
                setPercent('')
              }
            }}
            options={[
              { value: 'contribution', label: t('goals.allocations.roleContribution') },
              { value: 'holding', label: t('goals.allocations.roleHolding') },
            ]}
          />
        ) : null}

        {/* What this wallet puts in each month. The goal's pace is the sum
            across its wallets, so this is where it is actually edited. */}
        {canDeclareMonthly ? (
          <MoneyInput
            label={t('goals.allocations.monthlyLabel')}
            value={monthly}
            onChange={setMonthly}
          />
        ) : null}

        {/* Fixed or percent — a choice only a holding has. */}
        {role === 'contribution' ? null : (
          <Segmented
            label={t('goals.allocations.kindLabel')}
            value={kind}
            onChange={setKind}
            options={[
              { value: 'fixed', label: t('goals.allocations.kindFixed') },
              { value: 'percent', label: t('goals.allocations.kindPercent') },
            ]}
          />
        )}

        {kind === 'fixed' ? (
          <MoneyInput
            // Next to the monthly box above, "amount" alone reads as the same
            // question twice: this one is what the wallet ALREADY has behind
            // the goal, that one is what it adds each month.
            label={
              role === 'contribution'
                ? t('goals.allocations.countedLabel')
                : t('goals.allocations.amountLabel')
            }
            value={amount}
            onChange={setAmount}
            error={amountError}
          />
        ) : (
          <PercentInput
            label={t('goals.allocations.percentLabel')}
            value={percent}
            onChange={setPercent}
            error={percentError}
          />
        )}

        {/* §22.7 — one sentence, updating per keystroke. It also carries the
            difference between the two kinds, so neither needs helper text. */}
        <ConsequenceNote>
          {!asset
            ? t('goals.allocations.previewEmpty')
            : `${
                kind === 'percent'
                  ? t('goals.allocations.previewPercent', { name: asset.name })
                  : t('goals.allocations.previewFixed', { name: asset.name })
              } ${t('goals.allocations.previewCounted')} ${formatAmount(counted)}.`}
        </ConsequenceNote>
      </View>
    </BottomSheet>
  )
}
