'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Download } from 'lucide-react'

const columns = [
  { id: 'username', label: '인스타그램 (@)', default: true },
  { id: 'fullName', label: '이름', default: true },
  { id: 'followers', label: '팔로워 수', default: true },
  { id: 'following', label: '팔로잉 수', default: false },
  { id: 'engagement', label: '참여율 (%)', default: true },
  { id: 'posts', label: '게시물 수', default: false },
  { id: 'category', label: '카테고리', default: true },
  { id: 'verified', label: '인증 여부', default: false },
  { id: 'bio', label: '바이오', default: false },
  { id: 'externalUrl', label: '외부 링크', default: false },
]

interface ExportColumnsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creatorIds: string[]
}

export function ExportColumnsDialog({ open, onOpenChange, creatorIds }: ExportColumnsDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(columns.filter(c => c.default).map(c => c.id))
  )

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(columns.map(c => c.id)))
  const deselectAll = () => setSelected(new Set())

  const handleDownload = () => {
    const params = new URLSearchParams()
    if (creatorIds.length > 0) params.set('ids', creatorIds.join(','))
    params.set('columns', [...selected].join(','))
    window.open(`/api/brand/creators/export?${params.toString()}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>엑셀 다운로드 - 컬럼 선택</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={selectAll}>전체 선택</Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>전체 해제</Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {columns.map(col => (
            <label
              key={col.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selected.has(col.id)}
                onCheckedChange={() => toggle(col.id)}
              />
              <span className="text-sm">{col.label}</span>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleDownload} disabled={selected.size === 0}>
            <Download className="h-4 w-4 mr-1" />
            다운로드 ({creatorIds.length > 0 ? `${creatorIds.length}명` : '전체'})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
