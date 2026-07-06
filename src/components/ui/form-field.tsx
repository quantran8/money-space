import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

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
        <p className="text-xs font-medium text-[hsl(var(--status-red))]">{error}</p>
      ) : null}
    </div>
  )
}
