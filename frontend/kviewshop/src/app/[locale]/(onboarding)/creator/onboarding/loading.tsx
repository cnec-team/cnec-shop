import { Loader2 } from 'lucide-react'

export default function OnboardingLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  )
}
