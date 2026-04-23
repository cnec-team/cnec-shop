export default function LowestPriceGuaranteePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">크넥샵 최저가 보장 정책</h1>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. 적용 범위</h2>
          <p>
            크넥샵에 등록된 상품 중 브랜드가 &quot;최저가 보장&quot;에 동의한 상품에 적용됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. 약속 내용</h2>
          <p>
            쿠팡, 올리브영, 스마트스토어, 자사몰 등 다른 온라인 채널과
            동일 구성·용량 기준으로 크넥샵 판매가가 가장 낮음을 보장합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. 위반 시 조치</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>크리에이터 또는 크넥 운영팀이 위반 사실 확인 시 브랜드에 시정 요청 (24시간 내)</li>
            <li>미조치 시 해당 상품 크넥샵 노출 중단</li>
            <li>반복 위반 시 브랜드 계정 정지 검토</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. 예외 사항</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>한정 쿠폰, 카드사 할인 등 특정 조건부 할인은 예외 인정</li>
            <li>크넥샵 독점 구성(동일 용량·구성이 타 채널에 없음)은 자동 해당</li>
          </ul>
        </section>

        <p className="text-xs text-gray-400 mt-8">
          최종 업데이트: 2026-04-23
        </p>
      </div>
    </div>
  );
}
