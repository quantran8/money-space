import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading placeholder for the two-column settings card grid.
 */
export function SettingsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <Skeleton className="h-64 rounded-[28px]" />
          <Skeleton className="h-56 rounded-[28px]" />
          <Skeleton className="h-44 rounded-[28px]" />
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Skeleton className="h-56 rounded-[28px]" />
          <Skeleton className="h-64 rounded-[28px]" />
        </div>
    </div>
  )
}
