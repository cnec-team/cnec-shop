'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ComparisonTable() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-16">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 mx-auto text-sm font-medium hover:opacity-70"
      >
        전체 기능 비교 보기
        <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">기능</th>
                <th className="text-center py-3 font-medium">체험</th>
                <th className="text-center py-3 font-medium">스탠다드</th>
                <th className="text-center py-3 font-medium">프로</th>
              </tr>
            </thead>
            <tbody>
              <SectionRow title="공동구매" />
              <Row feature="공동구매 열기" trial="1번" standard="1번에 ₩50,000" pro="무제한" />
              <Row feature="단계별 진행 관리" trial="O" standard="O" pro="O" />
              <Row feature="캠페인 성과 리포트" trial="기본" standard="상세" pro="상세" />
              <Row feature="캠페인 참여자 엑셀" trial="-" standard="-" pro="O" />

              <SectionRow title="크리에이터 찾기" />
              <Row feature="하루에 볼 수 있는 인원" trial="30명" standard="100명" pro="무제한" />
              <Row feature="고급 필터" trial="O" standard="O" pro="O" />
              <Row feature="피부 타입 매칭 AI" trial="-" standard="-" pro="O" />

              <SectionRow title="크리에이터 상세정보" />
              <Row feature="상세 페이지 열어보기" trial="30번" standard="매달 100번 무료" pro="무제한" />
              <Row feature="무료 초과 시" trial="-" standard="1번에 ₩100" pro="-" />

              <SectionRow title="메시지" />
              <Row feature="메시지 단가" trial="10건 무료" standard="₩700 / 건" pro="매달 500건 무료" />
              <Row feature="앱 알림 / 이메일 / 알림톡" trial="O" standard="O" pro="O" />
              <Row feature="인스타 DM 자동 발송" trial="-" standard="-" pro="O" />

              <SectionRow title="그룹 관리" />
              <Row feature="그룹 만들기" trial="1개" standard="5개" pro="무제한" />
              <Row feature="그룹별 저장 인원" trial="100명" standard="500명" pro="5,000명" />

              <SectionRow title="계정" />
              <Row feature="팀원 수" trial="1명" standard="2명" pro="5명" />

              <SectionRow title="크넥샵 공동구매" />
              <Row feature="입점" trial="O" standard="O" pro="O" />
              <Row feature="수수료" trial="10%" standard="10%" pro="8%" />
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SectionRow({ title }: { title: string }) {
  return (
    <tr className="bg-muted/30">
      <td colSpan={4} className="py-3 px-2 font-semibold">{title}</td>
    </tr>
  )
}

function Row({ feature, trial, standard, pro }: { feature: string; trial: string; standard: string; pro: string }) {
  return (
    <tr className="border-b">
      <td className="py-3 px-2">{feature}</td>
      <td className="text-center py-3">{trial}</td>
      <td className="text-center py-3">{standard}</td>
      <td className="text-center py-3">{pro}</td>
    </tr>
  )
}
