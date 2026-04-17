'use client'

import { Button } from '@/components/ui/button'
import { Send, FolderPlus, Download, ShoppingBag } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onProposeBulk: () => void
  onProductPickBulk?: () => void
  onAddToGroup: () => void
  onExport: () => void
  onClearSelection: () => void
  /** @deprecated Use onAddToGroup instead */
  onSaveToGroup?: () => void
}

export function BulkActionBar({
  selectedCount,
  onProposeBulk,
  onProductPickBulk,
  onAddToGroup,
  onExport,
  onClearSelection,
  onSaveToGroup,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  const handleGroup = onAddToGroup || onSaveToGroup

  return (
    <div className="sticky top-0 z-20 bg-background border-b px-4 py-3 flex items-center gap-3 shadow-sm rounded-lg mb-3">
      <span className="text-sm font-medium">{selectedCount}명 선택</span>
      <div className="flex gap-2">
        <Button size="sm" onClick={onProposeBulk}>
          <Send className="h-4 w-4 mr-1" /> 공구 초대 보내기
        </Button>
        {onProductPickBulk && (
          <Button size="sm" variant="outline" onClick={onProductPickBulk}>
            <ShoppingBag className="h-4 w-4 mr-1" /> 상품 추천 보내기
          </Button>
        )}
        {handleGroup && (
          <Button size="sm" variant="outline" onClick={handleGroup}>
            <FolderPlus className="h-4 w-4 mr-1" /> 그룹에 추가
          </Button>
        )}
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
