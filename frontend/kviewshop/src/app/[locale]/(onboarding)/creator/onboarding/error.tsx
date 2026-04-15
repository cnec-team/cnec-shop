'use client'

import { AlertCircle } from 'lucide-react'

export default function OnboardingError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="text-sm text-gray-600 text-center">오류가 발생했어요. 다시 시도해주세요.</p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium"
      >
        다시 시도
      </button>
    </div>
  )
}
