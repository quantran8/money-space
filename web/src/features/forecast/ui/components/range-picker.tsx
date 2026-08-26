import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { enUS, vi } from 'date-fns/locale'
import { CalendarRange, Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ForecastRange } from '@money-space/core/features/forecast/model/forecast-range'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The presets, in the order a household reaches for them: rolling windows
 * first — "what is coming" is the page's question — then the calendar periods
 * that bills and salary actually land in.
 */
const PRESETS: { key: string; range: ForecastRange }[] = [
  { key: 'days7', range: { kind: 'rolling', days: 7 } },
  { key: 'days30', range: { kind: 'rolling', days: 30 } },
  { key: 'days60', range: { kind: 'rolling', days: 60 } },
  { key: 'thisMonth', range: { kind: 'month', offset: 0 } },
  { key: 'nextMonth', range: { kind: 'month', offset: 1 } },
]

/** Where the rolling windows end and the calendar periods begin. */
const DIVIDER_BEFORE = 'thisMonth'

const isSameRange = (a: ForecastRange, b: ForecastRange): boolean => {
  if (a.kind !== b.kind) return false
  if (a.kind === 'rolling' && b.kind === 'rolling') return a.days === b.days
  if (a.kind === 'month' && b.kind === 'month') return a.offset === b.offset
  return true
}

/**
 * The one control that sets the period every figure on this page is computed
 * for (§34 — range context lives here, not restated in each section header).
 *
 * It is a single Popover with two panels rather than a menu that opens a second
 * floating layer: a popover nested inside a dropdown fights over focus and
 * dismissal, and the custom picker is a continuation of the same choice, not a
 * separate one. Choosing "Tuỳ chọn khoảng ngày…" swaps the panel in place.
 */
export function RangePicker({
  range,
  onChange,
  bounds,
}: {
  range: ForecastRange
  onChange: (next: ForecastRange) => void
  /** The resolved window, shown under the label so the dates are never implied. */
  bounds: { start: string; end: string }
}) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>()

  const locale = i18n.resolvedLanguage === 'vi' ? vi : enUS

  const activePreset = PRESETS.find((preset) => isSameRange(preset.range, range))
  const label = activePreset
    ? t(`upcoming.range.${activePreset.key}`)
    : t('upcoming.range.custom')

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    // Always reopen on the preset list: the calendar is a detour, not a mode.
    if (!next) setShowCalendar(false)
  }

  const applyCustom = () => {
    if (!draft?.from || !draft?.to) return
    onChange({
      kind: 'custom',
      start: format(draft.from, 'yyyy-MM-dd'),
      end: format(draft.to, 'yyyy-MM-dd'),
    })
    handleOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="group flex min-h-11 min-w-[190px] items-center justify-between gap-4 rounded-control border border-committed bg-card px-4 py-2 text-left transition-colors hover:bg-wash"
        >
          <span>
            <span className="block t-body-sm font-medium">{label}</span>
            <span className="num block t-caption text-ink3">
              {formatDayMonth(bounds.start)} — {formatDayMonth(bounds.end)}
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-ink2 transition-transform group-aria-expanded:rotate-180"
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-2">
        {showCalendar ? (
          <div>
            <Calendar
              mode="range"
              numberOfMonths={2}
              locale={locale}
              defaultMonth={parseISO(bounds.start)}
              selected={draft}
              onSelect={setDraft}
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 border-t border-divider px-2 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCalendar(false)}
              >
                {t('common.back')}
              </Button>
              {/* Disabled until BOTH ends are picked: a half-made range would
                  silently resolve to a single day. */}
              <Button
                type="button"
                size="sm"
                disabled={!draft?.from || !draft?.to}
                onClick={applyCustom}
              >
                {t('common.apply')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-[270px]" role="menu">
            <div className="px-3 pt-1 pb-2 t-caption text-ink3">
              {t('upcoming.range.label')}
            </div>

            {PRESETS.map((preset) => {
              const active = isSameRange(preset.range, range)
              return (
                <div key={preset.key}>
                  {preset.key === DIVIDER_BEFORE ? (
                    // Functional: rolling windows above, calendar periods below.
                    <div className="my-2 h-px bg-divider" role="separator" />
                  ) : null}
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      onChange(preset.range)
                      handleOpenChange(false)
                    }}
                    className={cn(
                      'flex min-h-11 w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-left transition-colors',
                      active ? 'bg-wash' : 'hover:bg-wash',
                    )}
                  >
                    <span className={cn('t-body-sm', active && 'font-medium')}>
                      {t(`upcoming.range.${preset.key}`)}
                    </span>
                    {active ? (
                      <Check className="size-4 shrink-0 text-ink" strokeWidth={1.75} aria-hidden />
                    ) : null}
                  </button>
                </div>
              )
            })}

            <div className="my-2 h-px bg-divider" role="separator" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                // Seed the calendar with the window already in effect, so the
                // custom panel opens on what the page is currently showing.
                setDraft({ from: parseISO(bounds.start), to: parseISO(bounds.end) })
                setShowCalendar(true)
              }}
              className={cn(
                'flex min-h-11 w-full items-center gap-3 rounded-control px-3 py-2 text-left transition-colors hover:bg-wash',
                range.kind === 'custom' && 'bg-wash',
              )}
            >
              <CalendarRange className="size-4 shrink-0 text-ink3" strokeWidth={1.75} aria-hidden />
              <span className={cn('t-body-sm', range.kind === 'custom' && 'font-medium')}>
                {t('upcoming.range.customOpen')}
              </span>
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** "24/08" — mono-safe ASCII, per §10.1. */
function formatDayMonth(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}` : isoDate
}
