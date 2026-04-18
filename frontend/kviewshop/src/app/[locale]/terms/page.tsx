import { BackToShopButton } from '@/components/BackToShopButton';

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* 상단 네비게이션 */}
        <BackToShopButton locale={locale} />

        <h1 className="text-2xl font-bold text-gray-900 mb-2">이용약관</h1>
        <p className="text-sm text-gray-500 mb-10">
          본 약관은 주식회사 하우파파 (이하 &quot;회사&quot;)가 운영하는 크넥샵(CNEC Shop) 서비스의 이용에 관한 사항을 규정합니다.
        </p>

        {/* 제1조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제1조 (목적)</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            본 약관은 주식회사 하우파파 (이하 &quot;회사&quot;)가 제공하는 크넥샵(CNEC Shop) 플랫폼 서비스 (이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        {/* 제2조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제2조 (정의)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            본 약관에서 사용하는 주요 용어의 정의는 다음과 같습니다.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-2">
            <li>
              <span className="font-semibold text-gray-700">크넥샵(CNEC Shop)</span>: 회사가 운영하는 K-뷰티 크리에이터 커머스 플랫폼으로, 크리에이터가 자신만의 셀렉트샵을 운영하고 브랜드 상품을 큐레이션하여 판매할 수 있는 서비스를 말합니다.
            </li>
            <li>
              <span className="font-semibold text-gray-700">크리에이터</span>: 회사의 서비스를 통해 자신만의 셀렉트샵을 개설하고, 상품을 큐레이션하여 판매하는 개인 또는 법인을 말합니다.
            </li>
            <li>
              <span className="font-semibold text-gray-700">브랜드</span>: 회사의 서비스에 상품을 등록하고, 크리에이터를 통한 판매 및 캠페인(공구, 상시)을 운영하는 사업자를 말합니다.
            </li>
            <li>
              <span className="font-semibold text-gray-700">구매자</span>: 크넥샵 내 크리에이터 셀렉트샵 또는 캠페인을 통해 상품을 구매하는 이용자를 말합니다.
            </li>
            <li>
              <span className="font-semibold text-gray-700">공구(GONGGU)</span>: 크리에이터가 일정 기간 동안 특정 상품을 할인된 가격으로 팔로워에게 판매하는 한정 캠페인을 말합니다.
            </li>
            <li>
              <span className="font-semibold text-gray-700">제품 체험(시딩)</span>: 크리에이터가 브랜드 상품을 직접 사용해 본 후 공구 진행 여부를 결정하는 과정을 말합니다.
            </li>
          </ul>
        </section>

        {/* 제3조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제3조 (서비스 이용)</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-2">
            <li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 단, 시스템 점검 등 회사가 필요한 경우 사전 공지 후 서비스를 일시 중단할 수 있습니다.</li>
            <li>회사는 서비스를 일정 범위로 분할하여 각 범위 별로 이용 가능 시간을 별도로 지정할 수 있습니다.</li>
            <li>이용자는 본 약관 및 회사가 정한 규정을 준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.</li>
            <li>회사는 서비스의 내용, 이용 방법, 이용 시간 등에 대하여 변경이 있는 경우에는 변경 사유, 변경될 서비스의 내용 및 제공 일자 등을 그 적용일 이전 7일부터 서비스 내 공지사항을 통해 게시합니다.</li>
          </ul>
        </section>

        {/* 제4조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제4조 (회원가입 및 탈퇴)</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-2">
            <li>이용자는 회사가 정한 가입 양식에 따라 회원 정보를 기입한 후 본 약관에 동의함으로써 회원가입을 신청합니다.</li>
            <li>회사는 가입 신청자가 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>실명이 아니거나 타인의 정보를 이용한 경우</li>
                <li>등록 내용에 허위, 누락, 오기가 있는 경우</li>
                <li>만 14세 미만인 경우</li>
                <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
              </ul>
            </li>
            <li>회원은 언제든지 회원 탈퇴를 요청할 수 있으며, 회사는 즉시 회원 탈퇴를 처리합니다.</li>
            <li>회원 탈퇴 시 관련 법령 및 개인정보처리방침에 따라 회사가 보유하는 정보는 별도로 처리됩니다.</li>
          </ul>
        </section>

        {/* 제5조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제5조 (크리에이터 서비스)</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-2">
            <li>크리에이터는 회사의 승인을 받아 셀렉트샵을 개설할 수 있습니다.</li>
            <li>크리에이터는 브랜드가 등록한 상품 중 자신의 셀렉트샵에 진열할 상품을 선택(큐레이션)할 수 있습니다.</li>
            <li>크리에이터는 자신의 셀렉트샵을 통해 판매된 상품에 대해 회사가 정한 커미션 비율에 따라 수익을 지급받습니다.</li>
            <li>커미션 정산은 회사가 별도로 정하는 정산 주기 및 방법에 따릅니다.</li>
            <li>크리에이터는 브랜드에 제품 체험(시딩)을 신청할 수 있으며, 브랜드의 승인에 따라 샘플을 제공받을 수 있습니다. 제품 체험 후 공구 진행 여부는 크리에이터가 자율적으로 결정합니다.</li>
            <li>크리에이터는 허위 또는 과장된 정보로 상품을 홍보하여서는 안 됩니다.</li>
          </ul>
        </section>

        {/* 제6조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제6조 (결제 및 환불)</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-2">
            <li>구매자는 회사가 제공하는 결제 수단(신용카드, 계좌이체, 간편결제 등)을 이용하여 상품 대금을 결제할 수 있습니다.</li>
            <li>결제는 포트원(PortOne) 결제 대행 서비스를 통해 처리됩니다.</li>
            <li>구매자는 전자상거래 등에서의 소비자보호에 관한 법률에 따라 상품 수령일로부터 7일 이내에 청약 철회를 할 수 있습니다.</li>
            <li>다음 각 호에 해당하는 경우 청약 철회가 제한될 수 있습니다.
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>구매자에게 책임 있는 사유로 재화 등이 멸실 또는 훼손된 경우</li>
                <li>포장을 개봉하였거나 포장이 훼손되어 상품 가치가 현저히 감소한 경우</li>
                <li>시간이 지나 재판매가 곤란할 정도로 상품 가치가 현저히 감소한 경우</li>
                <li>복제가 가능한 재화의 포장을 훼손한 경우</li>
              </ul>
            </li>
            <li>환불은 결제 수단에 따라 영업일 기준 3~7일 이내에 처리됩니다.</li>
          </ul>
        </section>

        {/* 제7조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제7조 (지적재산권)</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-2">
            <li>서비스에 관한 저작권 및 지적재산권은 회사에 귀속됩니다.</li>
            <li>이용자는 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 등 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</li>
            <li>크리에이터 및 브랜드가 서비스에 업로드한 콘텐츠(상품 이미지, 설명, 리뷰 등)의 저작권은 해당 콘텐츠를 작성한 자에게 귀속됩니다. 단, 회사는 서비스 운영 목적 범위 내에서 해당 콘텐츠를 이용할 수 있습니다.</li>
          </ul>
        </section>

        {/* 제8조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제8조 (면책조항)</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-2">
            <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
            <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
            <li>회사는 크리에이터와 구매자 간, 또는 크리에이터와 브랜드 간에 발생한 분쟁에 대하여 개입할 의무가 없으며, 이로 인한 손해에 대하여 회사는 책임을 지지 않습니다. 단, 회사는 분쟁의 원활한 해결을 위하여 중재를 지원할 수 있습니다.</li>
            <li>회사는 이용자가 서비스와 관련하여 게재한 정보, 자료의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</li>
          </ul>
        </section>

        {/* 제9조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제9조 (분쟁해결)</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-2">
            <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상 처리하기 위하여 고객센터를 운영합니다.</li>
            <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관하여 이용자의 피해구제 신청이 있는 경우에는 공정거래위원회 또는 시/도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.</li>
            <li>본 약관에 관한 분쟁은 대한민국 법을 준거법으로 하며, 회사의 본점 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</li>
          </ul>
        </section>

        {/* 부칙 */}
        <div className="border-t border-gray-200 pt-6 mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">부칙</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            본 약관은 2026년 4월 10일부터 시행됩니다.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            주식회사 하우파파
          </p>
          <p className="text-sm text-gray-500">
            고객센터: contact@cnec.kr | 평일 10:00-18:00 (주말/공휴일 휴무)
          </p>
        </div>
      </div>
    </div>
  );
}
