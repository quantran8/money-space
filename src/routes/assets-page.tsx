import { zodResolver } from '@hookform/resolvers/zod'
import { Landmark, Plus, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  assets as seedAssets,
  liquidityLabels,
  parseAmount,
  type AssetItem,
  type AssetLiquidity,
} from '@/lib/mock-data'
import { moneyAmount, optionalText, requiredText } from '@/lib/validation'

const assetSchema = z.object({
  name: requiredText('tên tài sản'),
  value: moneyAmount,
  liquidity: z.enum(['usable_now', 'not_immediate', 'long_term']),
  note: optionalText(120),
})

type AssetForm = z.infer<typeof assetSchema>

const defaultValues: AssetForm = {
  name: '',
  value: '',
  liquidity: 'usable_now',
  note: '',
}

function formatTotal(total: number) {
  const rounded = Math.round(total * 10) / 10
  return `${String(rounded).replace('.', ',')}M`
}

export function AssetsPage() {
  const [assets, setAssets] = useState<AssetItem[]>(seedAssets)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
    defaultValues,
    mode: 'onChange',
  })

  const totals = useMemo(() => {
    const acc: Record<AssetLiquidity, number> = {
      usable_now: 0,
      not_immediate: 0,
      long_term: 0,
    }
    for (const asset of assets) {
      acc[asset.liquidity] += parseAmount(asset.value)
    }
    return acc
  }, [assets])

  function onSubmit(values: AssetForm) {
    const nextAsset: AssetItem = {
      id: `a${assets.length + 1}-${values.name}`,
      name: values.name.trim(),
      value: values.value.trim(),
      liquidity: values.liquidity,
      note: values.note.trim() || 'Chưa có ghi chú',
    }

    setAssets((current) => [nextAsset, ...current])
    reset(defaultValues)
  }

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
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="surface-muted flex items-center justify-between rounded-[22px] px-4 py-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{asset.name}</p>
                    <Badge>{liquidityLabels[asset.liquidity]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{asset.note}</p>
                </div>
                <p className="money-number text-2xl">{asset.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-5">
          <Card>
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
                <p className="section-title mt-3 text-3xl font-semibold">
                  {formatTotal(totals.usable_now)}
                </p>
              </div>

              <div className="rounded-[22px] border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Tiết kiệm & dự phòng</p>
                  <Badge className="bg-[hsla(var(--status-green),0.1)] text-[hsl(var(--status-green))]">
                    Ổn
                  </Badge>
                </div>
                <p className="section-title mt-3 text-3xl font-semibold">
                  {formatTotal(totals.not_immediate)}
                </p>
              </div>

              <div className="rounded-[22px] border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Tài sản dài hạn</p>
                  <Badge>Giữ lâu dài</Badge>
                </div>
                <p className="section-title mt-3 text-3xl font-semibold">
                  {formatTotal(totals.long_term)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Thêm tài sản</p>
                <h2 className="section-title mt-1 text-2xl font-semibold">Ghi một khoản mới</h2>
              </div>
              <Plus className="size-5 text-[hsl(var(--accent))]" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormField label="Tên tài sản" error={errors.name?.message}>
                <Input
                  placeholder="Ví dụ: Sổ tiết kiệm ACB"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Giá trị" error={errors.value?.message}>
                  <Input
                    placeholder="Ví dụ: 20M"
                    aria-invalid={!!errors.value}
                    {...register('value')}
                  />
                </FormField>
                <FormField label="Nhóm" error={errors.liquidity?.message}>
                  <Select aria-invalid={!!errors.liquidity} {...register('liquidity')}>
                    <option value="usable_now">Dùng ngay</option>
                    <option value="not_immediate">Dự phòng</option>
                    <option value="long_term">Dài hạn</option>
                  </Select>
                </FormField>
              </div>

              <FormField label="Ghi chú" error={errors.note?.message}>
                <Input
                  placeholder="Ví dụ: Tài khoản chung"
                  aria-invalid={!!errors.note}
                  {...register('note')}
                />
              </FormField>

              <Button type="submit" className="w-full" disabled={!isValid}>
                <Plus className="mr-2 size-4" />
                Thêm tài sản
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
