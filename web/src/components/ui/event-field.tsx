import type { ChangeEvent, ReactNode } from 'react'

import { formatIntegerDisplay, sanitizeIntegerInput } from '@money-space/core/shared/lib/number-format'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The shared form field used across the app's create/edit modals: a white,
 * hairline-bordered block with a small `.label` inset above a borderless control. Originated in the
 * events (money timeline) flows and is now the look for every form dialog —
 * events, debts, assets, goals, payments, members.
 *
 * Both variants are the same WHITE `--card` fill marked by a 1px `--committed`
 * stroke, so `outline` no longer means "add a stroke" — it is kept only because
 * callers pass it, and it now differs only in radius. The field takes an
 * `--alert` ring on error, the one case where an outline carries state (§5.2).
 */
type EventFieldProps = {
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
  className?: string
  /** Renders the label + control side by side (used for the big amount row). */
  trailing?: ReactNode
  variant?: 'filled' | 'outline'
}

export function EventField({ label, htmlFor, error, children, className, trailing, variant = 'filled' }: EventFieldProps) {
  return (
    <div className={className}>
      <div
        className={cn(
          'border border-committed bg-card px-5 py-4 transition duration-200',
          variant === 'outline' ? 'rounded-card' : 'rounded-control',
          error && 'outline-2 outline-alert',
        )}
      >
        <label
          htmlFor={htmlFor}
          className="label block"
        >
          {label}
        </label>
        {trailing ? (
          <div className="mt-1 flex items-baseline gap-2">{children}{trailing}</div>
        ) : (
          <div className="mt-1">{children}</div>
        )}
      </div>
      {error ? (
        <p className="mt-2 px-1 t-body-sm font-medium text-alert-ink">{error}</p>
      ) : null}
    </div>
  )
}

/**
 * Borderless text input for use inside an {@link EventField}. Fills the sunk
 * block, no background of its own.
 */
export function EventFieldInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full bg-transparent t-body font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink3',
        className,
      )}
    />
  )
}

/**
 * Borderless textarea for use inside an {@link EventField}.
 */
export function EventFieldTextarea({
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full resize-none bg-transparent t-body leading-6 text-ink outline-none placeholder:text-ink3',
        className,
      )}
    />
  )
}

/**
 * Borderless money input for the "Số tiền" field. Types digits only, displays
 * grouped ("8.000.000"); pushes the raw digit string up via onChange. Mirrors
 * the global {@link import('@/components/ui/number-input').MoneyInput}
 * formatting but styled to sit transparent inside an {@link EventField}.
 * Carries `.money-number` — negative tracking is safe here because the field
 * only ever holds digits (§10.3).
 *
 * `t-body`, at control size. This was `t-figure` (40px) — the hero amount input
 * v5 dropped: §21 is "Money input normal control size. Không hero-size input.",
 * and Components.dc's "Số tiền" field renders at 16px in all three states. At
 * 40px the digits also overran the 44px control they sit in, and every caller
 * that noticed was overriding it back down one field at a time.
 */
type EventMoneyInputProps = {
  id?: string
  value: string
  onChange: (rawValue: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function EventMoneyInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  className,
}: EventMoneyInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={formatIntegerDisplay(value)}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(sanitizeIntegerInput(event.target.value))
      }
      onBlur={onBlur}
      className={cn(
        'money-number min-w-0 flex-1 bg-transparent t-body font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink3 disabled:cursor-default disabled:opacity-100',
        className,
      )}
    />
  )
}

/**
 * Borderless decimal input for use inside an {@link EventField} — for quantities
 * and rates where the raw string (with an optional decimal separator) is kept
 * as-is. Unlike {@link EventMoneyInput} it does no grouping.
 */
type EventDecimalInputProps = {
  id?: string
  value: string
  onChange: (rawValue: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function EventDecimalInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  className,
}: EventDecimalInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      disabled={disabled}
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      onBlur={onBlur}
      className={cn(
        'num w-full bg-transparent t-body font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink3 disabled:opacity-50',
        className,
      )}
    />
  )
}

/**
 * Trigger className to drop the global Select's own background so it sits flush
 * inside an {@link EventField}'s sunk block. Pass to `SelectTrigger`.
 */
export const eventSelectTriggerClass =
  'h-auto rounded-none border-0 bg-transparent p-0 t-body font-medium text-ink shadow-none focus-visible:shadow-none data-[placeholder]:text-ink3'

/**
 * Trigger className to drop the global DatePicker button's own background so it
 * sits flush inside an {@link EventField}'s sunk block.
 */
export const eventDateTriggerClass =
  'h-auto justify-start rounded-none border-0 bg-transparent p-0 t-body font-medium text-ink hover:bg-transparent [&_svg]:hidden'
