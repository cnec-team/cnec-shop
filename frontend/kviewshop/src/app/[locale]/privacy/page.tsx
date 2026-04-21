import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/layout/footer';

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata() {
  return {
    title: '개인정보처리방침 | CNEC Shop',
    description: '크넥샵이 처리하는 개인정보에 관한 사항을 안내해드려요.',
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
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
          <h1 className="text-3xl font-bold text-gray-900">개인정보처리방침</h1>
          <p className="text-sm text-gray-500 mt-3">시행일: 2026년 4월 21일</p>
        </header>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-10">
          <p className="text-sm text-blue-900 leading-relaxed">
            주식회사 하우파파(이하 &quot;회사&quot;)는 이용자의 개인정보를 소중하게 생각하며,
            「개인정보 보호법」 등 관련 법령을 준수하고 있어요.
            이 방침은 회사가 처리하는 개인정보의 항목, 목적, 보관 기간 등을 안내해드려요.
          </p>
        </div>

        <div className="space-y-10 text-gray-700">
          <Section title="1. 개인정보의 처리 목적">
            <p className="mb-3">회사는 다음의 목적을 위해 개인정보를 처리해요.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>회원가입 및 본인 확인 (휴대폰 본인인증, 중복 가입 방지)</li>
              <li>서비스 제공 (상품 주문, 배송, 결제, 정산)</li>
              <li>크리에이터 서비스 (셀렉트샵 운영, 커미션 정산, 제품 체험 신청 처리)</li>
              <li>브랜드 서비스 (상품 등록/관리, 캠페인 운영, 주문/정산)</li>
              <li>마케팅 활용 (이벤트, 프로모션 안내 — 별도 동의 시)</li>
              <li>법령 준수 (전자상거래법, 소비자보호법상 의무 이행)</li>
            </ul>
          </Section>

          <Section title="2. 수집하는 개인정보 항목">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 font-semibold">구분</th>
                    <th className="text-left p-3 font-semibold">수집 항목</th>
                    <th className="text-left p-3 font-semibold">수집 시점</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="p-3">필수</td><td className="p-3">이메일, 비밀번호, 이름, 휴대폰번호</td><td className="p-3">회원가입 시</td></tr>
                  <tr><td className="p-3">필수</td><td className="p-3">본인확인값(CI)</td><td className="p-3">본인인증 시</td></tr>
                  <tr><td className="p-3">필수</td><td className="p-3">배송주소 (수령인명, 주소, 연락처)</td><td className="p-3">주문 시</td></tr>
                  <tr><td className="p-3">필수</td><td className="p-3">결제정보 (카드번호 일부, 결제수단)</td><td className="p-3">결제 시</td></tr>
                  <tr><td className="p-3">선택</td><td className="p-3">SNS 핸들 (인스타그램, 유튜브 등), 프로필 이미지</td><td className="p-3">크리에이터 등록 시</td></tr>
                  <tr><td className="p-3">브랜드</td><td className="p-3">사업자등록번호, 대표자명, 회사명</td><td className="p-3">브랜드 입점 시</td></tr>
                  <tr><td className="p-3">자동수집</td><td className="p-3">IP주소, 쿠키, 기기정보, 접속기록</td><td className="p-3">서비스 이용 시</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="3. 개인정보의 보유 및 이용기간">
            <p className="mb-3">회원 탈퇴 시까지 보관해요. 단, 관련 법령에 따라 일정 기간 동안 보관이 필요한 경우가 있어요.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>계약 또는 청약철회 기록: 5년 (전자상거래법)</li>
              <li>대금결제 및 재화 공급 기록: 5년 (전자상거래법)</li>
              <li>소비자 불만 및 분쟁처리 기록: 3년 (전자상거래법)</li>
              <li>표시/광고에 관한 기록: 6개월 (전자상거래법)</li>
              <li>전자금융 거래에 관한 기록: 5년 (전자금융거래법)</li>
              <li>접속 로그: 3개월 (통신비밀보호법)</li>
            </ul>
          </Section>

          <Section title="4. 개인정보의 제3자 제공">
            <p className="mb-3">회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않아요. 다만 다음의 경우는 예외예요.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>상품 주문 시 해당 브랜드(판매자)에게 배송 정보 제공</li>
              <li>법령의 규정에 따른 경우, 수사 목적으로 적법한 절차에 따라 요구받은 경우</li>
            </ul>
          </Section>

          <Section title="5. 개인정보 처리 위탁">
            <p className="mb-3">회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁하고 있어요.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 font-semibold">수탁업체</th>
                    <th className="text-left p-3 font-semibold">위탁 업무</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="p-3">주식회사 포트원 (PortOne)</td><td className="p-3">결제 처리, 휴대폰 본인인증</td></tr>
                  <tr><td className="p-3">주식회사 다날</td><td className="p-3">휴대폰 본인인증</td></tr>
                  <tr><td className="p-3">Cloudflare, Inc.</td><td className="p-3">이미지 및 파일 저장</td></tr>
                  <tr><td className="p-3">Vercel Inc.</td><td className="p-3">서버 호스팅</td></tr>
                  <tr><td className="p-3">Railway Corp.</td><td className="p-3">데이터베이스 호스팅</td></tr>
                  <tr><td className="p-3">주식회사 링크허브 (팝빌)</td><td className="p-3">카카오 알림톡 발송</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="6. 이용자의 권리와 행사 방법">
            <p className="mb-3">이용자는 언제든지 다음의 권리를 행사할 수 있어요.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>개인정보 열람, 정정, 삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
              <li>회원 탈퇴 (서비스 내 설정 또는 고객센터 문의)</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              권리 행사: 이메일(support@cnecshop.com) 또는 고객센터(010-6886-3302)
            </p>
          </Section>

          <Section title="7. 개인정보의 파기">
            <p className="mb-3">개인정보 보유기간이 지나거나 처리 목적이 달성되면 지체 없이 파기해요.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>전자 파일: 복구 불가능한 방법으로 영구 삭제</li>
              <li>출력물: 분쇄 또는 소각</li>
            </ul>
          </Section>

          <Section title="8. 개인정보의 안전성 확보 조치">
            <ul className="list-disc list-inside space-y-2">
              <li>기술적 조치: 비밀번호 암호화(bcrypt), HTTPS 통신, 방화벽</li>
              <li>관리적 조치: 접근 권한 최소화, 정기 보안 교육</li>
              <li>물리적 조치: 서버 접근 통제</li>
            </ul>
          </Section>

          <Section title="9. 쿠키 사용">
            <p>
              회사는 서비스 개선을 위해 쿠키를 사용하고 있어요. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있어요.
              다만, 일부 서비스 이용에 제약이 있을 수 있어요.
            </p>
          </Section>

          <Section title="10. 개인정보 보호책임자">
            <div className="bg-gray-50 rounded-2xl p-6 space-y-2 text-sm">
              <p><span className="font-semibold">성명:</span> 박현용</p>
              <p><span className="font-semibold">직책:</span> 대표이사</p>
              <p><span className="font-semibold">연락처:</span> 010-6886-3302</p>
              <p><span className="font-semibold">이메일:</span> support@cnecshop.com</p>
            </div>
          </Section>

          <Section title="11. 만 14세 미만 아동">
            <p>
              회사는 만 14세 미만 아동의 개인정보를 수집하지 않으며, 만 14세 미만의 회원가입을 제한합니다.
            </p>
          </Section>

          <Section title="12. 권익침해 구제방법">
            <p className="mb-3">개인정보 침해로 인한 구제가 필요한 경우 아래 기관에 문의할 수 있어요.</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>개인정보분쟁조정위원회: 1833-6972 (kopico.go.kr)</li>
              <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청 사이버수사과: 1301 (spo.go.kr)</li>
              <li>경찰청 사이버수사국: 182 (ecrm.police.go.kr)</li>
            </ul>
          </Section>

          <Section title="13. 개인정보처리방침의 변경">
            <p>
              이 개인정보처리방침은 2026년 4월 21일부터 시행해요.
              법령 및 방침에 따른 변경 시 변경사항을 최소 7일 전에 공지해드릴게요.
            </p>
          </Section>

          <div className="border-t border-gray-200 pt-8 mt-12">
            <p className="text-sm text-gray-500">주식회사 하우파파</p>
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
