'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, X } from 'lucide-react'
import { toast } from 'sonner'

interface ProofUploaderProps {
  settlementId: string
  value: string // URL or empty
  onChange: (url: string) => void
  disabled?: boolean
}

export function ProofUploader({ settlementId, value, onChange, disabled }: ProofUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 해요')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('JPG, PNG, PDF만 업로드 가능해요')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('settlementId', settlementId)
      const res = await fetch('/api/admin/settlements/upload-proof', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '업로드 실패')
      }
      const { url } = await res.json()
      onChange(url)
      toast.success('증빙이 업로드됐어요')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드에 실패했어요')
    } finally {
      setUploading(false)
    }
  }, [settlementId, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  if (value) {
    return (
      <div className="flex items-center gap-3 mt-2 p-3 border rounded-lg">
        {value.endsWith('.pdf') ? (
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
        ) : (
          <img src={value} alt="증빙" className="h-16 w-16 object-cover rounded shrink-0" />
        )}
        <div className="flex-1 text-sm">업로드 완료</div>
        <Button variant="outline" size="sm" onClick={() => onChange('')} disabled={disabled}>
          교체
        </Button>
      </div>
    )
  }

  return (
    <label
      className={`mt-2 flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        dragOver ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
      } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <Upload className="h-6 w-6 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {uploading ? '업로드 중...' : dragOver ? '여기에 놓으세요' : 'JPG, PNG, PDF (최대 10MB)'}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        disabled={disabled || uploading}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleUpload(f)
        }}
      />
    </label>
  )
}
