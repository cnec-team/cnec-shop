import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Construction } from 'lucide-react'

export default async function ActivityPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/')
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="rounded-full bg-stone-100 p-4">
        <Construction className="h-8 w-8 text-stone-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-stone-900">
          감사 로그 페이지를 준비 중이에요
        </h2>
        <p className="mt-1 text-sm text-stone-500">곧 만나요</p>
      </div>
    </div>
  )
}
