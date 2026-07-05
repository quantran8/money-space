import { Landmark, Wallet } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const assets = [
  ['Tiền mặt ở nhà', '4,5M', 'Dùng ngay'],
  ['VCB Family', '20M', 'Dùng ngay'],
  ['Sổ tiết kiệm', '86M', 'Dự phòng'],
  ['Vàng', '54M', 'Dài hạn'],
]

export function AssetsPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Tài sản & nguồn tiền"
        title="Tiền nhà mình đang nằm ở đâu"
        description="Chia tài sản theo nhóm dễ hiểu để cả hai cùng nhìn được tiền dùng ngay, dự phòng và phần dài hạn."
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Danh sách tài sản</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">Các khoản đang có</h2>
            </div>
            <Wallet className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <div className="space-y-3">
            {assets.map(([name, value, state]) => (
              <div
                key={name}
                className="surface-muted flex items-center justify-between rounded-[22px] px-4 py-4"
              >
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{state}</p>
                </div>
                <p className="money-number text-2xl">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Phân nhóm</p>
              <h2 className="mt-1 text-lg font-semibold">Tổng quan tài sản</h2>
            </div>
            <Landmark className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Có thể dùng ngay</p>
                <Badge>Dễ dùng</Badge>
              </div>
              <p className="section-title mt-3 text-3xl font-semibold">24,5M</p>
            </div>

            <div className="rounded-[22px] border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Tiết kiệm & dự phòng</p>
                <Badge className="bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]">
                  Ổn
                </Badge>
              </div>
              <p className="section-title mt-3 text-3xl font-semibold">86M</p>
            </div>

            <div className="rounded-[22px] border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Tài sản dài hạn</p>
                <Badge>Giữ lâu dài</Badge>
              </div>
              <p className="section-title mt-3 text-3xl font-semibold">374M</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
