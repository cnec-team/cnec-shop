'use client'

import { Card } from '@/components/ui/card'

export function QuickInfoCard({ creator }: { creator: any }) {
  const rows = [
    { label: '선호 카테고리', value: creator.igCategory ?? '—' },
    { label: '언어', value: creator.igPrimaryLanguage || creator.igLanguage || '한국어' },
    { label: '최근 업로드', value: creator.igDataImportedAt ? `${Math.floor((Date.now() - new Date(creator.igDataImportedAt).getTime()) / (1000 * 60 * 60 * 24))}일 전` : '—' },
    { label: '주 시청자', value: creator.igAudienceGender && creator.igAudienceAge ? `${creator.igAudienceGender} · ${creator.igAudienceAge}` : '여성 · 18-24세' },
    { label: '팔로잉', value: creator.igFollowing?.toLocaleString() ?? '—' },
    { label: '게시물', value: creator.igPostsCount?.toLocaleString() ?? '—' },
    { label: '크넥 협업', value: creator.cnecCompletedPayments > 0 ? `${creator.cnecCompletedPayments}회 완료` : '신규' },
  ]

  return (
    <Card className="p-5 rounded-xl border-stone-200">
      <h3 className="text-lg font-semibold text-stone-900 mb-4">빠른 정보</h3>
      <dl className="space-y-3">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <dt className="text-stone-500">{row.label}</dt>
            <dd className="font-semibold text-stone-900 tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
