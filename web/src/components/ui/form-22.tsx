import type { ChangeEvent, ReactNode } from 'react'

import {
  formatIntegerDisplay,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
} from '@money-space/core/shared/lib/number-format'
import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The §22 form kit.
 *
 * design.md §22 describes a form language that deliberately differs from the
 * display surfaces around it, and the two rules that matter most are the ones
 * easiest to get wrong:
 *
 *  - §22.3 — an input MUST carry a `--sunk` fill. The display system drops
 *    borders (§2.2), but a borderless field on a panel is indistinguishable
 *    from static text. Focus then INVERTS the surface: the fill lightens to
 *    `--panel` and an accent stroke appears. This is the only place in the
 *    product a border is used for purely visual purposes.
 *  - §22.4 — field labels are 13px sentence-case `--ink2`. NOT `.label`
 *    (mono uppercase): that is a sparse accessory of the display surfaces, and
 *    a column of seven of them turns a form into a form-builder.
 *
 * These primitives exist so those rules live in one place rather than being
 * re-typed (and re-broken) per dialog.
 */

/* --- Field shell (§22.3, §22.4) ---------------------------------------- */

/**
 * The sunk control box. Exported because a few controls (Select, DatePicker)
 * are wrapped rather than composed, and need the same shell.
 *
 * 46px is the §22.3 standard height; `--sunk` fill, transparent border that
 * turns accent on focus so the box never reflows.
 */
export const fieldShell =
  'flex h-[46px] w-full items-center gap-2 rounded-[10px] border border-transparent bg-wash px-3.5 transition-colors focus-within:border-action focus-within:bg-card'

/** Secondary/optional fields sit at 40px (§22.3). */
export const fieldShellSm =
  'flex h-10 w-full items-center gap-2 rounded-[10px] border border-transparent bg-wash px-3.5 transition-colors focus-within:border-action focus-within:bg-card'

/**
 * 16px is not a style choice — anything smaller makes iOS Safari zoom the
 * viewport on focus (§22.3).
 */
export const fieldInput =
  'h-full min-w-0 w-full bg-transparent t-body leading-none text-ink outline-none placeholder:font-normal placeholder:text-ink3'

/**
 * Class for a shadcn `SelectTrigger` / `DatePicker` placed inside {@link Field}.
 * Strips the control's own chrome so the sunk shell is the only surface.
 */
export const fieldControlReset =
  'h-full w-full rounded-none border-0 bg-transparent p-0 t-body text-ink shadow-none hover:bg-transparent focus:ring-0 focus-visible:ring-0 data-[placeholder]:text-ink3'

/**
 * There is deliberately NO `help` prop. §22.0 lists "mỗi trường có một dòng
 * helper" as an admin-form signal, and once one field carries a helper the rest
 * follow. Only errors get a second line — those have a job.
 */
type FieldProps = {
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, error, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block t-body-sm leading-[1.4] text-ink2"
      >
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 t-caption leading-[1.5] text-alert">{error}</p> : null}
    </div>
  )
}

/** Plain text field wrapped in the sunk shell. */
export function TextField({
  label,
  error,
  id,
  className,
  ...props
}: { label: string; error?: string; className?: string } & React.ComponentProps<'input'>) {
  return (
    <Field label={label} htmlFor={id} error={error} className={className}>
      <div className={cn(fieldShell, error && 'border-alert')}>
        <input id={id} className={fieldInput} {...props} />
      </div>
    </Field>
  )
}

/** Textarea variant — same fill, 11px vertical padding, vertical resize (§22.3). */
export function TextareaField({
  label,
  error,
  id,
  rows = 3,
  className,
  ...props
}: { label: string; error?: string; className?: string } & React.ComponentProps<'textarea'>) {
  return (
    <Field label={label} htmlFor={id} error={error} className={className}>
      <textarea
        id={id}
        rows={rows}
        className={cn(
          'w-full resize-y rounded-[10px] border border-transparent bg-wash px-3.5 py-3 t-body leading-6 text-ink outline-none transition-colors placeholder:text-ink3 focus:border-action focus:bg-card',
          error && 'border-alert',
        )}
        {...props}
      />
    </Field>
  )
}

/* --- Money (§22.5) ------------------------------------------------------ */

/**
 * §22.5: money is entered at STANDARD height, never at hero size — "số lớn là
 * output, không phải input". Weight 500, tabular figures, and a fixed unit
 * suffix inside the box rather than a floating label.
 *
 * §22.5 also specifies a full-number readout beneath ("800" → "800.000.000 đ").
 * That rule assumes its own input convention — typing in *triệu*, where the
 * readout is the only way to catch a missing zero. This app takes full digits
 * and groups them live as you type, so the readout would repeat the box
 * verbatim. It is deliberately omitted; if the input unit ever changes to
 * triệu, the readout must come back with it.
 */
type MoneyFieldProps = {
  label: string
  value: string
  onChange: (raw: string) => void
  onBlur?: () => void
  id?: string
  error?: string
  placeholder?: string
  className?: string
  /** Suffix rendered inside the box. Defaults to the đồng sign. */
  suffix?: string
}

export function MoneyField({
  label,
  value,
  onChange,
  onBlur,
  id,
  error,
  placeholder = '0',
  className,
  suffix = 'đ',
}: MoneyFieldProps) {
  return (
    <Field label={label} htmlFor={id} error={error} className={className}>
      <div className={cn(fieldShell, error && 'border-alert')}>
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
          className={cn(fieldInput, 'num font-medium')}
        />
        <span className="shrink-0 font-mono t-caption text-ink3">{suffix}</span>
      </div>
    </Field>
  )
}

/** Decimal field (quantities, rates) — same shell, no grouping. */
export function DecimalField({
  label,
  value,
  onChange,
  onBlur,
  id,
  error,
  placeholder,
  suffix,
  className,
}: MoneyFieldProps) {
  return (
    <Field label={label} htmlFor={id} error={error} className={className}>
      <div className={cn(fieldShell, error && 'border-alert')}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(sanitizeDecimalInput(event.target.value))
          }
          onBlur={onBlur}
          className={cn(fieldInput, 'num font-medium')}
        />
        {suffix ? (
          <span className="shrink-0 whitespace-nowrap t-caption text-ink3">{suffix}</span>
        ) : null}
      </div>
    </Field>
  )
}

/* --- Segmented control (§22.3) ----------------------------------------- */

/** `--sunk` track, active item lifts to `--panel` (§22.3). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (next: T) => void
  options: { value: T; label: string }[]
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      className={cn('flex gap-1 rounded-[10px] bg-wash p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-[7px] px-3 py-2 t-body-sm transition-colors',
              active ? 'bg-card font-medium text-ink shadow-sm' : 'text-ink2 hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* --- Consequence block (§22.7) ----------------------------------------- */

/**
 * §22.7: every create/edit that moves the forecast states its consequence
 * INSIDE the form, updating per keystroke — and states it as a SENTENCE.
 *
 * A three-cell labelled grid is the language of a report; a sentence is the
 * language of two people talking. `--accent-soft` matches the simulation
 * surface because both answer "what happens if I do this".
 *
 * Wrap emphasised numbers in {@link Num} so they carry weight 500 and tabular
 * figures inside the running text.
 */
export function Consequence({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        'rounded-[10px] bg-accent-soft px-4 py-3 t-body-sm leading-[1.6] text-ink2',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** An emphasised number inside a {@link Consequence} sentence (§22.7). */
export function Num({ children }: { children: ReactNode }) {
  return <span className="num font-medium text-ink">{children}</span>
}

/* --- Disclosure (§22.2) ------------------------------------------------- */

/** The single allowed disclosure. §22.2 forbids nesting a second level. */
export function Disclosure({
  open,
  onToggle,
  label,
  children,
}: {
  open: boolean
  onToggle: () => void
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="t-body-sm text-action transition-opacity hover:opacity-70"
      >
        {label}
      </button>
      {open ? <div className="mt-4 space-y-4">{children}</div> : null}
    </div>
  )
}

/*
 * §22.12 ("Bình sẽ thấy trong Nhật ký" beside the primary button) is
 * deliberately NOT implemented here. Every save already writes a journal entry,
 * so restating it on each save is repetition once the user has learned it. The
 * transparency itself is unchanged — only the per-save reminder is dropped.
 */
