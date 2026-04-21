'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface Props {
  initialData: {
    acceptingProposals: boolean
    monthlyProposalLimit: number
    currentMonthProposals: number
  }
}

export function ProposalSettingsForm({ initialData }: Props) {
  const [accepting, setAccepting] = useState(initialData.acceptingProposals)
  const [saving, setSaving] = useState(false)

  const handleToggle = async (value: boolean) => {
    setSaving(true)
    try {
      const res = await fetch('/api/creator/settings/proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptingProposals: value }),
      })
      if (!res.ok) throw new Error()
      setAccepting(value)
      toast.success(value ? '이제 새 제안을 받아요' : '새 제안을 받지 않아요')
    } catch {
      toast.error('설정 저장에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const percent = initialData.monthlyProposalLimit > 0
    ? Math.round((initialData.currentMonthProposals / initialData.monthlyProposalLimit) * 100)
    : 0

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-medium">지금 새 제안 받기</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {accepting
                ? '브랜드의 제안을 받을 수 있어요.'
                : '새 제안을 받지 않아요. 언제든 다시 켤 수 있어요.'}
            </p>
          </div>
          <Switch
            checked={accepting}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-medium mb-3">이번 달 받은 제안</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold">
            {initialData.currentMonthProposals} / {initialData.monthlyProposalLimit}건
          </span>
          <span className="text-sm text-muted-foreground">{percent}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          매달 30건까지 받을 수 있어요. 크리에이터 보호를 위해 한 달에 받을 수 있는 제안 수를 제한하고 있어요. 30건 도달하면 다음 달 1일까지 새 제안을 받지 않아요.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="font-medium mb-3">매칭 점수 70점 이상만 받아요</h3>
        <p className="text-sm text-muted-foreground">
          우리 브랜드/카테고리와 잘 맞지 않는 제안은 자동으로 차단돼요. 정말 잘 맞는 브랜드의 제안만 받을 수 있어요.
        </p>
      </Card>
    </div>
  )
}
