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
    title: '크넥샵 커머스',
    rows: [
      { feature: '공구 수수료', trial: '10%', standard: '10%', pro: '8%' },
    ],
  },
]

function CellValue({ value }: { value: string }) {
  if (value === '—') {
    return <span className="text-slate-300">—</span>
  }
  if (value === '포함') {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className="h-5 w-5 text-primary" aria-label="포함" />
      </span>
    )
  }
  if (value === '엑셀') {
    return (
      <span className="inline-flex items-center gap-1.5 justify-center">
        <Check className="h-5 w-5 text-primary" aria-label="포함" />
        <span className="text-sm text-slate-700">엑셀</span>
      </span>
    )
  }
  if (value === '무제한') {
    return <span className="text-sm font-semibold text-slate-900">무제한</span>
  }
  if (value.includes('₩')) {
    return <span className="text-sm font-medium text-slate-700 tabular-nums">{value}</span>
  }
  return <span className="text-sm font-medium text-slate-700 tabular-nums">{value}</span>
}

function DesktopTable() {
  return (
    <div className="hidden md:block">
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white z-10 border-b-2 border-slate-200">
            <tr>
              <th scope="col" className="text-left text-sm font-semibold text-slate-500 px-6 py-4 w-2/5">
                기능
              </th>
              <th scope="col" className="text-center text-sm font-semibold text-slate-700 px-6 py-4 w-1/5">
                체험
              </th>
              <th scope="col" className="text-center text-sm font-semibold text-primary px-6 py-4 w-1/5">
                스탠다드
              </th>
              <th scope="col" className="text-center text-sm font-semibold text-slate-700 px-6 py-4 w-1/5">
                프로
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <SectionBlock key={section.title} section={section} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SectionBlock({ section }: { section: SectionData }) {
  return (
    <>
      <tr className="bg-slate-50 border-y border-slate-200">
        <td colSpan={4} className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <span className="text-sm font-bold text-slate-900">{section.title}</span>
          </div>
        </td>
      </tr>
      {section.rows.map((row) => (
        <tr key={row.feature} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
          <td className="px-6 py-4 text-sm text-slate-700 align-middle">{row.feature}</td>
          <td className="px-6 py-4 text-center align-middle"><CellValue value={row.trial} /></td>
          <td className="px-6 py-4 text-center align-middle"><CellValue value={row.standard} /></td>
          <td className="px-6 py-4 text-center align-middle"><CellValue value={row.pro} /></td>
        </tr>
      ))}
    </>
  )
}

function MobileAccordion() {
  const plans = [
    { key: 'trial' as const, name: '체험', price: '₩0 / 3일' },
    { key: 'standard' as const, name: '스탠다드', price: '월 ₩99,000' },
    { key: 'pro' as const, name: '프로', price: '월 ₩330,000' },
  ]

  return (
    <div className="md:hidden space-y-3">
      {plans.map((plan) => (
        <Accordion type="single" collapsible key={plan.key}>
          <AccordionItem value={plan.key} className="rounded-2xl border border-slate-200 bg-white px-4">
            <AccordionTrigger className="hover:no-underline py-5">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="text-base font-bold text-slate-900">{plan.name}</span>
                <span className="text-sm font-medium text-slate-500">{plan.price}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="space-y-5">
                {sections.map((section) => (
                  <div key={section.title}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 bg-primary rounded-full" />
                      <p className="text-xs font-bold text-slate-900 tracking-wide">
                        {section.title}
                      </p>
                    </div>
                    <ul className="space-y-2.5 pl-3">
                      {section.rows.map((row) => (
                        <li key={row.feature} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{row.feature}</span>
                          <CellValue value={row[plan.key]} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  )
}

export function ComparisonTable() {
  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-[32px] font-bold tracking-[-0.02em] text-slate-900">
          전체 기능 비교
        </h2>
        <p className="mt-2 text-base text-slate-500">
          플랜별 포함 기능을 한눈에 확인하세요
        </p>
      </div>

      <DesktopTable />
      <MobileAccordion />
    </div>
  )
}
