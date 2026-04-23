'use client'

export function PricingPageClient({ currentTier }: { currentTier?: string }) {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">요금제 안내</h1>
      <p className="text-gray-500">준비 중입니다.</p>
      {currentTier && (
        <p className="mt-2 text-sm text-gray-400">현재 플랜: {currentTier}</p>
      )}
    </div>
  )
}
