'use client'

import { Button } from '@/components/ui/button'
import { Send, FolderPlus, Download } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onProposeBulk: () => void
  onSaveToGroup: () => void
  onExport: () => void
  onClearSelection: () => void
}

export function BulkActionBar({
  selectedCount,
  onProposeBulk,
  onSaveToGroup,
  onExport,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="sticky top-0 z-20 bg-background border-b px-4 py-3 flex items-center gap-3 shadow-sm rounded-lg mb-3">
      <span className="text-sm font-medium">{selectedCount}명 선택</span>
      <div className="flex gap-2">
        <Button size="sm" onClick={onProposeBulk}>
          <Send className="h-4 w-4 mr-1" /> 공구 초대
        </Button>
        <Button size="sm" variant="outline" onClick={onSaveToGroup}>
          <FolderPlus className="h-4 w-4 mr-1" /> 그룹에 저장
        </Button>
        <Button size="sm" variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-1" /> 엑셀 다운로드
        </Button>
      </div>
      <Button size="sm" variant="ghost" onClick={onClearSelection} className="ml-auto">
        선택 해제
      </Button>
    </div>
  )
}
