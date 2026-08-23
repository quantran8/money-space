import { sanitizeIntegerInput } from '@money-space/core/shared/lib/number-format'

import { Field } from '@/components/ui/field'

/**
 * A whole-percent field (1–100).
 *
 * Capped at three digits at the input, so "1000" cannot be typed and then
 * rejected — a control that accepts what it will refuse wastes the keystroke
 * and the correction. The unit lives in the label rather than an adornment:
 * an inline "%" on a 46pt row competes with the number for the same space.
 */
export function PercentInput({
  label,
  value,
  onChange,
  error,
  className,
}: {
  label?: string
  /** Raw digits, no separators. */
  value: string
  onChange: (raw: string) => void
  error?: string
  className?: string
}) {
  return (
    <Field
      className={className}
      label={label}
      placeholder="100"
      value={value}
      onChangeText={(next) => onChange(sanitizeIntegerInput(next).slice(0, 3))}
      error={error}
      keyboardType="number-pad"
    />
  )
}
