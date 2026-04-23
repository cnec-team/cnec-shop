'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface RowData {
  feature: string
  trial: string
  standard: string
  pro: string
}

interface SectionData {
  title: string
  rows: RowData[]
}

const sections: SectionData[] = [
  {
    title: '공구 캠페인',
    rows: [
      { feature: '캠페인 개설', trial: '1개', standard: '3개/월', pro: '무제한' },
      { feature: '성과 리포트', trial: '—', standard: '엑셀', pro: '엑셀' },
      { feature: '참여자 엑셀', trial: '—', standard: '—', pro: '포함' },
    ],
  },
  {
    title: '메시지 발송',
    rows: [
      { feature: '무료 발송', trial: '10건', standard: '100건/월', pro: '500건/월' },
      { feature: '초과 단가', trial: '—', standard: '₩700/건', pro: '₩700/건' },
      { feature: '인앱 + 이메일 + 알림톡', trial: '포함', standard: '포함', pro: '포함' },
    ],
  },
  {
    title: '크리에이터 검색',
    rows: [
      { feature: '일일 열람', trial: '30명', standard: '100명', pro: '무제한' },
      { feature: '기본 필터', trial: '포함', standard: '포함', pro: '포함' },
      { feature: '키워드 포함/제외', trial: '포함', standard: '포함', pro: '포함' },
    ],
  },
  {
    title: '상세 조회',
    rows: [
      { feature: '무료 횟수', trial: '30회', standard: '100회/월', pro: '무제한' },
      { feature: '초과 단가', trial: '—', standard: '₩100/회', pro: '—' },
    ],
  },
  {
    title: '데이터 내려받기',
    rows: [
      { feature: '결제/사용 내역 엑셀', trial: '포함', standard: '포함', pro: '포함' },
      { feature: '캠페인 참여자 엑셀', trial: '—', standard: '—', pro: '포함' },
      { feature: '크리에이터 DB 엑셀', trial: '—', standard: '—', pro: '—' },
    ],
  },
  {
    title: 'AI & 자동화',
    rows: [
      { feature: '피부 타입 매칭 AI', trial: '—', standard: '—', pro: '포함' },
      { feature: '인스타 DM 자동 발송', trial: '—', standard: '—', pro: '포함' },
    ],
  },
  {
    title: '크넥샵 커머스',
    rows: [
      { feature: '공구 수수료', trial: '—', standard: '10%', pro: '8%' },
    ],
  },
]

function CellValue({ value }: { value: string }) {
  if (value === '—') {
    return <span className="text-muted-foreground">—</span>
  }
  if (value === '포함' || value === '엑셀') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Check className="h-4 w-4 text-primary" aria-label="포함" />
        {value !== '포함' && <span className="text-sm">{value}</span>}
      </span>
    )
  }
  return <span className="text-sm font-medium">{value}</span>
}

function DesktopTable() {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="sticky top-0 bg-white z-10 border-b">
            <th scope="col" className="text-left py-4 px-4 font-medium text-muted-foreground w-[40%]">
              기능
            </th>
            <th scope="col" className="text-center py-4 px-4 font-medium w-[20%]">체험</th>
            <th scope="col" className="text-center py-4 px-4 font-medium text-primary w-[20%]">
              스탠다드
            </th>
            <th scope="col" className="text-center py-4 px-4 font-medium w-[20%]">프로</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <SectionBlock key={section.title} section={section} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionBlock({ section }: { section: SectionData }) {
  return (
    <>
      <tr className="bg-muted/40">
        <td colSpan={4} className="py-3 px-4 font-semibold text-sm">
          {section.title}
        </td>
      </tr>
      {section.rows.map((row) => (
        <tr key={row.feature} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
          <td className="py-3.5 px-4 text-sm">{row.feature}</td>
          <td className="py-3.5 px-4 text-center"><CellValue value={row.trial} /></td>
          <td className="py-3.5 px-4 text-center"><CellValue value={row.standard} /></td>
          <td className="py-3.5 px-4 text-center"><CellValue value={row.pro} /></td>
        </tr>
      ))}
    </>
  )
}

function MobileAccordion() {
  const plans = [
    { key: 'trial' as const, name: '체험', price: '₩0 /3일' },
    { key: 'standard' as const, name: '스탠다드', price: '₩99,000 /월' },
    { key: 'pro' as const, name: '프로', price: '₩330,000 /월' },
  ]

  return (
    <div className="md:hidden">
      <Accordion type="single" collapsible>
        {plans.map((plan) => (
          <AccordionItem key={plan.key} value={plan.key}>
            <AccordionTrigger className="px-4">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{plan.name}</span>
                <span className="text-sm text-muted-foreground">{plan.price}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {sections.map((section) => (
                  <div key={section.title}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {section.title}
                    </p>
                    <ul className="space-y-2">
                      {section.rows.map((row) => (
                        <li key={row.feature} className="flex items-center justify-between text-sm">
                          <span>{row.feature}</span>
                          <CellValue value={row[plan.key]} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

export function ComparisonTable() {
  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-[32px] font-bold tracking-[-0.02em]">
          전체 기능 비교
        </h2>
        <p className="mt-3 text-muted-foreground">
          플랜별 포함 기능을 한눈에 확인하세요
        </p>
      </div>

      <DesktopTable />
      <MobileAccordion />

      <p className="mt-6 text-xs text-muted-foreground text-center">
        * 크리에이터 리스트 전체 엑셀 다운로드는 크리에이터 보호를 위해 모든 플랜에서 제공하지 않습니다.
      </p>
    </div>
  )
}
