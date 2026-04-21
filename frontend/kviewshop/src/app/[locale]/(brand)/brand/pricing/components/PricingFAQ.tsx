'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    q: '가입하면 바로 쓸 수 있나요?',
    a: '가입 신청 후 영업일 기준 1일 안에 승인 안내를 보내드려요. 승인되면 바로 3일 무료 체험이 시작돼요.',
  },
  {
    q: '신용카드를 미리 등록해야 하나요?',
    a: '아니요. 체험은 카드 없이 바로 시작할 수 있어요. 체험이 끝난 후 본격적으로 사용하실 때 결제 수단을 등록하시면 돼요.',
  },
  {
    q: '크리에이터 이메일이 가려져 있어요. 어떻게 보나요?',
    a: '메시지를 보내시면 크리에이터의 이메일과 인스타로 자동 전달돼요. 크리에이터를 보호하기 위해 직접 노출하지 않고, 크넥이 중간에서 안전하게 전달해드려요.',
  },
  {
    q: '스탠다드에서 프로로 언제 바꾸는 게 좋나요?',
    a: '이런 경우라면 프로가 더 저렴해요. 매달 공동구매를 5번 이상 여는 경우, 매달 메시지를 470건 이상 보내는 경우, 매달 크넥샵 공동구매 매출이 1,650만원을 넘는 경우 (수수료 2% 할인이 프로 비용을 상쇄해줘요).',
  },
  {
    q: '약정 기간이 있나요?',
    a: '체험과 스탠다드는 약정이 없어요. 언제든 그만둘 수 있어요. 프로는 3개월 단위로 결제해요. 1년에 한 번 결제하시면 20% 할인받을 수 있어요.',
  },
  {
    q: '크리에이터에게 메시지를 무제한으로 보낼 수 있나요?',
    a: '크리에이터를 보호하기 위해 같은 브랜드는 같은 크리에이터에게 90일에 한 번만 보낼 수 있어요. 또 크리에이터 한 명이 한 달에 받을 수 있는 제안은 30건으로 제한돼 있어요. 매칭 점수가 높은 크리에이터부터 우선 발송돼요.',
  },
  {
    q: '환불이 가능한가요?',
    a: '프로는 결제 후 7일 안에 사용한 적이 없으면 100% 환불해드려요. 사용을 시작한 후에는 남은 기간만큼 일할 계산해서 돌려드려요.',
  },
  {
    q: '크넥샵 수수료 할인은 어떻게 받나요?',
    a: '프로 플랜으로 이용하시면 크넥샵 공동구매 수수료가 자동으로 10%에서 8%로 할인돼요. 매달 공동구매 매출이 1,650만원 이상이면 할인 금액이 프로 구독료와 같아져서 사실상 도구를 무료로 쓰시는 셈이에요.',
  },
]

export function PricingFAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-8 text-center">자주 묻는 질문</h2>
      <Accordion type="single" collapsible>
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
            <AccordionContent>{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
