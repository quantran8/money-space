import { X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel, PanelHeader } from '@/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCashflowEvents } from '@money-space/core/features/cashflow/hooks/use-cashflow-events'
import { useHouseholdMatchRules } from '@money-space/core/features/cashflow/hooks/use-cashflow-settlement'
import { ApiError } from '@money-space/core/shared/api/http'
import { getErrorMessage } from '@money-space/core/shared/lib/get-error-message'
import { notify } from '@money-space/core/shared/notify'
import { cn } from '@money-space/core/shared/lib/utils'

// Note-rule settings; no silent learning. See memory/cashflow-settlement.md.
export function MatchRulesPanel() {
  const { t } = useTranslation()
  const { cashflowEvents } = useCashflowEvents()
  const { rules, create, remove, preview } = useHouseholdMatchRules()
  const [eventId, setEventId] = useState('')
  const [phrase, setPhrase] = useState('')

  const openEvents = cashflowEvents.filter(
    (e) => e.status !== 'completed' && e.status !== 'cancelled',
  )
  const eventName = new Map(cashflowEvents.map((e) => [e.id, e.name]))
  const groups = [...new Set(rules.map((r) => r.cashflowEventId))].map((id) => ({
    id,
    name: eventName.get(id) ?? '—',
    rules: rules.filter((r) => r.cashflowEventId === id),
  }))

  const add = async () => {
    try {
      await create.mutateAsync({ eventId, phrase })
      setPhrase('')
      preview.reset()
    } catch (error) {
      const status = error instanceof ApiError ? error.statusCode : undefined
      notify.error(
        status === 409
          ? t('settlement.rules.overlap')
          : status === 400
            ? t('settlement.rules.tooShort')
            : getErrorMessage(error, t('settlement.rules.failed')),
      )
    }
  }

  return (
    <Panel>
      <PanelHeader title={t('settlement.rules.title')} />
      <p className="mt-1 t-body-sm leading-5 text-ink2">{t('settlement.rules.description')}</p>

      <div className="s-head-body grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger aria-label={t('settlement.rules.eventLabel')}>
            <SelectValue placeholder={t('settlement.rules.eventPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {openEvents.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={t('settlement.rules.placeholder')}
          aria-label={t('settlement.rules.phraseLabel')}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!phrase.trim() || preview.isPending}
            onClick={() => preview.mutate(phrase)}
          >
            {t('settlement.rules.previewTitle')}
          </Button>
          <Button
            type="button"
            disabled={!eventId || !phrase.trim() || create.isPending}
            onClick={() => void add()}
          >
            {t('settlement.rules.add')}
          </Button>
        </div>
      </div>

      {preview.data ? (
        <div className="mt-3 border-t border-divider pt-3">
          {preview.data.length === 0 ? (
            <p className="t-body-sm text-ink3">{t('settlement.rules.previewEmpty')}</p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {preview.data.slice(0, 20).map((row) => (
                <li key={row.bankEventId} className="flex items-center justify-between gap-3">
                  <span className="truncate t-body-sm text-ink2">{row.note}</span>
                  <span
                    className={cn(
                      'shrink-0 t-caption font-medium',
                      row.matches ? 'text-positive-ink' : 'text-ink3',
                    )}
                  >
                    {row.matches
                      ? t('settlement.rules.previewMatch')
                      : t('settlement.rules.previewNoMatch')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="mt-3 border-t border-divider pt-3">
        {groups.length === 0 ? (
          <p className="t-body-sm text-ink3">{t('settlement.rules.empty')}</p>
        ) : (
          <ul className="divide-y divide-divider">
            {groups.map((group) => (
              <li key={group.id} className="flex flex-wrap items-center gap-2 py-2">
                <span className="mr-1 t-body-sm font-medium text-ink">{group.name}</span>
                {group.rules.map((rule) => (
                  <span
                    key={rule.id}
                    className="inline-flex items-center gap-1 rounded-pill bg-wash py-0.5 pl-3 pr-1 t-caption text-ink2"
                  >
                    {rule.phrase}
                    <button
                      type="button"
                      aria-label={t('settlement.rules.remove')}
                      disabled={remove.isPending}
                      onClick={() => remove.mutate({ eventId: group.id, ruleId: rule.id })}
                      className="flex size-6 items-center justify-center rounded-pill text-ink3 hover:text-ink"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  )
}
