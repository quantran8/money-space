import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@money-space/core/shared/lib/utils'

type FormFieldProps = {
  label: string
  error?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="t-caption font-medium text-alert">{error}</p>
      ) : null}
    </div>
  )
}
