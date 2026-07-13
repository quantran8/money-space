import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading placeholder mirroring the v2 Home layout (§9.4): the hero snapshot,
 * then the Tiền nhà mình / Cần chú ý / Kế hoạch dài hạn / Gần đây section cards.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* 1. Hero snapshot */}
      <Skeleton className="h-60 rounded-[28px]" />

      {/* 2. Tiền nhà mình — two grouped surfaces */}
      <Skeleton className="h-52 rounded-[26px]" />

      {/* 3. Cần chú ý — list + discuss */}
      <Skeleton className="h-64 rounded-[26px]" />

      {/* 4. Kế hoạch dài hạn */}
      <Skeleton className="h-52 rounded-[26px]" />

      {/* 5. Gần đây */}
      <Skeleton className="h-40 rounded-[26px]" />
    </div>
  )
}
