import { Plus, ReceiptText, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { moneyEvents as seedEvents, type MoneyEventItem } from '@/lib/mock-data'

type DraftEvent = {
  title: string
  amount: string
  type: MoneyEventItem['type']
  category: string
  date: string
  note: string
}

const initialDraft: DraftEvent = {
  title: '',
  amount: '',
  type: 'expense',
  category: 'other',
  date: '2026-07-05',
  note: '',
}

function getAmountTone(direction: MoneyEventItem['direction']) {
  if (direction === 'inflow') return 'text-[hsl(var(--status-green))]'
  if (direction === 'outflow') return 'text-[hsl(var(--status-red))]'
  return 'text-[hsl(var(--accent))]'
}

function getDirection(type: MoneyEventItem['type']): MoneyEventItem['direction'] {
  if (type === 'income') return 'inflow'
  if (type === 'expense') return 'outflow'
  return 'neutral'
}

function formatAmount(rawAmount: string, type: MoneyEventItem['type']) {
  const normalized = rawAmount.trim()
  if (!normalized) return ''
  if (normalized.startsWith('+') || normalized.startsWith('-')) return normalized
  return type === 'expense' ? `-${normalized}` : `+${normalized}`
}

export function EventsPage() {
  const [events, setEvents] = useState(seedEvents)
  const [draft, setDraft] = useState<DraftEvent>(initialDraft)

  function updateDraft<Key extends keyof DraftEvent>(key: Key, value: DraftEvent[Key]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit() {
    if (!draft.title.trim() || !draft.amount.trim()) return

    const nextEvent: MoneyEventItem = {
      title: draft.title.trim(),
      amount: formatAmount(draft.amount, draft.type),
      note: draft.note.trim() || 'Chưa có ghi chú thêm.',
      date: draft.date.slice(8, 10) + ' Jul',
      type: draft.type,
      category: draft.category,
      direction: getDirection(draft.type),
    }

    setEvents((current) => [nextEvent, ...current])
    setDraft(initialDraft)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Timeline giải thích vì sao snapshot thay đổi"
        title="Sự kiện tài chính"
        description="Chỉ ghi những khoản đủ lớn hoặc đủ quan trọng để cả hai cùng hiểu chuyện gì vừa xảy ra."
        actions={<Button className="px-5 py-3 text-sm font-semibold">+ Ghi nhận sự kiện</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Money events</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                Những sự kiện làm bức tranh tài chính thay đổi
              </h2>
            </div>
            <ReceiptText className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <div className="mt-6 space-y-4">
            {events.map((event) => (
              <div
                key={`${event.title}-${event.date}-${event.amount}`}
                className="rounded-[28px] border bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{event.title}</p>
                      <Badge>{event.type}</Badge>
                      <Badge>{event.category}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                      {event.note}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`money-number text-2xl ${getAmountTone(event.direction)}`}>
                      {event.amount}
                    </p>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {event.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nhập event</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">
                Ghi một khoản lớn hoặc đáng chú ý
              </h2>
            </div>
            <Sparkles className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên event</label>
                <Input
                  placeholder="Ví dụ: Đóng học phí tháng 7"
                  value={draft.title}
                  onChange={(event) => updateDraft('title', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số tiền</label>
                <Input
                  placeholder="Ví dụ: 12M"
                  value={draft.amount}
                  onChange={(event) => updateDraft('amount', event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại event</label>
                <Select
                  value={draft.type}
                  onChange={(event) =>
                    updateDraft('type', event.target.value as DraftEvent['type'])
                  }
                >
                  <option value="expense">Chi ra</option>
                  <option value="income">Tiền vào</option>
                  <option value="transfer">Chuyển khoản nội bộ</option>
                  <option value="goal_contribution">Góp vào mục tiêu</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nhóm</label>
                <Select
                  value={draft.category}
                  onChange={(event) => updateDraft('category', event.target.value)}
                >
                  <option value="education">Giáo dục</option>
                  <option value="repair">Sửa chữa</option>
                  <option value="saving">Tiết kiệm</option>
                  <option value="income">Thu nhập</option>
                  <option value="household">Sinh hoạt</option>
                  <option value="other">Khác</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày xảy ra</label>
              <Input
                type="date"
                value={draft.date}
                onChange={(event) => updateDraft('date', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú</label>
              <Textarea
                placeholder="Thêm một câu ngắn để người kia hiểu vì sao snapshot thay đổi."
                value={draft.note}
                onChange={(event) => updateDraft('note', event.target.value)}
              />
            </div>

            <div className="surface-muted rounded-[22px] p-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Mục tiêu của `money_events` không phải ghi hết mọi giao dịch nhỏ. Chỉ cần ghi
              những khoản đủ lớn hoặc đủ quan trọng để cả hai cùng hiểu vì sao tiền tăng giảm.
            </div>

            <Button className="w-full" onClick={handleSubmit}>
              <Plus className="mr-2 size-4" />
              Thêm money event
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
