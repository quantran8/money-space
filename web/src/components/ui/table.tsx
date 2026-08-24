import * as React from 'react'

import { cn } from '@money-space/core/shared/lib/utils'

/**
 * The dense table (design.md §2.4, §3, §11.3).
 *
 * No rules anywhere: not under the header, not between rows, not above the
 * footer. Rows are separated by rhythm plus a `--sunk` hover band, and the
 * header is a `.label` — mono, uppercase, 10px, `--ink3`.
 *
 * A grand total is NOT a table row: it belongs in a sunk block set 20px below
 * the table (§11.2), which is what `TotalRow` in `@/components/ui/panel` is for.
 */
function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn(className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('bg-wash font-medium', className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn('transition-colors hover:bg-wash', className)}
      {...props}
    />
  )
}

/**
 * Header cell. `.label` is mono and only ever safe on SHORT ASCII strings —
 * IBM Plex Mono renders Vietnamese diacritics poorly (§10.1, §10.3). An accented
 * header still gets the size and tracking, but falls back through the font stack.
 */
function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn('label h-9 px-4 text-left align-middle', className)}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn('px-4 py-3 align-middle', className)}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-[13px] text-ink3', className)}
      {...props}
    />
  )
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
}
