import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading placeholder for the settings body: the summary strip tiles plus the
 * two-column card grid (col-span-7 and col-span-5). The static PageHeader stays
 * rendered by the page itself.
 */
export function SettingsSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-[28px]" />
        <Skeleton className="h-24 rounded-[28px]" />
        <Skeleton className="h-24 rounded-[28px]" />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <Skeleton className="h-64 rounded-[28px]" />
          <Skeleton className="h-56 rounded-[28px]" />
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Skeleton className="h-56 rounded-[28px]" />
          <Skeleton className="h-48 rounded-[28px]" />
        </div>
      </div>
    </>
  )
}
