import type { ChangeEvent, ReactNode } from 'react'

import { formatIntegerDisplay, sanitizeIntegerInput } from '@/shared/lib/number-format'
import { cn } from '@/shared/lib/utils'

/**
 * Apple/Gen-Z styled form field used across the app's create/edit modals: a soft
 * filled card (bg-muted) with a small uppercase inset label and a borderless
 * control inside. Originated in the events (money timeline) flows and is now the
 * shared look for every form dialog — events, debts, assets, goals, payments,
 * members — so the whole app feels like one calm, tactile surface.
 *
 * The card lights up a soft accent ring on focus-within, and turns red on error.
 */
type EventFieldProps = {
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
  className?: string
  /** Renders the label + control side by side (used for the big amount row). */
  trailing?: ReactNode
}

export function EventField({ label, htmlFor, error, children, className, trailing }: EventFieldProps) {
  return (
    <div className={className}>
      <div
        className={cn(
          'rounded-[20px] bg-[hsl(var(--muted))] px-5 py-4 transition focus-within:ring-4 focus-within:ring-[hsla(var(--accent),0.1)]',
          error && 'ring-2 ring-[hsla(var(--status-red),0.35)]',
        )}
      >
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]"
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
        <p className="mt-2 px-1 text-sm font-medium text-[hsl(var(--status-red))]">{error}</p>
      ) : null}
    </div>
  )
}

/**
 * Borderless text input for use inside an {@link EventField}. Fills the card,
 * no border/background of its own.
 */
export function EventFieldInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full bg-transparent text-[17px] font-medium text-foreground outline-none placeholder:font-normal placeholder:text-[hsl(var(--muted-foreground))]',
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
        'w-full resize-none bg-transparent text-[16px] leading-6 text-foreground outline-none placeholder:text-[hsl(var(--muted-foreground))]',
        className,
      )}
    />
  )
}

/**
 * Large, borderless money input for the hero "Số tiền" field. Types digits only,
 * displays grouped ("8.000.000"); pushes the raw digit string up via onChange.
 * Mirrors the global {@link import('@/components/ui/number-input').MoneyInput}
 * formatting but styled for the filled card (big, transparent, no border).
 */
type EventMoneyInputProps = {
  id?: string
  value: string
  onChange: (rawValue: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
}

export function EventMoneyInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
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
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(sanitizeIntegerInput(event.target.value))
      }
      onBlur={onBlur}
      className={cn(
        'min-w-0 flex-1 bg-transparent text-[36px] font-semibold tracking-[-0.045em] text-foreground outline-none placeholder:text-[hsl(var(--muted-foreground))]/60 sm:text-[42px]',
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
        'w-full bg-transparent text-[17px] font-medium text-foreground outline-none placeholder:font-normal placeholder:text-[hsl(var(--muted-foreground))] disabled:opacity-50',
        className,
      )}
    />
  )
}

/**
 * Trigger className to drop the global Select's border/background so it sits
 * flush inside an {@link EventField}'s filled card. Pass to `SelectTrigger`.
 */
export const eventSelectTriggerClass =
  'h-auto rounded-none border-0 bg-transparent p-0 text-[17px] font-medium text-foreground shadow-none focus-visible:ring-0 data-[placeholder]:text-[hsl(var(--muted-foreground))]'

/**
 * Trigger className to drop the global DatePicker button's border/background so
 * it sits flush inside an {@link EventField}'s filled card.
 */
export const eventDateTriggerClass =
  'h-auto justify-start rounded-none border-0 bg-transparent p-0 text-[17px] font-medium text-foreground shadow-none hover:bg-transparent [&_svg]:hidden'
