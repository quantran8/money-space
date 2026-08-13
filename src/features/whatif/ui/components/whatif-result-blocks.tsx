import { useTranslation } from 'react-i18next'

import { SubSection } from '@/components/ui/sub-section'
import { AssumptionsNote } from '@/features/forecast/ui/components/assumptions-note'
import { RESULT_TYPE_CLASS, type WhatIfResult } from '@/features/whatif/model/whatif.types'
import { formatVndShort } from '@/shared/lib/format-money'
import { cn } from '@/shared/lib/utils'

/**
 * The five result blocks, in the **mandated order** (§26D):
 *   Upcoming Safety → Reserve impact → Flexible before/after → Goal consequence
 *   → Assumptions.
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
      {/* 1 — Upcoming Safety */}
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
      </SubSection>

      {/* 2 — Reserve impact */}
      <SubSection title={t('whatif.blocks.reserveImpact')}>
        <p className="text-sm">
          {after.reserveProtected
            ? t('whatif.reserve.intact')
            : t('whatif.reserve.breached')}
        </p>
        {!after.obligationsCovered ? (
          <p className="mt-2 text-sm text-attention">
            {t('whatif.obligations.notCovered')}
          </p>
        ) : null}
      </SubSection>

      {/* 3 — Flexible before/after. NEVER labelled a spending allowance. */}
      <SubSection title={t('whatif.blocks.flexible')}>
        <Row
          label={t('whatif.flexibleHorizon')}
          before={formatVndShort(before.flexibleMoneyHorizon)}
          after={formatVndShort(after.flexibleMoneyHorizon)}
        />
        <p className="mt-2 text-xs text-ink2">
          {t('whatif.flexibleDelta', {
            amount: formatVndShort(Math.abs(delta.flexibleMoneyHorizon)),
          })}
        </p>
      </SubSection>

      {/* 4 — Goal consequence, only when a goal was in scope. */}
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

      {/* 5 — Assumptions */}
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
