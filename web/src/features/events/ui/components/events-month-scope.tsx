import { format } from 'date-fns'
import { enUS, vi } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { MonthPicker } from '@/components/ui/month-picker'

type EventsMonthScopeProps = {
  /** `YYYY-MM`. */
  month: string
  onChange: (month: string) => void
}

function shiftMonth(monthKey: string, delta: number) {
  const [year, month] = monthKey.split('-').map(Number)
  const next = new Date(year, month - 1 + delta, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

/**
 * The month every figure on the page is about.
 *
 * It sits under the page title rather than inside the timeline card because it
 * scopes BOTH cards — the cash-flow summary and the list below it describe the
 * same month, and a control that lives inside one of them reads as belonging to
 * that one alone (`CompactPageHeader`'s `scope` slot exists for exactly this).
 *
 * Stepping is the common move, so the arrows are the wide targets; the middle
 * button opens the picker for the jump that is more than a month or two away.
 */
export function EventsMonthScope({ month, onChange }: EventsMonthScopeProps) {
  const { t, i18n } = useTranslation()
  const isEnglish = Boolean(i18n.resolvedLanguage?.startsWith('en'))
  const locale = isEnglish ? enUS : vi
  // "August 2026", but "Tháng 8, 2026" — Vietnamese reads the month as a
  // labelled number, so it takes the comma English does not want.
  const pattern = isEnglish ? 'LLLL yyyy' : 'LLLL, yyyy'

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-control text-ink2 transition-colors hover:bg-wash"
        aria-label={t('events.history.previousMonth')}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft className="size-[18px]" strokeWidth={1.75} />
      </button>

      <MonthPicker
        value={`${month}-01`}
        onChange={(value) => onChange(value.slice(0, 7))}
        className="w-auto justify-center capitalize"
        formatLabel={(date) => format(date, pattern, { locale })}
      />

      <button
        type="button"
        className="grid size-11 place-items-center rounded-control text-ink2 transition-colors hover:bg-wash"
        aria-label={t('events.history.nextMonth')}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight className="size-[18px]" strokeWidth={1.75} />
      </button>
    </div>
  )
}
