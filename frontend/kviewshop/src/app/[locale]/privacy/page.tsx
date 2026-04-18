import { BackToShopButton } from '@/components/BackToShopButton';

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* 상단 네비게이션 */}
        <BackToShopButton locale={locale} />

        <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-500 mb-10">
          주식회사 하우파파 (이하 &quot;회사&quot;)는 개인정보보호법 및 정보통신망 이용촉진 및 정보보호 등에 관한 법률에 따라 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립하여 공개합니다.
        </p>

        {/* 제1조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제1조 (개인정보의 처리 목적)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-1">
            <li>회원가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 개인식별, 부정이용 방지</li>
            <li>서비스 제공: 상품 주문 및 결제, 배송, 고객상담, 공구/캠페인 운영</li>
            <li>크리에이터 서비스: 크리에이터 셀렉트샵 운영, 커미션 정산, 제품 체험(시딩) 신청 처리</li>
            <li>브랜드 서비스: 상품 등록 및 관리, 캠페인 운영, 주문/정산 관리</li>
            <li>마케팅 및 광고: 신규 서비스 안내, 이벤트 정보 제공 (동의한 경우에 한함)</li>
            <li>서비스 개선: 서비스 이용 통계 분석, 서비스 품질 향상</li>
          </ul>
        </section>

        {/* 제2조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제2조 (처리하는 개인정보 항목)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            회사는 서비스 제공을 위해 다음과 같은 개인정보 항목을 처리합니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">구분</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">항목</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">수집 시점</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr>
                  <td className="border border-gray-200 px-4 py-2 font-medium text-gray-700">필수</td>
                  <td className="border border-gray-200 px-4 py-2">이름, 이메일 주소, 전화번호</td>
                  <td className="border border-gray-200 px-4 py-2">회원가입 시</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2 font-medium text-gray-700">필수</td>
                  <td className="border border-gray-200 px-4 py-2">배송주소 (수령인명, 주소, 연락처)</td>
                  <td className="border border-gray-200 px-4 py-2">주문 시</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2 font-medium text-gray-700">필수</td>
                  <td className="border border-gray-200 px-4 py-2">결제정보 (카드번호 일부, 결제 수단 정보)</td>
                  <td className="border border-gray-200 px-4 py-2">결제 시</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2 font-medium text-gray-700">선택</td>
                  <td className="border border-gray-200 px-4 py-2">SNS 핸들 (인스타그램, 유튜브 등)</td>
                  <td className="border border-gray-200 px-4 py-2">크리에이터 등록 시</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2 font-medium text-gray-700">선택</td>
                  <td className="border border-gray-200 px-4 py-2">프로필 이미지</td>
                  <td className="border border-gray-200 px-4 py-2">프로필 설정 시</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2 font-medium text-gray-700">자동 수집</td>
                  <td className="border border-gray-200 px-4 py-2">접속 IP, 쿠키, 서비스 이용 기록, 접속 로그</td>
                  <td className="border border-gray-200 px-4 py-2">서비스 이용 시</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제3조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제3조 (개인정보의 처리 및 보유 기간)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            회사는 법령에 따른 개인정보 보유 및 이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유 및 이용 기간 내에서 개인정보를 처리 및 보유합니다.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-1">
            <li>회원 탈퇴 시: 즉시 파기 (단, 관계법령에 의해 보존이 필요한 경우 해당 기간 동안 보존)</li>
            <li>계약 또는 청약철회에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li>표시/광고에 관한 기록: 6개월 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li>전자금융 거래에 관한 기록: 5년 (전자금융거래법)</li>
            <li>통신사실확인자료: 12개월 (통신비밀보호법)</li>
          </ul>
        </section>

        {/* 제4조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제4조 (개인정보의 제3자 제공)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            회사는 정보주체의 동의, 법률의 특별한 규정 등에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">제공받는 자</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">목적</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">항목</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">보유 기간</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr>
                  <td className="border border-gray-200 px-4 py-2">포트원 / PG사</td>
                  <td className="border border-gray-200 px-4 py-2">결제 처리</td>
                  <td className="border border-gray-200 px-4 py-2">이름, 이메일, 결제정보</td>
                  <td className="border border-gray-200 px-4 py-2">결제 완료 후 5년</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">택배사</td>
                  <td className="border border-gray-200 px-4 py-2">상품 배송</td>
                  <td className="border border-gray-200 px-4 py-2">수령인명, 배송주소, 연락처</td>
                  <td className="border border-gray-200 px-4 py-2">배송 완료 후 파기</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제5조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제5조 (개인정보 처리 위탁)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">수탁업체</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">위탁 업무</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr>
                  <td className="border border-gray-200 px-4 py-2">Vercel Inc.</td>
                  <td className="border border-gray-200 px-4 py-2">웹 호스팅 및 서비스 인프라 운영</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">Cloudflare Inc.</td>
                  <td className="border border-gray-200 px-4 py-2">CDN 서비스 및 이미지/파일 스토리지</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">Railway Corp.</td>
                  <td className="border border-gray-200 px-4 py-2">데이터베이스 호스팅</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            위탁계약 시 개인정보보호 관련 법규의 준수, 개인정보에 관한 비밀유지, 제3자 제공 금지 및 사고 시의 책임부담 등을 명확히 규정하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
          </p>
        </section>

        {/* 제6조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제6조 (정보주체의 권리, 의무 및 행사 방법)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-1">
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리 정지 요구</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            위 권리 행사는 회사에 대해 서면, 전자우편(contact@cnec.kr) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다. 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.
          </p>
        </section>

        {/* 제7조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제7조 (개인정보의 파기 절차 및 방법)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-1">
            <li>파기 절차: 이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 관련 법령에 따라 일정 기간 저장된 후 혹은 즉시 파기됩니다.</li>
            <li>파기 방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다. 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
          </ul>
        </section>

        {/* 제8조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제8조 (개인정보 보호책임자)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="mb-1"><span className="font-semibold text-gray-700">개인정보 보호책임자</span></p>
            <p>성명: 박현용</p>
            <p>직책: 대표이사</p>
            <p>이메일: contact@cnec.kr</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            정보주체는 회사의 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 불만 처리, 피해 구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드리겠습니다.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하시기 바랍니다.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-1 mt-2">
            <li>개인정보침해신고센터 (privacy.kisa.or.kr / 국번 없이 118)</li>
            <li>개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)</li>
            <li>대검찰청 사이버수사과 (www.spo.go.kr / 국번 없이 1301)</li>
            <li>경찰청 사이버수사국 (ecrm.police.go.kr / 국번 없이 182)</li>
          </ul>
        </section>

        {/* 제9조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제9조 (개인정보처리방침 변경)</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            이 개인정보처리방침은 2026년 4월 10일부터 적용됩니다. 이전의 개인정보처리방침은 아래에서 확인하실 수 있습니다. 개인정보처리방침이 변경되는 경우 변경 사항을 서비스 내 공지사항을 통해 게시하며, 변경된 개인정보처리방침은 게시한 날로부터 7일 후부터 효력이 발생합니다.
          </p>
        </section>

        {/* 제10조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제10조 (쿠키 사용 안내)</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 &quot;쿠키(Cookie)&quot;를 사용합니다.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-1">
            <li>쿠키의 사용 목적: 이용자의 로그인 상태 유지, 장바구니 기능 제공, 서비스 이용 환경 최적화</li>
            <li>쿠키의 설치/운영 및 거부: 웹브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.</li>
            <li>쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.</li>
          </ul>
        </section>

        {/* 제11조 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">제11조 (만 14세 미만 아동의 개인정보 처리)</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            회사는 만 14세 미만 아동의 개인정보를 수집하지 않으며, 만 14세 미만 아동의 회원가입을 제한합니다. 만 14세 미만 아동의 개인정보가 수집된 것이 확인될 경우, 해당 개인정보를 지체 없이 파기하겠습니다.
          </p>
        </section>

        {/* 시행일 */}
        <div className="border-t border-gray-200 pt-6 mt-10">
          <p className="text-sm text-gray-500">
            본 개인정보처리방침은 2026년 4월 10일부터 시행됩니다.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            주식회사 하우파파
          </p>
        </div>
      </div>
    </div>
  );
}
