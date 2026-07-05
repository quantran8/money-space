import { PiggyBank } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const goals = [
  { name: 'Quỹ dự phòng', current: '86M', target: '120M', progress: 72, note: 'Ưu tiên cao' },
  { name: 'Du lịch cuối năm', current: '19M', target: '50M', progress: 38, note: 'Đang tích lũy dần' },
  { name: 'Học cho con', current: '12M', target: '40M', progress: 30, note: 'Bắt đầu sớm để nhẹ áp lực' },
]

export function GoalsPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Mục tiêu tài chính"
        title="Giữ tiền có lý do rõ ràng"
        description="Mỗi mục tiêu nên đủ rõ để cả hai biết đang tiết kiệm cho điều gì và tiến độ đã đi tới đâu."
      />

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Danh sách mục tiêu</p>
            <h2 className="section-title mt-1 text-2xl font-semibold">Tiến độ mục tiêu chung</h2>
          </div>
          <PiggyBank className="size-5 text-[hsl(var(--accent))]" />
        </div>

        <div className="space-y-5">
          {goals.map((goal) => (
            <div key={goal.name} className="rounded-[22px] border bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{goal.name}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{goal.note}</p>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {goal.current} / {goal.target}
                </p>
              </div>
              <Progress value={goal.progress} className="mt-4" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
