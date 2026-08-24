import { cn } from '@money-space/core/shared/lib/utils'

type FilterChipProps = {
  label: string
  active: boolean
  onClick: () => void
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
        active
          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
          : 'bg-wash text-ink2 hover:text-[hsl(var(--foreground))]',
      )}
    >
      {label}
    </button>
  )
}
