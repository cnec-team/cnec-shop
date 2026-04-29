'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Download, Instagram, Loader2, ImageIcon, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { getCreatorCertificateData, type CertificateData } from '@/lib/actions/creator-certificate'

type FormatType = 'story' | 'feed'

function formatRevenue(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억원`
  if (amount >= 10000) return `${Math.floor(amount / 10000).toLocaleString()}만원`
  return `${amount.toLocaleString()}원`
}

function drawCertificate(
  canvas: HTMLCanvasElement,
  data: CertificateData,
  format: FormatType
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = 1080
  const h = format === 'story' ? 1920 : 1080
  canvas.width = w
  canvas.height = h

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, w, h)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(0.5, '#16213e')
  gradient.addColorStop(1, '#0f3460')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // Decorative circles
  ctx.globalAlpha = 0.05
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(w * 0.8, h * 0.15, 300, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w * 0.2, h * 0.85, 200, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  const centerX = w / 2
  const topY = format === 'story' ? 320 : 140

  // CNEC SHOP logo text
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '600 36px -apple-system, "Helvetica Neue", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('CNEC SHOP', centerX, topY)

  // Divider line
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(centerX - 100, topY + 30)
  ctx.lineTo(centerX + 100, topY + 30)
  ctx.stroke()

  // Creator name
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 56px -apple-system, "Helvetica Neue", sans-serif'
  ctx.fillText(data.creatorName, centerX, topY + 100)

  // "이번 달 수익" label
  const mainY = format === 'story' ? topY + 220 : topY + 190
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '500 32px -apple-system, "Helvetica Neue", sans-serif'
  ctx.fillText('이번 달 수익', centerX, mainY)

  // Main revenue number
  ctx.fillStyle = '#f0c040'
  ctx.font = '800 96px -apple-system, "Helvetica Neue", sans-serif'
  ctx.fillText(formatRevenue(data.thisMonthEarnings), centerX, mainY + 100)

  // Stats row
  const statsY = format === 'story' ? mainY + 220 : mainY + 180
  const stats = [
    { label: '누적 수익', value: formatRevenue(data.totalEarnings) },
    { label: '팔로워', value: `${data.followerCount.toLocaleString()}명` },
    { label: '총 주문', value: `${data.totalOrders.toLocaleString()}건` },
  ]

  const statWidth = 260
  const startX = centerX - (statWidth * stats.length) / 2 + statWidth / 2

  stats.forEach((stat, i) => {
    const x = startX + i * statWidth

    // Stat value
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 42px -apple-system, "Helvetica Neue", sans-serif'
    ctx.fillText(stat.value, x, statsY)

    // Stat label
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '500 24px -apple-system, "Helvetica Neue", sans-serif'
    ctx.fillText(stat.label, x, statsY + 36)
  })

  // Bottom: shop URL
  const bottomY = format === 'story' ? h - 200 : h - 80
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = '400 28px -apple-system, "Helvetica Neue", sans-serif'
  ctx.fillText(`cnecshop.com/${data.shopId}`, centerX, bottomY)

  // Date
  const now = new Date()
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.font = '400 22px -apple-system, "Helvetica Neue", sans-serif'
  ctx.fillText(dateStr, centerX, bottomY + 40)
}

export default function CreatorCertificatePage() {
  const params = useParams()
  const locale = params.locale as string
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [data, setData] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [format, setFormat] = useState<FormatType>('story')

  useEffect(() => {
    getCreatorCertificateData()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (data && canvasRef.current) {
      drawCertificate(canvasRef.current, data, format)
    }
  }, [data, format])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `cnecshop-${format}-${Date.now()}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
    toast.success('이미지가 저장됐어요! 인스타에 올려보세요')
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-2xl py-20 text-center">
        <ImageIcon className="h-12 w-12 mx-auto text-gray-200 mb-4" />
        <p className="text-sm text-gray-400">수익 데이터를 불러올 수 없어요</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">내 성과 공유하기</h1>
        <p className="text-sm text-muted-foreground mt-1">
          인증 이미지를 다운로드해서 인스타에 올려보세요
        </p>
      </div>

      {/* Format selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setFormat('story')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            format === 'story'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          스토리 (9:16)
        </button>
        <button
          onClick={() => setFormat('feed')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            format === 'feed'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          피드 (1:1)
        </button>
      </div>

      {/* Canvas preview */}
      <div className="bg-gray-100 rounded-2xl p-4 flex justify-center">
        <canvas
          ref={canvasRef}
          className="rounded-xl shadow-lg"
          style={{
            width: format === 'story' ? 270 : 320,
            height: format === 'story' ? 480 : 320,
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleDownload} className="flex-1 h-12 gap-2" size="lg">
          <Download className="h-4 w-4" />
          이미지 다운로드
        </Button>
      </div>

      {/* Tip */}
      <div className="bg-violet-50 rounded-xl px-4 py-3 flex items-start gap-3">
        <Instagram className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-violet-900">인스타 공유 팁</p>
          <p className="text-xs text-violet-700 mt-0.5">
            스토리에 올리면 팔로워가 크넥샵을 알게 되고,
            자연스럽게 내 샵 방문이 늘어나요!
          </p>
        </div>
      </div>
    </div>
  )
}
