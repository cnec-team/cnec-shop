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
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Group {
  id: string
  name: string
  _count: { members: number }
}

interface GroupSaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creatorIds: string[]
  onSuccess: () => void
}

export function GroupSaveDialog({ open, onOpenChange, creatorIds, onSuccess }: GroupSaveDialogProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/brand/creator-groups')
      const data = await res.json()
      setGroups(data.groups ?? [])
    } catch {
      toast.error('그룹 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchGroups()
      setSelectedGroupIds(new Set())
      setShowNewGroup(false)
      setNewGroupName('')
    }
  }, [open, fetchGroups])

  const toggleGroup = (id: string) => {
    setSelectedGroupIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      const res = await fetch('/api/brand/creator-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setGroups(prev => [{ ...data.group, _count: { members: 0 } }, ...prev])
        setSelectedGroupIds(prev => new Set([...prev, data.group.id]))
        setNewGroupName('')
        setShowNewGroup(false)
      } else {
        toast.error(data.error || '그룹 생성 실패')
      }
    } catch {
      toast.error('그룹 생성 중 오류가 발생했습니다')
    }
  }

  const handleSave = async () => {
    if (selectedGroupIds.size === 0) {
      toast.error('그룹을 선택해주세요')
      return
    }
    setSaving(true)
    try {
      let totalAdded = 0
      for (const groupId of selectedGroupIds) {
        const res = await fetch(`/api/brand/creator-groups/${groupId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorIds }),
        })
        if (res.ok) {
          const data = await res.json()
          totalAdded += data.added
        }
      }
      toast.success(`${selectedGroupIds.size}개 그룹에 저장했습니다`)
      onSuccess()
      onOpenChange(false)
    } catch {
      toast.error('저장 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>그룹에 저장 ({creatorIds.length}명)</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {groups.map(g => (
              <label
                key={g.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={selectedGroupIds.has(g.id)}
                  onCheckedChange={() => toggleGroup(g.id)}
                />
                <span className="text-sm flex-1">{g.name}</span>
                <span className="text-xs text-muted-foreground">{g._count.members}명</span>
              </label>
            ))}
            {groups.length === 0 && !showNewGroup && (
              <p className="text-sm text-muted-foreground text-center py-4">
                아직 그룹이 없습니다. 새 그룹을 생성해주세요.
              </p>
            )}
          </div>
        )}

        {showNewGroup ? (
          <div className="flex gap-2">
            <Input
              placeholder="새 그룹 이름"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
              autoFocus
            />
            <Button size="sm" onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              생성
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNewGroup(false)}>
              취소
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowNewGroup(true)}>
            <Plus className="h-4 w-4 mr-1" /> 새 그룹 생성
          </Button>
        )}

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || selectedGroupIds.size === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            저장하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
