import { useTranslation } from 'react-i18next'

import { SubSection } from '@/components/ui/sub-section'
import { AssumptionsNote } from '@/features/forecast/ui/components/assumptions-note'
import { RESULT_TYPE_CLASS, type WhatIfResult } from '@/features/whatif/model/whatif.types'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

/**
 * The result blocks, in the **mandated order** (§26D):
 *   Upcoming Safety → Goal consequence → Assumptions.
 *
 * §26D used to mandate five. Two went with the protected reserve: "Reserve
 * impact" had nothing left to report, and "Flexible before/after" was showing
 * `lowestProjectedBalance` under a second name — the same two numbers as the
 * block above it. So the first block absorbed what survived: the delta sentence
 * and the "obligations not covered" line, which is about coverage, not the
 * reserve, and would otherwise have been deleted along with its container.
 *
 * Every block reports CONSEQUENCE. None of them says whether to buy — no
 * "bạn nên / không nên mua", no recommendation, no verdict. `resultType` only
 * picks a colour.
 */
export function WhatIfResultBlocks({ result }: { result: WhatIfResult }) {
  const { t } = useTranslation()
  const { before, after, delta } = result

  return (
    <div className="space-y-3">
      {/* 1 — Upcoming Safety. NEVER labelled a spending allowance. */}
      <SubSection title={t('whatif.blocks.upcomingSafety')}>
        <Row
          label={t('whatif.lowestBalance')}
          before={formatVndShort(before.lowestProjectedBalance)}
          after={formatVndShort(after.lowestProjectedBalance)}
          // Negative is never hidden — it is the answer.
          afterClassName={RESULT_TYPE_CLASS[result.resultType]}
        />
        <p className="mt-2 text-xs text-ink2">
          {t('whatif.lowestBalanceOn', { date: after.lowestProjectedBalanceDate })}
        </p>
        <p className="mt-2 text-xs text-ink2">
          {t('whatif.flexibleDelta', {
            amount: formatVndShort(Math.abs(delta.lowestProjectedBalance)),
          })}
        </p>
        {!after.obligationsCovered ? (
          <p className="mt-2 text-sm text-attention">
            {t('whatif.obligations.notCovered')}
          </p>
        ) : null}
      </SubSection>

      {/* 2 — Goal consequence, only when a goal was in scope. */}
      {after.goal ? (
        <SubSection title={t('whatif.blocks.goal')}>
          {delta.goalDelayMonths !== null && delta.goalDelayMonths !== 0 ? (
            <p className="text-sm">
              {t('whatif.goal.delay', { count: Math.abs(delta.goalDelayMonths) })}
            </p>
          ) : (
            <p className="text-sm">{t('whatif.goal.noChange')}</p>
          )}
          {after.goal.projectedCompletionDate ? (
            <p className="mt-2 text-xs text-ink2">
              {t('whatif.goal.projectedDate', {
                date: after.goal.projectedCompletionDate,
              })}
            </p>
          ) : null}
        </SubSection>
      ) : null}

      {/* 3 — Assumptions */}
      <AssumptionsNote assumptions={result.assumptions} />
    </div>
  )
}

function Row({
  label,
  before,
  after,
  afterClassName,
}: {
  label: string
  before: string
  after: string
  afterClassName?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-sm text-ink2">{label}</p>
      <p className="money-number text-sm font-semibold">
        <span className="text-ink2">{before}</span>
        <span className="mx-2 text-ink2">
          {t('whatif.arrow')}
        </span>
        <span className={cn(afterClassName)}>{after}</span>
      </p>
    </div>
  )
}
