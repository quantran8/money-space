import { Clock3 } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const payments = [
  ['Học phí tháng 7', '12M', '10 Jul', 'Quan trọng'],
  ['Tiền nhà', '8M', '15 Jul', 'Bình thường'],
  ['Bảo hiểm xe', '1,8M', '22 Jul', 'Chờ xác nhận'],
]

export function PaymentsPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Khoản sắp tới"
        title="Tránh bị động với các khoản sắp phải trả"
        description="Nhìn trước 7 đến 30 ngày để biết khoản nào cần chuẩn bị, khoản nào cần cùng trao đổi."
      />

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Danh sách khoản</p>
            <h2 className="section-title mt-1 text-2xl font-semibold">Lịch thanh toán sắp tới</h2>
          </div>
          <Clock3 className="size-5 text-[hsl(var(--status-orange))]" />
        </div>

        <div className="space-y-3">
          {payments.map(([name, amount, due, state]) => (
            <div key={name} className="surface-muted rounded-[22px] px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    Đến hạn {due}
                  </p>
                </div>
                <div className="text-right">
                  <p className="money-number text-2xl">{amount}</p>
                  <Badge className="mt-2">{state}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
