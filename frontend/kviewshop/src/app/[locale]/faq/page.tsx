'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/layout/footer';

const faqs = [
  {
    category: '주문·결제',
    items: [
      { q: '비회원으로도 주문할 수 있나요?', a: '네, 이메일과 휴대폰 번호만으로 비회원 주문이 가능해요. 주문 조회는 주문번호와 휴대폰 번호로 하실 수 있어요.' },
      { q: '어떤 결제수단을 사용할 수 있나요?', a: '신용카드, 카카오페이, 네이버페이, 토스페이를 지원해요.' },
      { q: '주문 취소는 어떻�� 하나요?', a: '상품 발송 전까지는 주문내역에서 직접 취소할 수 있어요. 발송 이후에는 환불 절차를 따라주세요.' },
    ],
  },
  {
    category: '배송',
    items: [
      { q: '배송은 얼마나 걸리나요?', a: '결제 완료 후 보통 2~3영업일 이내에 받아보실 수 있어요. 상품별 예상 배송일은 상품 상세 페이지에서 확인해주세요.' },
      { q: '배송 추적은 어디서 하나요?', a: '주문내역 > 해당 주문 상세에서 운송장 번호와 택배사 링크를 확인하실 수 있어요.' },
    ],
  },
  {
    category: '환불·교환',
    items: [
      { q: '환불은 얼마나 걸리나요?', a: '상품 회수 후 브랜드 확인을 거쳐 3영업일 이내 환불돼요. 결제수단에 따라 카드 취소까지 3~5일 추가 소요될 수 있어요.' },
      { q: '단순 변심도 환불 가능한가요?', a: '상품 수령일로부터 7일 이내에 미사용 상태라면 환불 가능해요. 왕복 배송비는 구매자 부담이에요.' },
    ],
  },
  {
    category: '크리에이터',
    items: [
      { q: '크리에이터 가입은 누구나 할 수 있나요?', a: '네, 누구나 가입하실 수 있어요. 인스타그램, 틱톡 등 SNS 계정 연동 후 바로 샵을 운영하실 수 있어요.' },
      { q: '수익은 언제 정산되나요?', a: '매월 1일 전월 판매 내역을 집계해서 매월 20일에 입금돼요. 자세한 내역은 크리에이터 센터에서 확인하실 수 있어요.' },
    ],
  },
];

export default function FaqPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ko';
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href={`/${locale}/no-shop-context`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          홈으로
        </Link>

        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">자주 묻는 질문</h1>
          <p className="text-sm text-gray-500 mt-3">궁금한 점을 빠르게 해결해드려요.</p>
        </header>

        <div className="space-y-10">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{section.category}</h2>
              <div className="space-y-2">
                {section.items.map((item, idx) => {
                  const key = `${section.category}-${idx}`;
                  const isOpen = openKey === key;
                  return (
                    <div key={key} className="bg-gray-50 rounded-2xl overflow-hidden transition">
                      <button
                        type="button"
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-100 transition"
                      >
                        <span className="font-semibold text-gray-900">{item.q}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <p className="text-sm text-blue-900">
            원하는 답을 찾지 못하셨나요?{' '}
            <Link href={`/${locale}/support`} className="font-semibold underline">1:1 문의</Link>에 남겨주시면 빠르게 답변드릴게요.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
