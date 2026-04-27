'use client'

import { Card } from '@/components/ui/card'

export function AudienceInsights({ data }: { data: any }) {
  const femalePercent = data.genderFemale ?? 82
  const malePercent = data.genderMale ?? 18
  const ageData = data.ageDistribution ?? []
  const maxAge = Math.max(...ageData.map((a: any) => a.value), 1)
  const isEstimated = data.dataSource === '추정치' || data.dataSource === 'Phase 1 추정치'

  // 도넛 SVG
  const total = femalePercent + malePercent
  const femaleAngle = (femalePercent / total) * 360
  const femaleRad = (femaleAngle * Math.PI) / 180
  const largeArc = femaleAngle > 180 ? 1 : 0
  const x = 50 + 40 * Math.sin(femaleRad)
  const y = 50 - 40 * Math.cos(femaleRad)

  return (
    <Card className="p-6 rounded-xl border-stone-200">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-stone-900">팔로워 인사이트</h3>
        <div className="flex items-center gap-2">
          {isEstimated && (
            <span className="inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 border border-amber-200">
              추정치
            </span>
          )}
          <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-3 py-1">
            주 시청자 {data.primaryAudience}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 성별 도넛 */}
        <div>
          <p className="text-sm font-medium text-stone-700 mb-3">성별 분포</p>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
              {/* 남성(회색) 원 전체 */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#d6d3d1" strokeWidth="12" />
              {/* 여성(핑크) 부분 */}
              <path d={`M 50 10 A 40 40 0 ${largeArc} 1 ${x} ${y}`} fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
              <text x="50" y="48" textAnchor="middle" className="text-lg font-bold" fill="#1c1917">{femalePercent}%</text>
              <text x="50" y="62" textAnchor="middle" className="text-[10px]" fill="#78716c">여성</text>
            </svg>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-stone-700">여성 {femalePercent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-stone-300" />
                <span className="text-sm text-stone-700">남성 {malePercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 연령 막대 */}
        <div>
          <p className="text-sm font-medium text-stone-700 mb-3">연령대 분포</p>
          <div className="space-y-3">
            {ageData.map((item: any) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-stone-600 w-14 shrink-0">{item.label}</span>
                <div className="flex-1 h-5 rounded-full bg-stone-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(item.value / maxAge) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-stone-900 tabular-nums w-8 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {isEstimated && (
        <p className="text-[10px] text-stone-400 mt-4 pt-3 border-t border-stone-100">
          K-뷰티 카테고리 평균 기반 추정값이에요. 실제 오디언스 데이터 수집 후 정확한 수치로 업데이트됩니다.
        </p>
      )}
    </Card>
  )
}
