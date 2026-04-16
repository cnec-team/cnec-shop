'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  type: string
  body: string
  commissionRate: number | null
}

interface Campaign {
  id: string
  title: string
  type: string
  status: string
}

interface ProposalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'single' | 'bulk'
  creatorIds: string[]
  defaultType?: 'GONGGU' | 'CREATOR_PICK'
  onSuccess: () => void
}

export function ProposalModal({
  open,
  onOpenChange,
  mode,
  creatorIds,
  defaultType,
  onSuccess,
}: ProposalModalProps) {
  const [type, setType] = useState<'GONGGU' | 'CREATOR_PICK'>(defaultType ?? 'GONGGU')
  const [campaignId, setCampaignId] = useState<string>('')
  const [templateId, setTemplateId] = useState<string>('')
  const [commissionRate, setCommissionRate] = useState<string>('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        fetch('/api/brand/proposal-templates'),
        fetch('/api/brand/campaigns/list'),
      ])
      const tData = await tRes.json()
      const cData = await cRes.json()
      setTemplates(tData.templates ?? [])
      setCampaigns(cData.campaigns ?? [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchData()
      setType(defaultType ?? 'GONGGU')
      setCampaignId('')
      setTemplateId('')
      setCommissionRate('')
      setMessage('')
    }
  }, [open, fetchData, defaultType])

  const handleTemplateSelect = (tid: string) => {
    setTemplateId(tid)
    const t = templates.find(t => t.id === tid)
    if (t) {
      setMessage(t.body)
      if (t.commissionRate) setCommissionRate(String(t.commissionRate))
      setType(t.type as 'GONGGU' | 'CREATOR_PICK')
    }
  }

  const handleSubmit = async () => {
    if (type === 'GONGGU' && !campaignId) {
      toast.error('공구 제안 시 캠페인을 선택해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...(mode === 'single'
          ? { creatorId: creatorIds[0] }
          : { creatorIds }),
        type,
        campaignId: campaignId || undefined,
        templateId: templateId || undefined,
        commissionRate: commissionRate ? parseFloat(commissionRate) : undefined,
        message: message || undefined,
      }

      const endpoint = mode === 'single' ? '/api/brand/proposals' : '/api/brand/proposals/bulk'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || '제안 전송에 실패했습니다')
        return
      }

      toast.success(
        mode === 'single'
          ? '제안을 보냈습니다'
          : `${creatorIds.length}명에게 제안을 보냈습니다`
      )
      onSuccess()
      onOpenChange(false)
    } catch {
      toast.error('제안 전송 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'single' ? '크리에이터에게 제안' : `${creatorIds.length}명에게 일괄 제안`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {templates.length > 0 && (
            <div>
              <Label>템플릿 (선택)</Label>
              <Select value={templateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger><SelectValue placeholder="템플릿 선택..." /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>제안 유형</Label>
            <Tabs value={type} onValueChange={v => setType(v as 'GONGGU' | 'CREATOR_PICK')}>
              <TabsList className="w-full">
                <TabsTrigger value="GONGGU" className="flex-1">공구</TabsTrigger>
                <TabsTrigger value="CREATOR_PICK" className="flex-1">크리에이터픽</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {type === 'GONGGU' && (
            <div>
              <Label>캠페인 선택 *</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger><SelectValue placeholder="캠페인 선택..." /></SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>커미션율 (%)</Label>
            <Input
              type="number"
              value={commissionRate}
              onChange={e => setCommissionRate(e.target.value)}
              placeholder="예: 15"
            />
          </div>

          <div>
            <Label>메시지</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="크리에이터에게 보낼 메시지..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {'변수: {{creatorName}}, {{brandName}}, {{campaignName}}'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (type === 'GONGGU' && !campaignId)}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {mode === 'single' ? '제안 보내기' : `${creatorIds.length}명에게 일괄 전송`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
