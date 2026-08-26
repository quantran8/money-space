import * as LabelPrimitive from '@radix-ui/react-label'
import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn('t-body-sm font-medium text-foreground', className)}
      {...props}
    />
  )
}

export { Label }
