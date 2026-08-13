import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading placeholder mirroring the v4.0 Home (design.md §9.1, §12).
 *
 * Panel radius (14px) and the section rhythm (16px) match the real page, so the
 * layout does not shift when data lands. Heights track each section's actual
 * shape: a tall picture panel, then the thirty-day view, goal, sources, log.
 */
export function DashboardSkeleton() {
  return (
    <div className="max-w-[1220px] space-y-4">
      <Skeleton className="h-10 w-48 rounded-[8px]" />

      {/* 1 — Bức tranh hôm nay */}
      <Skeleton className="h-[420px] rounded-[14px]" />

      {/* 2 — Ba mươi ngày tới */}
      <Skeleton className="h-[360px] rounded-[14px]" />

      {/* 3 — Mục tiêu chính */}
      <Skeleton className="h-[220px] rounded-[14px]" />

      {/* 4 — Tiền đang ở đâu */}
      <Skeleton className="h-[320px] rounded-[14px]" />

      {/* 5 — Nhật ký */}
      <Skeleton className="h-[200px] rounded-[14px]" />
    </div>
  )
}
