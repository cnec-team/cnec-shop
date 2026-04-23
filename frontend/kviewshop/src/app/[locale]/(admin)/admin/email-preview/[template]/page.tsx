import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from './copy-button'
import { TEMPLATE_META, PREVIEW_DATA } from '../preview-data'
import * as templates from '@/lib/notifications/templates'

type TemplateResult = {
  email?: { subject: string; html: string }
  kakao?: unknown
  inApp?: unknown
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const TEMPLATE_FN_MAP: Record<string, (data: any) => TemplateResult> = {
  orderCompleteMessage: templates.orderCompleteMessage,
  shippingStartMessage: templates.shippingStartMessage,
  deliveryCompleteMessage: templates.deliveryCompleteMessage,
  newOrderBrandMessage: templates.newOrderBrandMessage,
  invoiceReminderMessage: templates.invoiceReminderMessage,
  saleOccurredMessage: templates.saleOccurredMessage,
  campaignApprovedMessage: templates.campaignApprovedMessage,
  campaignStartedMessage: templates.campaignStartedMessage,
  trialApprovedMessage: templates.trialApprovedMessage,
  trialShippedMessage: templates.trialShippedMessage,
  trialRequestedMessage: templates.trialRequestedMessage,
  settlementConfirmedMessage: templates.settlementConfirmedMessage,
  proposalGongguInviteMessage: templates.proposalGongguInviteMessage,
  proposalProductPickMessage: templates.proposalProductPickMessage,
  bulkSendReportMessage: templates.bulkSendReportMessage,
  creatorApplicationSubmittedMessage: templates.creatorApplicationSubmittedMessage,
  creatorApprovedMessage: templates.creatorApprovedMessage,
  creatorRejectedMessage: templates.creatorRejectedMessage,
  brandApprovedTemplate: templates.brandApprovedTemplate,
  brandRejectedTemplate: templates.brandRejectedTemplate,
  brandStatusChangedTemplate: templates.brandStatusChangedTemplate,
  orderCancelledByBrandTemplate: templates.orderCancelledByBrandTemplate,
  orderCancelledByBrandToCreatorTemplate: templates.orderCancelledByBrandToCreatorTemplate,
  orderCancelledByBuyerTemplate: templates.orderCancelledByBuyerTemplate,
  orderCancelledByBuyerToCreatorTemplate: templates.orderCancelledByBuyerToCreatorTemplate,
  exchangeRequestedTemplate: templates.exchangeRequestedTemplate,
  refundRequestedTemplate: templates.refundRequestedTemplate,
  campaignParticipationRejectedTemplate: templates.campaignParticipationRejectedTemplate,
  campaignRecruitingStartedTemplate: templates.campaignRecruitingStartedTemplate,
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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

export default async function EmailTemplateDetailPage({
  params,
}: {
  params: Promise<{ template: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/')
  }

  const { template: templateKey } = await params

  const meta = TEMPLATE_META.find((t) => t.key === templateKey)
  const fn = TEMPLATE_FN_MAP[templateKey]
  const data = PREVIEW_DATA[templateKey]

  if (!meta || !fn || !data) {
    notFound()
  }

  const result = fn(data)
  const subject = result.email?.subject ?? ''
  const html = result.email?.html ?? '<p>이메일 HTML이 없습니다.</p>'

  return (
    <div className="space-y-6">
      {/* 상단 네비게이션 */}
      <Link
        href="/ko/admin/email-preview"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로 돌아가기
      </Link>

      {/* 헤더 */}
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-stone-900">{meta.label}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
            {meta.category}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RECIPIENT_COLORS[meta.recipient] ?? 'bg-stone-100 text-stone-600'}`}
          >
            {meta.recipient}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[meta.statusBadgeVariant] ?? 'bg-stone-100 text-stone-600'}`}
          >
            {meta.statusBadgeVariant}
          </span>
          {meta.hasDarkHero && (
            <Badge variant="secondary" className="bg-stone-800 text-stone-100">
              다크히어로
            </Badge>
          )}
          {meta.hasTip && (
            <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
              팁
            </Badge>
          )}
        </div>
        <code className="block text-xs text-stone-400 font-mono">
          {meta.key}
        </code>
      </div>

      {/* 제목 + 복사 */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-stone-500 mb-1">제목 (Subject)</p>
            <p className="text-sm font-medium text-stone-900 break-words">{subject}</p>
          </div>
          <CopyButton text={subject} label="제목 복사" />
        </div>
      </div>

      {/* HTML 복사 버튼 */}
      <div className="flex items-center gap-2">
        <CopyButton text={html} label="HTML 복사" />
      </div>

      {/* 이메일 미리보기 */}
      <div className="rounded-lg border border-stone-200 bg-white p-1">
        <iframe
          srcDoc={html}
          title={`${meta.label} 미리보기`}
          className="mx-auto block w-[620px] max-w-full border-0"
          style={{ height: '800px' }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  )
}
