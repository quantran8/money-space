import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Consequence,
  Field,
  MoneyField,
  Num,
  Segmented,
  fieldControlReset,
  fieldShell,
} from '@/components/ui/form-22'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  GoalAllocationKind,
  GoalAllocationPayload,
  GoalAllocationRecord,
  GoalAllocationRole,
} from '@money-space/core/features/goals/api/goals.repository'
import { parseAmount } from '@money-space/core/features/goals/model/goals'
import {
  isWalletAssetType,
  defaultAllocationRole,
  formatAmount,
} from '@money-space/core/features/goals/model/goals-form'
import type { AllocationAssetOption } from '@/features/goals/ui/components/goal-allocations-section'
import { sanitizeIntegerInput } from '@money-space/core/shared/lib/number-format'

type GoalAllocationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  goalName: string
  /**
   * Assets selectable in this dialog. On add: those not already counted towards
   * this goal. On edit: the single asset being edited (it cannot be swapped —
   * changing which asset a share comes from is removing one claim and making
   * another).
   */
  assetOptions: AllocationAssetOption[]
  /** Present when editing an existing share; absent when adding a new one. */
  editing?: GoalAllocationRecord
  isSubmitting: boolean
  onSubmit: (payload: GoalAllocationPayload) => Promise<boolean>
}

/**
 * Add one asset's share to an asset-backed goal.
 *
 * A share is declared either as a **fixed amount** ("50tr of my stocks", which
 * stays put when the asset reprices) or as a **percent** ("all of my gold",
 * which moves with it). The choice is a segmented control per §22.3 rather than
 * two explanatory cards — §22.0 treats per-option helper text as an admin-form
 * signal, so the difference is stated once in the consequence sentence below,
 * which is where §22.7 says it belongs.
 *
 * The primary button is never disabled (§22.10): pressing it reports what is
 * missing instead of leaving the household guessing.
 */
export function GoalAllocationDialog({
  open,
  onOpenChange,
  goalName,
  assetOptions,
  editing,
  isSubmitting,
  onSubmit,
}: GoalAllocationDialogProps) {
  const { t } = useTranslation()
  // Seeded once per mount. The caller gives this component a `key` that changes
  // with the row being edited, so React remounts it with fresh state — no
  // effect syncing props into state, and no draft leaking into the next open.
  const [submitted, setSubmitted] = useState(false)
  const [assetId, setAssetId] = useState(editing?.assetId ?? '')
  // A contribution share is always stated as an amount, and its fixed/percent
  // control is hidden. A share made as a percent through the API would otherwise
  // open here showing a % box under the "already behind the goal" label — the
  // one place the two could disagree about what the number means.
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
      : // Converted from a percent above: seed the box with what the share is
        // worth today, so the household is shown the real figure rather than an
        // empty field they have to guess at.
        editing?.role === 'contribution' && editing.kind === 'percent'
        ? String(Math.round(editing.currentValue))
        : '',
  )
  const [percent, setPercent] = useState(
    editing?.percent != null ? String(editing.percent) : '',
  )
  const [monthly, setMonthly] = useState(
    editing?.monthlyContribution != null
      ? String(editing.monthlyContribution)
      : '',
  )

  const asset = useMemo(
    () => assetOptions.find((option) => option.value === assetId),
    [assetId, assetOptions],
  )

  // A contribution share is a wallet, always: money is only ever put in through
  // one, and the monthly amount has to name the account it comes out of. A
  // holding can be anything the household owns, wallets included.
  const selectableAssets = useMemo(
    () =>
      role === 'contribution'
        ? assetOptions.filter((option) => isWalletAssetType(option.type))
        : assetOptions,
    [assetOptions, role],
  )

  // Only a wallet acting as the goal's contribution source can declare a monthly
  // amount: a pace has to name the account the money comes out of, and the pace
  // panel measures kept-or-missed on contribution shares alone.
  const canDeclareMonthly = isWalletAssetType(asset?.type) && role === 'contribution'
  const numericAmount = parseAmount(amount)
  const numericMonthly = canDeclareMonthly ? parseAmount(monthly) : 0
  const numericPercent = Number(percent)
  const percentValid = numericPercent > 0 && numericPercent <= 100
  // A wallet may hold nothing for the goal yet — that is what "we start saving
  // 6tr a month from here" looks like on day one. It cannot be empty in both
  // senses, though: no money behind it and none coming claims nothing at all.
  const contributionEmpty =
    role === 'contribution' && numericAmount <= 0 && numericMonthly <= 0

  const assetError = submitted && !assetId ? t('goals.allocations.assetRequired') : undefined
  const amountError =
    submitted && kind === 'fixed' && (role === 'contribution' ? contributionEmpty : numericAmount <= 0)
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

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!assetId) return
    if (kind === 'fixed' && (role === 'contribution' ? contributionEmpty : numericAmount <= 0))
      return
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
        : {
            assetId,
            kind,
            role,
            monthlyContribution,
            allocatedAmount: numericAmount,
          },
    )
    if (saved) handleOpenChange(false)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="grid max-h-[92dvh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <ResponsiveDialogHeader className="px-5 pb-5 pt-5 pr-16 text-left sm:px-8 sm:pt-7 sm:pr-16">
          <ResponsiveDialogTitle className="text-[19px] font-medium tracking-[-0.015em]">
            {editing
              ? t('goals.allocations.editTitle')
              : t('goals.allocations.dialogTitle')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-[13px] text-ink2">
            {goalName}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          className="overflow-y-auto px-5 pb-5 sm:px-8 sm:pb-7"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="space-y-4">
            <Field
              label={t('goals.allocations.assetLabel')}
              htmlFor="allocation-asset"
              error={assetError}
            >
              <div className={fieldShell}>
                {/* Locked while editing: swapping the asset is not an edit of
                    this share, it is removing one claim and adding another. */}
                <Select
                  value={assetId}
                  onValueChange={(next) => {
                    setAssetId(next)
                    // Re-seed the role: picking gold where a wallet stood should
                    // not leave the share counting as monthly contribution.
                    const nextType = assetOptions.find(
                      (option) => option.value === next,
                    )?.type
                    const nextRole = defaultAllocationRole(nextType)
                    setRole(nextRole)
                    if (!isWalletAssetType(nextType)) setMonthly('')
                    // A contribution wallet counts as a share of its balance —
                    // see the role control below. Set here too, or an amount
                    // left over from the previous asset would be submitted with
                    // nothing on screen saying so.
                    if (nextRole === 'contribution') {
                      setKind('percent')
                      setPercent((current) => current || '100')
                      setAmount('')
                    }
                  }}
                  disabled={Boolean(editing)}
                >
                  <SelectTrigger id="allocation-asset" className={fieldControlReset}>
                    <SelectValue placeholder={t('goals.allocations.assetPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableAssets.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Field>

            {/* Which question this share answers: money going in monthly, or
                value already held. Only the first feeds the pace panel — gold's
                price movement is not the household keeping or missing a pace.
                Shown only for a wallet: nothing is ever paid INTO gold on a
                schedule, so a holding is the only thing it can be, and a control
                with one possible answer only invites a mistake. */}
            {isWalletAssetType(asset?.type) ? (
              <Field label={t('goals.allocations.roleLabel')}>
                <Segmented
                  value={role}
                  onChange={(next) => {
                    setRole(next)
                    // A contribution wallet is the account the goal is saved
                    // into, so the goal's share of it has to FOLLOW the balance:
                    // a figure typed once would sit still while the household
                    // kept saving. Full by default; a wallet split between two
                    // goals is what the share below is for.
                    if (next === 'contribution') {
                      setKind('percent')
                      setPercent((current) => current || '100')
                      setAmount('')
                    }
                  }}
                  options={[
                    {
                      value: 'contribution',
                      label: t('goals.allocations.roleContribution'),
                    },
                    { value: 'holding', label: t('goals.allocations.roleHolding') },
                  ]}
                />
              </Field>
            ) : null}

            {/* What this wallet puts in each month. The goal's pace is the sum
                across its wallets, so this is where it is actually edited. */}
            {canDeclareMonthly ? (
              <MoneyField
                id="allocation-monthly"
                label={t('goals.allocations.monthlyLabel')}
                value={monthly}
                onChange={setMonthly}
              />
            ) : null}

            {/* Fixed or percent — a choice only a holding has. A wallet's
                balance has no market price to track, so "a share of whatever it
                is worth" says nothing a plain amount does not; what the household
                means is "this much of this account is for the goal". */}
            {role === 'contribution' ? null : (
              <Field label={t('goals.allocations.kindLabel')}>
                <Segmented
                  value={kind}
                  onChange={setKind}
                  options={[
                    { value: 'fixed', label: t('goals.allocations.kindFixed') },
                    { value: 'percent', label: t('goals.allocations.kindPercent') },
                  ]}
                />
              </Field>
            )}

            {kind === 'fixed' ? (
              <MoneyField
                id="allocation-amount"
                // Next to the monthly box above, "amount" alone reads as the
                // same question twice: this one is what the wallet ALREADY has
                // behind the goal, that one is what it adds each month.
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
              <Field
                label={t('goals.allocations.percentLabel')}
                htmlFor="allocation-percent"
                error={percentError}
              >
                <div className={fieldShell}>
                  <input
                    id="allocation-percent"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="100"
                    value={percent}
                    onChange={(event) =>
                      setPercent(sanitizeIntegerInput(event.target.value).slice(0, 3))
                    }
                    className="num h-full w-full min-w-0 bg-transparent text-[16px] font-medium leading-none text-ink outline-none placeholder:font-normal placeholder:text-ink3"
                  />
                  <span className="shrink-0 font-mono text-[12px] text-ink3">%</span>
                </div>
              </Field>
            )}

            {/* §22.7 — one sentence, updating per keystroke. It also carries the
                difference between the two kinds, so neither needs helper text. */}
            <Consequence>
              {!asset
                ? t('goals.allocations.previewEmpty')
                : kind === 'percent'
                  ? t('goals.allocations.previewPercent', { name: asset.name })
                  : t('goals.allocations.previewFixed', { name: asset.name })}{' '}
              {asset ? (
                <>
                  {t('goals.allocations.previewCounted')} <Num>{formatAmount(counted)}</Num>.
                </>
              ) : null}
            </Consequence>
          </div>

          <ResponsiveDialogFooter className="mt-5 gap-2.5">
            <Button
              type="button"
              variant="secondary"
              className="h-10 px-4 text-[13px]"
              onClick={() => handleOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            {/* §22.10 — always enabled; pressing it says what is missing. */}
            <Button type="submit" className="h-10 px-5 text-[13px]">
              {isSubmitting
                ? t('goals.form.saving')
                : editing
                  ? t('goals.allocations.saveEdit')
                  : t('goals.allocations.save')}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
