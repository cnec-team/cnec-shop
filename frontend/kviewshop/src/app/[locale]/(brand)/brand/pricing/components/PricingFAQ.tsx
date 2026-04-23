'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    q: '3일 체험이 끝나면 자동으로 결제되나요?',
    a: '아니요. 체험 종료 후 30일간 제한 모드로 전환되고, 그 기간 안에 스탠다드 또는 프로를 선택해서 결제하시면 돼요. 30일이 지나도 결제하지 않으면 계정이 비활성화됩니다.',
  },
  {
    q: '언제든 플랜을 변경할 수 있나요?',
    a: '네. 스탠다드에서 프로로 언제든 업그레이드할 수 있고, 프로에서 스탠다드로 다운그레이드도 가능해요. 요금은 일할 계산돼 정산됩니다.',
  },
  {
    q: '환불 정책은 어떻게 되나요?',
    a: '월간 결제는 해지 시 다음 결제일까지 사용 가능해요. 연간 결제는 7일 이내 환불 100%, 이후 잔여 기간 일할 환불됩니다.',
  },
  {
    q: '공구 캠페인 초과 비용은 어떻게 계산되나요?',
    a: '스탠다드는 월 3개 공구 캠페인까지 포함돼 있고, 초과분은 개설 불가합니다. 공구를 더 자주 여시는 브랜드라면 프로 플랜이 유리해요.',
  },
  {
    q: '메시지는 어떤 채널로 발송되나요?',
    a: '인앱 알림, 이메일, 카카오 알림톡 3채널로 동시 발송돼요. 크리에이터가 어느 채널에서든 확인할 수 있어요.',
  },
  {
    q: '크리에이터 리스트를 엑셀로 내려받을 수 있나요?',
    a: '크리에이터 DB 엑셀 다운로드는 모든 플랜에서 제공하지 않아요. 크넥샵은 크리에이터와 브랜드가 플랫폼 안에서 소통하는 구조로 설계됐습니다. 내 캠페인 참여자 리스트는 프로 플랜에서 엑셀로 받으실 수 있어요.',
  },
  {
    q: '크넥샵 공구 매출이 많으면 프로 구독료가 자동 회수되나요?',
    a: '네. 프로 플랜은 공구 수수료 2%p 할인(10% → 8%)을 제공해요. 월 공구 매출 1,650만원 이상이면 구독료(₩330,000)가 자동으로 회수됩니다.',
  },
  {
    q: '세금계산서 발행이 가능한가요?',
    a: '네. 결제 완료 후 영업일 3일 이내에 이메일로 세금계산서를 발행해드려요. 브랜드 사업자 정보는 설정 페이지에서 미리 등록해주세요.',
  },
]

export function PricingFAQ() {
  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-[32px] font-bold tracking-[-0.02em]">
          자주 묻는 질문
        </h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left py-5 text-base font-semibold hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-[1.7] pb-5">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
