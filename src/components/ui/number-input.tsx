import * as React from 'react'

import { Input } from '@/components/ui/input'
import {
  formatDecimalDisplay,
  formatIntegerDisplay,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
} from '@/shared/lib/number-format'

type BaseProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'inputMode'> & {
  /** Raw, separator-free value held in form state (e.g. "10000" or "5,5"). */
  value: string
  /** Called with the raw, separator-free value. */
  onChange: (rawValue: string) => void
}

/**
 * Money input: user types digits only; displays grouped with "." thousands
 * separators (10000 -> "10.000"). The value pushed up via onChange is the raw,
 * separator-free digit string ("10000").
 */
export function MoneyInput({ value, onChange, ...props }: BaseProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(sanitizeIntegerInput(event.target.value))
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={formatIntegerDisplay(value)}
      onChange={handleChange}
    />
  )
}

/**
 * Quantity / rate input: allows a single decimal separator ("," or "."), digits
 * grouped for display. Raw value uses "," as the decimal mark ("5,5").
 */
export function DecimalInput({ value, onChange, ...props }: BaseProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(sanitizeDecimalInput(event.target.value))
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={formatDecimalDisplay(value)}
      onChange={handleChange}
    />
  )
}
