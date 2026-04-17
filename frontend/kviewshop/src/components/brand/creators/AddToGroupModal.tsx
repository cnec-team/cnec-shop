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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'

interface Group {
  id: string
  name: string
  _count: { members: number }
}

interface AddToGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creatorIds: string[]
  onSuccess?: () => void
}

export function AddToGroupModal({ open, onOpenChange, creatorIds, onSuccess }: AddToGroupModalProps) {
  const [tab, setTab] = useState<'existing' | 'new'>('existing')
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/brand/creator-groups')
      const data = await res.json()
      setGroups(data.groups ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchGroups()
      setTab('existing')
      setSelectedGroupId('')
      setNewName('')
      setNewDesc('')
    }
  }, [open, fetchGroups])

  const handleAddToExisting = async () => {
    if (!selectedGroupId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/brand/creator-groups/${selectedGroupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorIds }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      toast.success(`${data.added ?? creatorIds.length}명을 그룹에 추가했습니다`)
      onSuccess?.()
      onOpenChange(false)
    } catch {
      toast.error('그룹에 추가하지 못했습니다')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateAndAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      // 1. Create group
      const createRes = await fetch('/api/brand/creator-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      })
      if (!createRes.ok) {
        const err = await createRes.json()
        toast.error(err.error || '그룹 생성 실패')
        return
      }
      const { group } = await createRes.json()

      // 2. Add members
      await fetch(`/api/brand/creator-groups/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorIds }),
      })

      toast.success(`"${newName.trim()}" 그룹을 생성하고 ${creatorIds.length}명을 추가했습니다`)
      onSuccess?.()
      onOpenChange(false)
    } catch {
      toast.error('그룹 생성 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <FolderPlus className="h-5 w-5 inline mr-2" />
            그룹에 추가 ({creatorIds.length}명)
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={v => setTab(v as 'existing' | 'new')}>
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1">기존 그룹 선택</TabsTrigger>
            <TabsTrigger value="new" className="flex-1">새 그룹 만들기</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3 mt-3">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                아직 그룹이 없습니다. &quot;새 그룹 만들기&quot; 탭에서 생성해주세요.
              </p>
            ) : (
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="그룹 선택..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g._count.members}명)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-3 mt-3">
            <div>
              <Label>그룹 이름 *</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="예: VIP 크리에이터"
                maxLength={50}
              />
            </div>
            <div>
              <Label>설명 (선택)</Label>
              <Input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="그룹 설명..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {tab === 'existing' ? (
            <Button
              onClick={handleAddToExisting}
              disabled={saving || !selectedGroupId}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              추가
            </Button>
          ) : (
            <Button
              onClick={handleCreateAndAdd}
              disabled={saving || !newName.trim()}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              생성 + 추가
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
