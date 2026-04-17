'use client'

import { Progress } from '@/components/ui/progress'

interface InviteCostSummaryProps {
  totalCount: number
  freeQuota: { used: number; total: number }
  channelBreakdown?: {
    sendable: number
    unreachableNoIg: number
    unreachableBrandIg: number
  }
}

export function InviteCostSummary({
  totalCount,
  freeQuota,
  channelBreakdown,
}: InviteCostSummaryProps) {
  const remaining = Math.max(0, freeQuota.total - freeQuota.used)
  const sendable = channelBreakdown?.sendable ?? totalCount
  const freeCount = Math.min(remaining, sendable)
  const paidCount = Math.max(0, sendable - freeCount)
  const totalCost = paidCount * 500
  const isBulk = totalCount > 1
  const unreachable = (channelBreakdown?.unreachableNoIg ?? 0) + (channelBreakdown?.unreachableBrandIg ?? 0)

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold">비용</h4>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>이번 달 무료 쿼터</span>
          <span>{freeQuota.used}/{freeQuota.total}</span>
        </div>
        <Progress value={freeQuota.total > 0 ? (freeQuota.used / freeQuota.total) * 100 : 0} className="h-2" />
      </div>

      {isBulk && channelBreakdown && (
        <div className="space-y-1 text-xs border-t pt-2">
          <div>선택: {totalCount}명</div>
          <div className="text-green-600">발송 가능: {sendable}명</div>
          {unreachable > 0 && (
            <div className="text-red-500">
              발송 불가: {unreachable}명
              <ul className="ml-4 mt-0.5 space-y-0.5">
                {(channelBreakdown.unreachableNoIg ?? 0) > 0 && (
                  <li>연락 수단 없음: {channelBreakdown.unreachableNoIg}명</li>
                )}
                {(channelBreakdown.unreachableBrandIg ?? 0) > 0 && (
                  <li>브랜드 IG 미연동: {channelBreakdown.unreachableBrandIg}명</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="border-t pt-2 space-y-1 text-xs">
        {freeCount > 0 && (
          <div className="text-green-600">무료 쿼터 사용: {freeCount}건</div>
        )}
        {paidCount > 0 && (
          <div className="text-amber-600">
            유료 발송: {paidCount}건 x 500원 = {(paidCount * 500).toLocaleString('ko-KR')}원
          </div>
        )}
        <div className="font-bold text-sm pt-1 border-t">
          {totalCost === 0 ? (
            <span className="text-green-600">이번 발송: 무료 (쿼터 차감 {freeCount}건)</span>
          ) : (
            <span>총 비용: {totalCost.toLocaleString('ko-KR')}원</span>
          )}
        </div>
      </div>
    </div>
  )
}
