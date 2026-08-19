import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Field, Segmented, fieldControlReset, fieldShell } from '@/components/ui/form-22'
import { Sunk } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { GoalAllocationDraft } from '@/features/goals/model/goals-form'
import {
  defaultAllocationRole,
  formatAmount,
  isWalletAssetType,
} from '@/features/goals/model/goals-form'
import type { AllocationAssetOption } from '@/features/goals/ui/components/goal-allocations-section'
import { formatIntegerDisplay, sanitizeIntegerInput } from '@/shared/lib/number-format'

type GoalAllocationsFieldProps = {
  value: GoalAllocationDraft[]
  onChange: (next: GoalAllocationDraft[]) => void
  assetOptions: AllocationAssetOption[]
  error?: string
}

/**
 * Choose which money counts towards a goal, inside the create form.
 *
 * This is the question that used to be skipped: a goal was created first and
 * "which money is this?" came later, if at all — leaving goals at 0% with no
 * obvious next step. Asking here means a goal is real from the moment it exists.
 *
 * There is no separate "from shared money" option, because there is no separate
 * kind of money: setting aside 100tr from the household's shared money is a
 * fixed 100tr share of the wallet holding it, declared the same way as a share
 * of gold or stocks.
 */
export function GoalAllocationsField({
  value,
  onChange,
  assetOptions,
  error,
}: GoalAllocationsFieldProps) {
  const { t } = useTranslation()

  const taken = new Set(value.map((row) => row.assetId).filter(Boolean))
  const firstFree = assetOptions.find((option) => !taken.has(option.value))

  function update(index: number, patch: Partial<GoalAllocationDraft>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <Field label={t('goals.form.allocations')} error={error}>
      <div className="space-y-2">
        {value.map((row, index) => {
          const asset = assetOptions.find((option) => option.value === row.assetId)
          // Only assets not already claimed by another row here — one share per
          // asset per goal, so a second row for the same asset is two answers to
          // one question (the API rejects it too).
          // A contribution share is a wallet, always: money is only ever put in
          // through one, and the amount it puts in each month has to name the
          // account it comes out of. A holding can be anything the household
          // owns, wallets included.
          const available = assetOptions
            .filter((option) => option.value === row.assetId || !taken.has(option.value))
            .filter((option) => row.role !== 'contribution' || isWalletAssetType(option.type))
          // "A contribution is stated as an amount" is enforced wherever a row is
          // written; read it here too. A row that reached this shape by any other
          // route would otherwise render a % box under a label promising money,
          // with no control on screen able to correct it.
          const kind = row.role === 'contribution' ? 'fixed' : row.kind

          return (
            <Sunk key={index} className="space-y-3 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Select
                  value={row.assetId}
                  onValueChange={(assetId) => {
                    const nextType = assetOptions.find((option) => option.value === assetId)?.type
                    // Re-seed the role with the new asset's default: a row
                    // switched from a wallet to gold should not silently keep
                    // counting as monthly contribution.
                    const nextRole = defaultAllocationRole(nextType)
                    update(index, {
                      assetId,
                      role: nextRole,
                      // A monthly amount belongs to a wallet. Carrying one over
                      // to gold would be rejected on submit, and silently kept
                      // in a field the row no longer shows.
                      monthlyContribution: isWalletAssetType(nextType)
                        ? row.monthlyContribution
                        : '',
                      // A contribution is stated as an amount, and its
                      // fixed/percent control is hidden. Set here too, or a
                      // percent left over from the previous asset would render a
                      // % box under a label that promises money.
                      kind: nextRole === 'contribution' ? 'fixed' : kind,
                      percent: nextRole === 'contribution' ? '' : row.percent,
                    })
                  }}
                >
                  <SelectTrigger className={fieldControlReset}>
                    <SelectValue placeholder={t('goals.allocations.assetPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-ink3"
                  aria-label={t('goals.allocations.remove')}
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Which question this share answers: money going in monthly, or
                  value already held. Only the first feeds the pace panel — a
                  wallet has no market price, while gold's movement would
                  otherwise answer "did we save 10tr?" with the gold price.
                  Shown only for a wallet: nothing is ever paid INTO gold on a
                  schedule, so a holding is the only thing gold can be, and a
                  control with one possible answer is a control that only invites
                  a mistake. */}
              {isWalletAssetType(asset?.type) ? (
                <Segmented
                  value={row.role}
                  onChange={(role) =>
                    // Marked as already-held, this share no longer feeds the
                    // pace, so an amount on it would be counted into a target
                    // that is then measured against contribution shares alone.
                    //
                    // A contribution is stated as an amount — the fixed/percent
                    // control below is a holding's choice, so switching TO
                    // contribution has to leave the row on a shape that control
                    // is no longer there to fix.
                    update(index, {
                      role,
                      monthlyContribution: role === 'contribution' ? row.monthlyContribution : '',
                      kind: role === 'contribution' ? 'fixed' : kind,
                      percent: role === 'contribution' ? '' : row.percent,
                    })
                  }
                  options={[
                    {
                      value: 'contribution',
                      label: t('goals.allocations.roleContribution'),
                    },
                    {
                      value: 'holding',
                      label: t('goals.allocations.roleHolding'),
                    },
                  ]}
                />
              ) : null}

              {/* Fixed or percent — a choice only a holding has. A wallet's
                  balance has no market price to track, so "a share of whatever
                  it is worth" says nothing a plain amount does not; what the
                  household means is "this much of this account is for the goal".
                  A contribution is therefore always a fixed amount. */}
              {row.role === 'contribution' ? null : (
                <Segmented
                  value={kind}
                  onChange={(next) => update(index, { kind: next })}
                  options={[
                    { value: 'fixed', label: t('goals.allocations.kindFixed') },
                    {
                      value: 'percent',
                      label: t('goals.allocations.kindPercent'),
                    },
                  ]}
                />
              )}

              {/* What this wallet puts in each month. The goal's pace is the sum
                  of these — "10tr a month" is really "6tr out of the salary
                  account and 4tr in cash", and saying it per wallet is what
                  lets the plan name the accounts that have to carry it. */}
              {row.role === 'contribution' && isWalletAssetType(asset?.type) ? (
                <div className="space-y-1.5">
                  <p className="text-[12px] text-ink2">{t('goals.allocations.monthlyLabel')}</p>
                  <div className={fieldShell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      value={formatIntegerDisplay(row.monthlyContribution)}
                      onChange={(event) =>
                        update(index, {
                          monthlyContribution: sanitizeIntegerInput(event.target.value),
                        })
                      }
                      className="num h-full w-full min-w-0 bg-transparent text-[16px] font-medium leading-none text-ink outline-none placeholder:font-normal placeholder:text-ink3"
                    />
                    <span className="shrink-0 font-mono text-[12px] text-ink3">đ</span>
                  </div>
                </div>
              ) : null}

              {/* Two numbers for a wallet, and they answer different questions:
                  what it ALREADY holds for the goal (progress, this box) and
                  what it adds each month (pace, the box above). Labelled here
                  because stacked unlabelled they read as the same question
                  twice; a holding needs no label, its kind control says it.
                  Leaving this empty is ordinary — a household that starts saving
                  today has nothing set aside yet. */}
              {row.role === 'contribution' ? (
                <p className="text-[12px] text-ink2">{t('goals.allocations.countedLabel')}</p>
              ) : null}

              <div className={fieldShell}>
                {kind === 'fixed' ? (
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      value={formatIntegerDisplay(row.amount)}
                      onChange={(event) =>
                        update(index, {
                          amount: sanitizeIntegerInput(event.target.value),
                        })
                      }
                      className="num h-full w-full min-w-0 bg-transparent text-[16px] font-medium leading-none text-ink outline-none placeholder:font-normal placeholder:text-ink3"
                    />
                    <span className="shrink-0 font-mono text-[12px] text-ink3">đ</span>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="100"
                      value={row.percent}
                      onChange={(event) =>
                        update(index, {
                          percent: sanitizeIntegerInput(event.target.value).slice(0, 3),
                        })
                      }
                      className="num h-full w-full min-w-0 bg-transparent text-[16px] font-medium leading-none text-ink outline-none placeholder:font-normal placeholder:text-ink3"
                    />
                    <span className="shrink-0 font-mono text-[12px] text-ink3">%</span>
                  </>
                )}
              </div>

              {asset ? (
                <p className="text-[12px] text-ink3">
                  {t('goals.allocations.assetHolds', {
                    value: formatAmount(asset.balance),
                  })}
                  {/* Said here, before it happens: a holding's value follows the
                      market, so the goal's figure will move on its own. Warned
                      in advance, it reads as expected rather than as a glitch. */}
                  {row.role === 'holding' ? ` · ${t('goals.allocations.holdingNote')}` : null}
                </p>
              ) : null}
            </Sunk>
          )
        })}

        <Button
          type="button"
          variant="ghost"
          className="h-10 px-3 text-[13px] text-accent disabled:text-ink3"
          disabled={!firstFree}
          onClick={() =>
            firstFree &&
            onChange([
              ...value,
              // A wallet seeds as the goal's contribution source. Every share
              // starts as a fixed amount: a contribution is only ever stated
              // that way, and a holding can switch to a percent from the control
              // above.
              {
                assetId: firstFree.value,
                kind: 'fixed' as const,
                role: defaultAllocationRole(firstFree.type),
                amount: '',
                percent: '',
                monthlyContribution: '',
              },
            ])
          }
        >
          <Plus className="size-4" />
          {t('goals.allocations.add')}
        </Button>
      </div>
    </Field>
  )
}
