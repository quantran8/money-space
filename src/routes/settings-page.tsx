import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, Home, Save, SlidersHorizontal } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { household } from '@/lib/mock-data'
import { requiredText } from '@/lib/validation'

const settingsSchema = z.object({
  householdName: requiredText('tên hộ', 60),
  currency: z.enum(['VND', 'USD', 'EUR']),
  updateFrequency: z.enum(['weekly', 'biweekly', 'monthly']),
  reminderPayments: z.boolean(),
  reminderUpdate: z.boolean(),
})

type Settings = z.infer<typeof settingsSchema>

function isCurrency(value: string): value is Settings['currency'] {
  return value === 'VND' || value === 'USD' || value === 'EUR'
}

function isFrequency(value: string): value is Settings['updateFrequency'] {
  return value === 'weekly' || value === 'biweekly' || value === 'monthly'
}

const initialSettings: Settings = {
  householdName: household.name,
  currency: isCurrency(household.currency) ? household.currency : 'VND',
  updateFrequency: isFrequency(household.updateFrequency) ? household.updateFrequency : 'weekly',
  reminderPayments: true,
  reminderUpdate: true,
}

export function SettingsPage() {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitSuccessful, isDirty },
  } = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
    mode: 'onChange',
  })

  function handleSave(values: Settings) {
    // Re-baseline the form so isDirty/isSubmitSuccessful reflect the saved state.
    reset(values)
  }

  const saved = isSubmitSuccessful && !isDirty

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Cài đặt"
        title="Điều chỉnh cho vừa với nhà mình"
        description="Đặt tên hộ, đơn vị tiền, nhịp cập nhật và các nhắc nhở để cả hai luôn nắm được tình hình."
        actions={
          <Button type="submit" form="settings-form" disabled={!isValid}>
            <Save className="mr-2 size-4" />
            Lưu thay đổi
          </Button>
        }
      />

      {saved ? (
        <div className="rounded-[22px] border border-[hsla(var(--status-green),0.3)] bg-[hsla(var(--status-green),0.08)] px-4 py-3 text-sm font-medium text-[hsl(var(--status-green))]">
          Đã lưu cài đặt.
        </div>
      ) : null}

      <form
        id="settings-form"
        className="grid gap-4 lg:grid-cols-12"
        onSubmit={handleSubmit(handleSave)}
        noValidate
      >
        <Card className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Thông tin hộ</p>
              <h2 className="section-title mt-1 text-2xl font-semibold">Hồ sơ nhà mình</h2>
            </div>
            <Home className="size-5 text-[hsl(var(--accent))]" />
          </div>

          <div className="space-y-4">
            <FormField label="Tên hộ" error={errors.householdName?.message}>
              <Input aria-invalid={!!errors.householdName} {...register('householdName')} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Đơn vị tiền" error={errors.currency?.message}>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.currency}>
                        <SelectValue placeholder="Chọn đơn vị" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VND">VND - Việt Nam Đồng</SelectItem>
                        <SelectItem value="USD">USD - Đô la Mỹ</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="Nhịp cập nhật" error={errors.updateFrequency?.message}>
                <Controller
                  control={control}
                  name="updateFrequency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.updateFrequency}>
                        <SelectValue placeholder="Chọn nhịp cập nhật" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Hằng tuần</SelectItem>
                        <SelectItem value="biweekly">Hai tuần một lần</SelectItem>
                        <SelectItem value="monthly">Hằng tháng</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <div className="surface-muted rounded-[22px] p-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Hộ được tạo ngày {household.createdAt}. Đơn vị tiền áp dụng cho toàn bộ số liệu
              trong không gian này.
            </div>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-5">
          <Card>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Nhắc nhở</p>
                <h2 className="section-title mt-1 text-2xl font-semibold">Thông báo</h2>
              </div>
              <Bell className="size-5 text-[hsl(var(--accent))]" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-[22px] border bg-white p-4">
                <div>
                  <p className="font-medium">Khoản sắp tới</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    Nhắc trước ngày đến hạn các khoản phải trả.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="reminderPayments"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-[22px] border bg-white p-4">
                <div>
                  <p className="font-medium">Cập nhật định kỳ</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    Nhắc cả hai cập nhật snapshot theo nhịp đã chọn.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="reminderUpdate"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="size-5 text-[hsl(var(--accent))]" />
              <h3 className="text-lg font-semibold">Vùng cần cân nhắc</h3>
            </div>
            <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Xóa không gian sẽ gỡ toàn bộ tài sản, khoản chi, mục tiêu và thành viên. Hành động
              này không thể hoàn tác.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full border-[hsla(var(--status-red),0.3)] text-[hsl(var(--status-red))] hover:bg-[hsla(var(--status-red),0.06)]"
            >
              Xóa không gian
            </Button>
          </Card>
        </div>
      </form>
    </div>
  )
}
