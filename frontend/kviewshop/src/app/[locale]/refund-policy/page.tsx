import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/layout/footer';

interface RefundPolicyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata() {
  return {
    title: '환불·교환 정책 | CNEC Shop',
    description: '크넥샵의 환불과 교환 정책을 안내해드려요.',
  };
}

export default async function RefundPolicyPage({ params }: RefundPolicyPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          홈으로
        </Link>

        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">환불·교환 정책</h1>
          <p className="text-sm text-gray-500 mt-3">시행일: 2026년 4월 21일</p>
        </header>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-10">
          <p className="text-sm text-blue-900 leading-relaxed">
            주식회사 하우파파는 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라
            구매자의 권리를 보장하고 있어요. 편하게 쇼핑하실 수 있���록 아래 정책을 안내해드려요.
          </p>
        </div>

        <div className="space-y-10 text-gray-700">
          <Section title="1. 청약철회(환불) 기간">
            <p className="mb-3">아래 기간 내에 청약철회를 하실 수 있어요.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>상품 수령일로부터 <strong>7일 이내</strong></li>
              <li>상품이 표시·광고와 다르거나 계약과 다르게 이행된 경우:
                <br />상품 수령일로부터 <strong>3개월 이내</strong> 또는 그 사실을 안 날로부터 <strong>30일 이내</strong></li>
            </ul>
          </Section>

          <Section title="2. 청약철회가 제한되는 경우">
            <p className="mb-3">
              전자상거래법 제17조 제2항에 따라 다음의 경우에는 청약철회가 제한될 수 있어요.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>구매자의 책임 있는 사유로 상품이 훼손된 경우</li>
              <li>사용 또는 일부 소비로 상품의 가치가 현저히 감소한 경우</li>
              <li>시간 경과로 재판매가 곤란한 경우</li>
              <li>복제 가능한 상품의 포장을 훼손한 경우</li>
              <li>맞춤 제작 상품으로 판매자에게 회복할 수 없는 피해가 예상되는 경우</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              ※ 다만, 판매자가 청약철회 제한 사실을 상품 포장이나 기타 방법으로 고지하지 않은 경우에는 청약철회가 가능해요.
            </p>
          </Section>

          <Section title="3. 환불 절차">
            <ol className="list-decimal list-inside space-y-3">
              <li>서비스 내 <strong>주문내역 → 환불 신청</strong> 또는 판매 브랜드 고객센터에 환불 요청</li>
              <li>상품 회수 (귀책사유에 따라 착불 또는 선불)</li>
              <li>브랜드 도착 후 상품 확인 (3영업일 이내)</li>
              <li>환불 승인 및 대금 환불 (승인일로부터 3영업일 이내)</li>
            </ol>
            <div className="mt-4 bg-gray-50 rounded-2xl p-4">
              <p className="text-sm font-semibold mb-2">결제수단별 ��불 소요 시간</p>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>신용카드: 3~5영업일</li>
                <li>계좌이체/가상계좌: 2~3영업일</li>
                <li>간편결제(카카오페이·네이버페이·토스페이): 결제사 정책에 따라 상이</li>
              </ul>
            </div>
          </Section>

          <Section title="4. 교환">
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>단순 변심:</strong> 상품 수령일로부터 7일 이내, 왕복 배송비 구매자 부담</li>
              <li><strong>상품 불량 / 오배송:</strong> 브랜드 귀책으로 판정 시 왕복 배송비 브랜드 부담</li>
              <li><strong>재고 부족으로 교환 불가 시:</strong> 환불로 대체</li>
            </ol>
          </Section>

          <Section title="5. 배송비 부담 기준">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 font-semibold">사유</th>
                    <th className="text-left p-3 font-semibold">배송비 부담</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="p-3">단순 변심 (환불)</td><td className="p-3">구매자 (왕복)</td></tr>
                  <tr><td className="p-3">단순 변심 (교환)</td><td className="p-3">구매자 (왕복)</td></tr>
                  <tr><td className="p-3">상품 불량</td><td className="p-3">브랜드</td></tr>
                  <tr><td className="p-3">오배송</td><td className="p-3">브랜드</td></tr>
                  <tr><td className="p-3">표시·광고와 다른 상품</td><td className="p-3">브랜드</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="6. 환불 접수 및 문의">
            <p className="mb-3">
              환불, 교환, 반품 문의는 상품을 판매한 브랜드에 직접 연락하시거나 크넥샵 고객센터로 문의해주세요.
            </p>
            <div className="bg-gray-50 rounded-2xl p-6 space-y-2 text-sm">
              <p><span className="font-semibold">고객센터:</span> 010-6886-3302</p>
              <p><span className="font-semibold">이메일:</span> support@cnecshop.com</p>
              <p><span className="font-semibold">운영시간:</span> 평일 10:00 - 18:00 (점심 12:00-13:00 제외)</p>
            </div>
          </Section>

          <Section title="7. 크넥샵의 역할">
            <p>
              크넥샵은 크리에이터, 브랜드, 구매자를 연결하는 플랫폼이에요.
              상품의 배송·교환·환불은 각 상품을 판매하는 브랜드가 직접 처리하고,
              크넥샵은 브랜드와 구매자 간 원활한 거래를 위해 중개·관리하며 분쟁 발생 시 적극 지원해드려요.
            </p>
          </Section>

          <Section title="8. 미성년자 ���매 특칙">
            <p>
              만 19세 미만 구매자가 법정대리인 동의 없이 구매한 경우,
              법���대리인은 이를 취소할 수 있어요.
            </p>
          </Section>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="text-base leading-relaxed">{children}</div>
    </section>
  );
}
