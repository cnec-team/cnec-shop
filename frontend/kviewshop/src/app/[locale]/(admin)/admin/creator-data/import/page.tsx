'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Upload, Check, AlertCircle, X, FileSpreadsheet, ChevronLeft,
} from 'lucide-react'
import { toast } from 'sonner'

type Status = 'idle' | 'importing' | 'complete' | 'error'

interface ImportResult {
  total: number
  success: number
  failed: number
  skipped: number
  errors: { username: string; error: string }[]
}

export default function AdminCreatorImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file)
    } else {
      toast.error('CSV 파일만 업로드 가능합니다')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file)
    } else {
      toast.error('CSV 파일만 업로드 가능합니다')
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return
    setStatus('importing')
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await fetch('/api/admin/import/instagram', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '임포트 실패')
      }
      const result: ImportResult = await res.json()
      setImportResult(result)
      setStatus('complete')
      toast.success(`${result.success}명 임포트 완료`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류')
      setStatus('error')
      toast.error('임포트 실패')
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setSelectedFile(null)
    setImportResult(null)
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => router.push('/admin/creator-data')} className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" /> 돌아가기
      </Button>

      <h1 className="text-2xl font-bold mb-2">크리에이터 데이터 임포트</h1>
      <p className="text-muted-foreground mb-6">
        Apify Instagram Profile Scraper에서 내보낸 CSV 파일을 업로드하면
        크리에이터 프로필 데이터가 자동으로 임포트됩니다.
      </p>

      {/* 파일 선택 */}
      {status === 'idle' && (
        <Card>
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">CSV 파일을 드래그하거나 클릭하여 선택</p>
              <p className="text-sm text-muted-foreground mt-1">
                Apify Instagram Profile Scraper CSV 파일 (.csv)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {selectedFile && (
              <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedFile(null) }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {selectedFile && (
              <Button className="w-full mt-4" onClick={handleImport} size="lg">
                <Upload className="h-4 w-4 mr-2" /> 임포트 시작
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 진행 중 */}
      {status === 'importing' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="font-medium">임포트 진행 중...</p>
            <p className="text-sm text-muted-foreground mt-1">
              프로필 사진과 게시물 썸네일을 다운로드하고 있습니다.
              데이터 양에 따라 몇 분이 걸릴 수 있습니다.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              이 페이지를 닫지 마세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 완료 */}
      {status === 'complete' && importResult && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-lg font-semibold">임포트 완료</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xl font-bold text-green-700">{importResult.success}</p>
                <p className="text-xs text-green-600">성공</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xl font-bold text-red-700">{importResult.failed}</p>
                <p className="text-xs text-red-600">실패</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-700">{importResult.skipped}</p>
                <p className="text-xs text-gray-600">스킵</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-red-600">실패 항목</h3>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      @{err.username}: {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => router.push('/admin/creator-data')}>
                크리에이터 목록 보기
              </Button>
              <Button className="flex-1" onClick={handleReset}>
                다른 파일 임포트
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 에러 */}
      {status === 'error' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="font-medium text-red-600">임포트 실패</p>
            <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            <Button className="mt-4" onClick={handleReset}>다시 시도</Button>
          </CardContent>
        </Card>
      )}

      {/* 안내 */}
      <div className="mt-8 space-y-3">
        <h3 className="text-sm font-semibold">임포트 안내</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>- Apify의 Instagram Profile Scraper에서 내보낸 CSV 파일을 사용해주세요</p>
          <p>- 필수 컬럼: username, followersCount, followsCount, postsCount</p>
          <p>- 프로필 사진과 게시물 썸네일은 자동으로 R2에 저장됩니다</p>
          <p>- 이미 등록된 크리에이터는 데이터가 업데이트됩니다 (덮어쓰기)</p>
          <p>- 참여율은 최근 게시물의 좋아요+댓글 기준으로 자동 계산됩니다</p>
          <p>- 데이터 양에 따라 수 분이 걸릴 수 있습니다</p>
        </div>
      </div>
    </div>
  )
}
