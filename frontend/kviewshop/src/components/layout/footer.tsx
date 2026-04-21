import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 브랜드 소개 */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-900">CNEC Shop</h3>
          <p className="text-sm text-gray-500 mt-1">
            크리에이터가 직접 고른 K-뷰티 셀렉트샵
          </p>
        </div>

        {/* 링크 섹션 3단 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">서비스</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="/ko" className="hover:text-gray-900 transition">크리에이터 샵</Link></li>
              <li><Link href="/ko/signup?role=creator" className="hover:text-gray-900 transition">크리에이터 가입</Link></li>
              <li><Link href="/ko/signup?role=brand_admin" className="hover:text-gray-900 transition">브랜드 입점</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">정책</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="/ko/terms" className="hover:text-gray-900 transition">이용약관</Link></li>
              <li><Link href="/ko/privacy" className="hover:text-gray-900 font-semibold transition">개인정보처리방침</Link></li>
              <li><Link href="/ko/refund-policy" className="hover:text-gray-900 transition">환불·교환 정책</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">고객지원</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="/ko/support" className="hover:text-gray-900 transition">1:1 문의</Link></li>
              <li><Link href="/ko/faq" className="hover:text-gray-900 transition">자주 묻는 질문</Link></li>
            </ul>
          </div>
        </div>

        {/* 법정 사업자 정보 */}
        <div className="border-t border-gray-200 pt-8 space-y-2 text-xs text-gray-500 leading-relaxed">
          <p>
            <span className="font-semibold text-gray-700">주식회사 하우파파</span>
            <span className="mx-2">|</span>
            대표자: 박현용
          </p>
          <p>사업자등록번호: 575-81-02253</p>
          <p>통신판매업신고: 제2022-서울마포-3903호</p>
          <p>주소: 서울특별시 중구 퇴계로36길 2, 충무로 영상센터 1009호</p>
          <p>
            고객센터: <a href="tel:01068863302" className="hover:text-gray-900">010-6886-3302</a>
            <span className="mx-2">|</span>
            이메일: <a href="mailto:support@cnecshop.com" className="hover:text-gray-900">support@cnecshop.com</a>
          </p>
          <p>운영시간: 평일 10:00 - 18:00 (점심시간 12:00-13:00 제외, 주말·공휴일 휴무)</p>
          <p className="pt-4 text-gray-400">
            &copy; 2026 HOWPAPA Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
