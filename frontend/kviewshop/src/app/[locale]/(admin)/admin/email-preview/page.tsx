import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Moon, Lightbulb } from 'lucide-react'
import { TEMPLATE_META } from './preview-data'

const CATEGORIES = ['회원', '주문배송', '캠페인판매', '운영CS'] as const

const RECIPIENT_COLORS: Record<string, string> = {
  '크리에이터': 'bg-violet-100 text-violet-700',
  '브랜드': 'bg-blue-100 text-blue-700',
  '구매자': 'bg-emerald-100 text-emerald-700',
}

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  info: 'bg-sky-100 text-sky-700',
  warning: 'bg-amber-100 text-amber-700',
  neutral: 'bg-stone-100 text-stone-600',
}

export default async function EmailPreviewPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/')
  }

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    templates: TEMPLATE_META.filter((t) => t.category === cat),
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-stone-100 p-2">
          <Mail className="h-5 w-5 text-stone-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            이메일 템플릿 미리보기
          </h1>
          <p className="text-sm text-stone-500">
            전체 {TEMPLATE_META.length}개 템플릿
          </p>
        </div>
      </div>

      {grouped.map(({ category, templates }) => (
        <section key={category}>
          <h2 className="mb-3 text-sm font-semibold text-stone-500 uppercase tracking-wider">
            {category} ({templates.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tmpl) => (
              <Link
                key={tmpl.key}
                href={`/ko/admin/email-preview/${tmpl.key}`}
                className="block"
              >
                <Card className="h-full transition-shadow hover:shadow-md hover:border-stone-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-stone-900">
                      {tmpl.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <code className="block text-xs text-stone-400 font-mono truncate">
                      {tmpl.key}
                    </code>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RECIPIENT_COLORS[tmpl.recipient] ?? 'bg-stone-100 text-stone-600'}`}
                      >
                        {tmpl.recipient}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[tmpl.statusBadgeVariant] ?? 'bg-stone-100 text-stone-600'}`}
                      >
                        {tmpl.statusBadgeVariant}
                      </span>
                      {tmpl.hasDarkHero && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-stone-800 px-2 py-0.5 text-xs font-medium text-stone-100">
                          <Moon className="h-3 w-3" />
                          다크히어로
                        </span>
                      )}
                      {tmpl.hasTip && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          <Lightbulb className="h-3 w-3" />
                          팁
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
