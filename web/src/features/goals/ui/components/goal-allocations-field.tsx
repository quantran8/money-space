import { Plus, TrendingUp, WalletCards, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Segmented, fieldInput, fieldShell } from '@/components/ui/form-22'
import type { GoalAllocationDraft } from '@money-space/core/features/goals/model/goals-form'
import {
  defaultAllocationRole,
  formatAmount,
  isWalletAssetType,
} from '@money-space/core/features/goals/model/goals-form'
import type { AllocationAssetOption } from '@/features/goals/ui/components/goal-allocations-section'
import { formatIntegerDisplay, sanitizeIntegerInput } from '@money-space/core/shared/lib/number-format'
import { cn } from '@money-space/core/shared/lib/utils'

type GoalAllocationsFieldProps = {
  value: GoalAllocationDraft[]
  onChange: (next: GoalAllocationDraft[]) => void
  assetOptions: AllocationAssetOption[]
  error?: string
  contestedWalletIds?: ReadonlySet<string>
  walletGoalNames?: ReadonlyMap<string, string[]>
}

function emptyAllocation(option: AllocationAssetOption): GoalAllocationDraft {
  const role = defaultAllocationRole(option.type)
  return {
    assetId: option.value,
    role,
    kind: role === 'contribution' ? 'fixed' : 'percent',
    amount: '',
    percent: role === 'holding' ? '25' : '',
    monthlyContribution: role === 'contribution' ? '5000000' : '',
    sharePercent: '50',
  }
}

function MoneyInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex h-12 items-center gap-2 rounded-[10px] border border-transparent bg-panel px-3.5 transition-colors focus-within:border-accent">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={formatIntegerDisplay(value)}
        onChange={(event) => onChange(sanitizeIntegerInput(event.target.value))}
        className={cn(fieldInput, 'num font-medium')}
      />
      <span className="shrink-0 font-mono text-[12px] text-ink3">đ</span>
    </div>
  )
}

/** Create-step editor for the real assets that make up a goal. */
export function GoalAllocationsField({
  value,
  onChange,
  assetOptions,
  error,
  contestedWalletIds,
  walletGoalNames,
}: GoalAllocationsFieldProps) {
  const { t } = useTranslation()
  const taken = new Set(value.map((row) => row.assetId))
  const available = assetOptions.filter((option) => !taken.has(option.value))
  /**
   * The goal has assets behind it, but none of them is a wallet.
   *
   * A NOTICE, not an error — this used to block the form, and the server used to
   * refuse the submit. Both stopped, because deleting an asset can leave a goal
   * in this state anyway, and a rule that only guards the create path just moves
   * the household to the route with no guard. So the goal is allowed, and the
   * consequence is stated plainly: gold and stocks reprice on their own, but
   * nothing is ever paid INTO them on a schedule, so the pace panel stays empty
   * until a cash or bank account joins them.
   */
  const missingWallet =
    value.length > 0 &&
    !value.some((row) =>
      isWalletAssetType(assetOptions.find((option) => option.value === row.assetId)?.type),
    )

  function update(index: number, patch: Partial<GoalAllocationDraft>) {
    onChange(value.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  }

  return (
    <div>
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-[12px] bg-[var(--alert-soft,#fff3ef)] px-4 py-3 text-[12px] leading-5 text-alert"
        >
          {error}
        </div>
      ) : null}
      {missingWallet ? (
        <div className="mb-4 rounded-[12px] bg-panel px-4 py-3 text-[12px] leading-5 text-ink2">
          {t('goals.form.walletMissingNotice')}
        </div>
      ) : null}
      <div className="space-y-4">
        {value.length === 0 ? (
          <div className="rounded-[14px] bg-panel px-4 py-6 text-center">
            <p className="text-[13px] font-medium">{t('goals.builder.noSources')}</p>
            <p className="mt-1 text-[12px] text-ink3">{t('goals.builder.chooseSource')}</p>
          </div>
        ) : null}

        {value.map((row, index) => {
          const asset = assetOptions.find((option) => option.value === row.assetId)
          const wallet = isWalletAssetType(asset?.type)
          const contested = contestedWalletIds?.has(row.assetId) ?? false
          const kind = row.role === 'contribution' ? 'fixed' : row.kind

          return (
            <article key={row.assetId} className="rounded-[14px] bg-sunk p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-panel text-ink2">
                  {wallet ? (
                    <WalletCards className="size-4" strokeWidth={1.75} />
                  ) : (
                    <TrendingUp className="size-4" strokeWidth={1.75} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-medium">
                        {asset?.name ?? row.assetId}
                      </h3>
                      <p className="num mt-1 text-[11px] text-ink3">
                        {t('goals.allocations.assetHolds', {
                          value: formatAmount(asset?.balance ?? 0),
                        })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0 text-ink3 hover:bg-panel hover:text-alert"
                      aria-label={t('goals.allocations.remove')}
                      onClick={() => onChange(value.filter((_, rowIndex) => rowIndex !== index))}
                    >
                      <X className="size-4" strokeWidth={1.75} />
                    </Button>
                  </div>

                  {wallet ? (
                    <div className="mt-4">
                      <p className="mb-2 text-[12px] text-ink2">
                        {t('goals.builder.useAssetFor')}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(['contribution', 'holding'] as const).map((role) => {
                          const active = row.role === role
                          return (
                            <button
                              key={role}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                update(index, {
                                  role,
                                  kind: role === 'contribution' ? 'fixed' : row.kind,
                                  percent: role === 'contribution' ? '' : row.percent || '25',
                                  monthlyContribution:
                                    role === 'contribution'
                                      ? row.monthlyContribution || '5000000'
                                      : '',
                                  sharePercent:
                                    role === 'contribution' ? row.sharePercent || '50' : '',
                                })
                              }
                              className={cn(
                                'rounded-[12px] border p-3 text-left transition-colors',
                                active
                                  ? 'border-accent bg-panel'
                                  : 'border-transparent bg-[var(--app)] hover:bg-panel',
                              )}
                            >
                              <span className="block text-[12px] font-medium">
                                {role === 'contribution'
                                  ? t('goals.builder.contributeMonthly')
                                  : t('goals.builder.countCurrent')}
                              </span>
                              <span className="mt-1 block text-[11px] leading-4 text-ink3">
                                {role === 'contribution'
                                  ? t('goals.builder.futureCashFlow')
                                  : t('goals.builder.accumulatedValue')}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-[10px] bg-panel px-3 py-2.5 text-[11px] leading-4 text-ink2">
                      {t('goals.builder.marketHoldingOnly')}
                    </p>
                  )}

                  {row.role === 'contribution' ? (
                    <>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-[12px] text-ink2">
                            {t('goals.builder.monthlyShort')}
                          </p>
                          <MoneyInput
                            value={row.monthlyContribution}
                            onChange={(monthlyContribution) => update(index, { monthlyContribution })}
                          />
                        </div>
                        <div>
                          <p className="mb-2 text-[12px] text-ink2">
                            {t('goals.builder.alreadySetAside')}
                          </p>
                          <MoneyInput value={row.amount} onChange={(amount) => update(index, { amount })} />
                        </div>
                      </div>

                      {contested ? (
                        <div className="mt-4 rounded-[11px] bg-[var(--attention-soft,#fbf4e6)] p-3.5">
                          <p className="text-[12px] font-medium text-attention">
                            {t('goals.builder.sharedWallet')}
                          </p>
                          <p className="mt-1 text-[11px] leading-4 text-attention">
                            {t('goals.builder.samePriorityWith', {
                              goals: (walletGoalNames?.get(row.assetId) ?? []).join(', '),
                            })}
                          </p>
                          <div className="mt-3 flex items-center gap-3">
                            <label className="flex-1 text-[11px] leading-4 text-attention">
                              {t('goals.allocations.shareLabel')}
                            </label>
                            <div className="flex h-12 w-24 items-center rounded-[10px] border border-transparent bg-panel px-3 focus-within:border-accent">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={row.sharePercent}
                                onChange={(event) => update(index, { sharePercent: sanitizeIntegerInput(event.target.value).slice(0, 3) })}
                                className="num min-w-0 flex-1 bg-transparent text-right text-[16px] font-medium outline-none"
                              />
                              <span className="ml-1 font-mono text-[12px] text-ink3">%</span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="mt-4">
                      <Segmented
                        value={kind}
                        onChange={(next) => update(index, { kind: next })}
                        options={[
                          { value: 'fixed', label: t('goals.allocations.kindFixed') },
                          { value: 'percent', label: t('goals.allocations.kindPercent') },
                        ]}
                      />
                      <div className="mt-3">
                        <p className="mb-2 text-[12px] text-ink2">
                          {kind === 'fixed'
                            ? t('goals.builder.countTowardGoal')
                            : t('goals.builder.assetValuePercent')}
                        </p>
                        {kind === 'fixed' ? (
                          <MoneyInput value={row.amount} onChange={(amount) => update(index, { amount })} />
                        ) : (
                          <div className={cn(fieldShell, 'h-12 bg-panel')}>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={row.percent}
                              onChange={(event) => update(index, { percent: sanitizeIntegerInput(event.target.value).slice(0, 3) })}
                              className={cn(fieldInput, 'num font-medium')}
                            />
                            <span className="font-mono text-[12px] text-ink3">%</span>
                          </div>
                        )}
                        {!wallet ? (
                          <p className="mt-2 text-[11px] leading-4 text-ink3">
                            {t('goals.allocations.holdingNote')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })}

        <div className="rounded-[14px] bg-panel p-4">
          <h3 className="text-[14px] font-medium">{t('goals.builder.addSource')}</h3>
          <p className="mt-1 text-[12px] text-ink3">
            {available.length > 0
              ? t('goals.builder.availableSources', { count: available.length })
              : t('goals.builder.allSourcesUsed')}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {available.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange([...value, emptyAllocation(option)])}
                className="flex min-h-[58px] items-center justify-between gap-3 rounded-[11px] bg-sunk px-3.5 py-3 text-left transition-colors hover:bg-[var(--app)]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium">{option.name}</span>
                  <span className="num mt-1 block text-[11px] text-ink3">{formatAmount(option.balance)}</span>
                </span>
                <Plus className="size-4 shrink-0 text-accent" strokeWidth={1.75} />
              </button>
            ))}
            {available.length === 0 ? (
              <p className="py-2 text-[12px] text-ink3 sm:col-span-2">
                {t('goals.builder.noMoreSources')}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
