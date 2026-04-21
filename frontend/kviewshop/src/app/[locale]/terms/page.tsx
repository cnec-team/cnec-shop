import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/layout/footer';

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata() {
  return {
    title: '이용약관 | CNEC Shop',
    description: '크넥샵 이용약관을 확인해주세요.',
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
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
          <h1 className="text-3xl font-bold text-gray-900">이용약관</h1>
          <p className="text-sm text-gray-500 mt-3">시행일: 2026년 4월 21일</p>
        </header>

        <div className="space-y-10 text-gray-700">
          <Section title="제1조 (목적)">
            <p>
              이 약관은 주식회사 하우파파(이하 &quot;회사&quot;)가 운영하는 CNEC Shop(크넥샵, 이하 &quot;서비스&quot;)의 이용과 관련하여
              회사와 이용자의 권리, 의무 및 책임사항을 규정하는 것을 목적으로 합니다.
            </p>
          </Section>

          <Section title="제2조 (정의)">
            <ol className="list-decimal list-inside space-y-2">
              <li>&quot;서비스&quot;란 회사가 크리에이터, 브랜드, 구매자를 연결하여 상품 판매 및 구매를 중개하는 온라인 플랫폼을 말합니다.</li>
              <li>&quot;크리에이터&quot;란 서비스에 가입하여 브랜드 상품을 큐레이션하고 판매 링크를 공유하는 이용자를 말합니다.</li>
              <li>&quot;브랜드&quot;란 서비스에 입점하여 상품을 판매하는 사업자를 말합니다.</li>
              <li>&quot;구매자&quot;란 서비스를 통해 상품을 구매하는 이용자를 말합니다.</li>
              <li>&quot;공구(GONGGU)&quot;란 크리에이터가 일정 기간 동안 특정 상품을 할인된 가격으로 판매하는 한정 캠페인을 말합니다.</li>
              <li>&quot;제품 체험(시딩)&quot;이란 크리에이터가 브랜드 상품을 직접 사용해 본 후 공구 진행 여부를 결정하는 과정을 말합니다.</li>
            </ol>
          </Section>

          <Section title="제3조 (약관의 효력 및 변경)">
            <ol className="list-decimal list-inside space-y-2">
              <li>이 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지 후 7일이 경과한 시점부터 효력이 발생합니다.</li>
              <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.</li>
            </ol>
          </Section>

          <Section title="제4조 (회원가입)">
            <ol className="list-decimal list-inside space-y-2">
              <li>이용자는 회사가 정한 양식에 따라 회원정보를 기입하고 휴대폰 본인인증 절차를 거쳐 회원가입을 신청합니다.</li>
              <li>만 14세 미만은 회원가입이 제한됩니다.</li>
              <li>회사는 다음의 경우 가입을 거절하거나 사후 해지할 수 있습니다.
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>타인의 명의를 도용한 경우</li>
                  <li>허위 정보를 기재한 경우</li>
                  <li>본 약관을 위반한 이력이 있는 경우</li>
                </ul>
              </li>
            </ol>
          </Section>

          <Section title="제5조 (서비스 이용)">
            <ol className="list-decimal list-inside space-y-2">
              <li>서비스는 연중무휴 24시간 제공을 원칙으로 합니다.</li>
              <li>단, 시스템 점검, 교체, 고장, 통신두절 등 부득이한 경우 서비스 제공이 일시 중단될 수 있습니다.</li>
              <li>회사는 서비스 일부 또는 전부를 사전 공지 후 변경하거나 중단할 수 있습니다.</li>
            </ol>
          </Section>

          <Section title="제6조 (결제 및 환불)">
            <ol className="list-decimal list-inside space-y-2">
              <li>구매자는 서비스가 지정한 결제수단(신용카드, 계좌이체, 간편결제 등)으로 상품 대금을 결제합니다.</li>
              <li>결제는 포트원(PortOne) 결제 대행 서비스를 통해 처리됩니다.</li>
              <li>환불, 교환, 반품에 관한 세부사항은 별도의 <Link href={`/${locale}/refund-policy`} className="text-blue-600 hover:underline">환불·교환 정책</Link>을 따릅니다.</li>
              <li>상품의 배송, 교환, 환불은 해당 상품을 판매하는 브랜드가 담당하며, 회사는 이를 중개하고 관리합니다.</li>
            </ol>
          </Section>

          <Section title="제7조 (크리에이터의 권리와 의무)">
            <ol className="list-decimal list-inside space-y-2">
              <li>크리에이터는 본인이 선택한 상품만 자신의 샵에 추가할 수 있습니다.</li>
              <li>크리에이터는 허위·과장 광고를 해서는 안 됩니다.</li>
              <li>크리에이터는 판매 성과에 따라 브랜드가 설정한 커미션을 지급받습니다.</li>
              <li>정산은 매월 1회(익월 20일) 진행되며, 세부 내역은 크리에이터 센터에서 확인할 수 있습니다.</li>
              <li>크리에이터는 브랜드에 제품 체험(시딩)을 신청할 수 있으며, 체험 후 공구 진행 여부는 자율적으로 결정합니다.</li>
            </ol>
          </Section>

          <Section title="제8조 (브랜드의 권리와 의무)">
            <ol className="list-decimal list-inside space-y-2">
              <li>브랜드는 정확한 상품 정보(가격, 이미지, 설명, 배송 정보)를 등록해야 합니다.</li>
              <li>브랜드는 주문 접수 후 정해진 기간 내 배송을 완료해야 합니다.</li>
              <li>브랜드는 구매자의 교환·환불 요청을 성실히 처리해야 합니다.</li>
              <li>브랜드는 크리에이터 커미션을 정해진 요율에 따라 회사에 지급합니다.</li>
            </ol>
          </Section>

          <Section title="제9조 (이용자의 의무)">
            <p className="mb-3">이용자는 다음 행위를 해서는 안 됩니다.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>타인의 정보를 도용하는 행위</li>
              <li>서비스를 이용한 영리 활동 (회사가 허용한 경우 제외)</li>
              <li>서비스의 안정적 운영을 방해하는 행위</li>
              <li>음란, 폭력, 기타 공서양속에 반하는 정보를 게시하는 행위</li>
            </ul>
          </Section>

          <Section title="제10조 (지적재산권)">
            <ol className="list-decimal list-inside space-y-2">
              <li>서비스에 관한 저작권 및 지적재산권은 회사에 귀속됩니다.</li>
              <li>이용자는 서비스를 통해 얻은 정보를 회사의 승낙 없이 복제, 배포, 영리 목적으로 이용할 수 없습니다.</li>
              <li>크리에이터 및 브랜드가 업로드한 콘텐츠의 저작권은 작성자에게 귀속됩니다. 단, 회사는 서비스 운영 범위 내에서 이용할 수 있습니다.</li>
            </ol>
          </Section>

          <Section title="제11조 (개인정보 보호)">
            <p>
              회사는 이용자의 개인정보를 보호하기 위해 노력하며, 개인정보의 처리 및 보호에 관한 세부사항은{' '}
              <Link href={`/${locale}/privacy`} className="text-blue-600 hover:underline">개인정보처리방침</Link>에서
              확인할 수 있습니다.
            </p>
          </Section>

          <Section title="제12조 (면책조항)">
            <ol className="list-decimal list-inside space-y-2">
              <li>회사는 천재지변, 전쟁, 테러 등 불가항력으로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
              <li>회사는 브랜드와 구매자 간 직접 거래에서 발생한 분쟁에 대해 중개자로서의 책임만 집니다.</li>
              <li>회사는 크리에이터가 게시한 콘텐츠의 신뢰성에 대해 보장하지 않습니다.</li>
            </ol>
          </Section>

          <Section title="제13조 (분쟁 해결)">
            <ol className="list-decimal list-inside space-y-2">
              <li>서비스 이용과 관련한 분쟁은 회사와 이용자 간 성실한 협의로 해결합니다.</li>
              <li>협의가 되지 않을 경우 서울중앙지방법원을 관할 법원으로 합니다.</li>
            </ol>
          </Section>

          <div className="border-t border-gray-200 pt-8 mt-12">
            <p className="text-sm text-gray-500">
              <strong>부칙</strong><br />
              이 약관은 2026년 4월 21일부터 시행합니다.
            </p>
            <p className="text-sm text-gray-500 mt-2">주식회사 하우파파</p>
          </div>
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
