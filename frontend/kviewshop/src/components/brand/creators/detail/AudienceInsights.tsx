'use client'

import { Card } from '@/components/ui/card'

export function AudienceInsights({ data }: { data: any }) {
  const femalePercent = data.genderFemale ?? 82
  const malePercent = data.genderMale ?? 18
  const ageData = data.ageDistribution ?? []
  const maxAge = Math.max(...ageData.map((a: any) => a.value), 1)

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
        <span className="text-xs text-stone-500">{data.dataSource}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 도넛 */}
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
            {/* 남성(회색) 원 전체 */}
            <circle cx="50" cy="50" r="40" fill="none" stroke="#d6d3d1" strokeWidth="12" />
            {/* 여성(핑크) 부분 */}
            <path d={`M 50 10 A 40 40 0 ${largeArc} 1 ${x} ${y}`} fill="none" stroke="#ec4899" strokeWidth="12" strokeLinecap="round" />
            <text x="50" y="48" textAnchor="middle" className="text-lg font-bold" fill="#1c1917">{femalePercent}%</text>
            <text x="50" y="62" textAnchor="middle" className="text-[10px]" fill="#78716c">여성</text>
          </svg>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-sm text-stone-700">여성 {femalePercent}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-stone-300" />
              <span className="text-sm text-stone-700">남성 {malePercent}%</span>
            </div>
          </div>
        </div>

        {/* 연령 막대 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-stone-700 mb-2">연령대 분포</p>
          {ageData.map((item: any) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-stone-600 w-14 shrink-0">{item.label}</span>
              <div className="flex-1 h-5 rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(item.value / maxAge) * 100}%` }} />
              </div>
              <span className="text-xs font-semibold text-stone-900 tabular-nums w-8 text-right">{item.value}%</span>
            </div>
          ))}
          <p className="text-xs text-stone-500 mt-2">주 시청자: {data.primaryAudience}</p>
        </div>
      </div>
    </Card>
  )
}
