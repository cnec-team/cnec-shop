export { sendKakaoAlimtalk } from './kakao'
export { sendEmail } from './email'
export {
  KAKAO_TEMPLATES,
  orderCompleteMessage,
  shippingStartMessage,
  deliveryCompleteMessage,
  newOrderBrandMessage,
  invoiceReminderMessage,
  saleOccurredMessage,
  campaignApprovedMessage,
  campaignStartedMessage,
  trialApprovedMessage,
  trialShippedMessage,
  trialRequestedMessage,
  settlementConfirmedMessage,
  proposalGongguInviteMessage,
  proposalProductPickMessage,
  bulkSendReportMessage,
  brandApprovedTemplate,
  brandRejectedTemplate,
  brandStatusChangedTemplate,
  orderCancelledByBrandTemplate,
  orderCancelledByBrandToCreatorTemplate,
  orderCancelledByBuyerTemplate,
  orderCancelledByBuyerToCreatorTemplate,
  exchangeRequestedTemplate,
  refundRequestedTemplate,
  campaignParticipationRejectedTemplate,
  campaignRecruitingStartedTemplate,
  creatorGradeChangedMessage,
  brandCommissionChangedMessage,
} from './templates'
export { normalizePhone, isValidEmail } from './utils'

import { prisma } from '@/lib/db'
import { sendKakaoAlimtalk } from './kakao'
import { sendEmail } from './email'
import { getNotificationPreferences } from './preferences'
import { logger } from '@/lib/notifications/logger'

export interface SendNotificationParams {
  userId?: string
  type: string
  title: string
  message: string
  linkUrl?: string
  // 알림톡
  phone?: string
  receiverName?: string
  kakaoTemplate?: { templateCode: string; message: string }
  // 이메일
  email?: string
  emailTemplate?: { subject: string; html: string }
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  logger.debug('알림 발송 시작', { type: params.type, userId: params.userId })
  // 수신 설정 조회 (거래성은 무조건 발송, 마케팅성은 설정 반영)
  const prefs = await getNotificationPreferences(params.userId, params.type)

  // 1. 앱 내 알림 (DB INSERT) — userId 있을 때만 (비회원은 인앱 불가)
  if (params.userId && prefs.inApp) {
    try {
      await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          linkUrl: params.linkUrl ?? null,
          isRead: false,
        },
      })
      logger.info('앱 내 알림 저장 완료', { type: params.type, userId: params.userId })
    } catch (err) {
      logger.error('앱 내 알림 저장 실패', err)
    }
  }

  // 2. 알림톡 발송 — phone만 있으면 발송 (userId 무관)
  if (params.phone && params.kakaoTemplate && prefs.kakao) {
    try {
      await sendKakaoAlimtalk({
        templateCode: params.kakaoTemplate.templateCode,
        receiverNum: params.phone,
        receiverName: params.receiverName ?? '',
        message: params.kakaoTemplate.message,
        altText: params.kakaoTemplate.message,
      })
    } catch (err) {
      logger.error('알림톡 발송 실패', err, { phone: logger.mask(params.phone) })
    }
  }

  // 3. 이메일 발송 — email만 있으면 발송 (userId 무관)
  if (params.email && params.emailTemplate && prefs.email) {
    try {
      await sendEmail({
        to: params.email,
        subject: params.emailTemplate.subject,
        html: params.emailTemplate.html,
      })
    } catch (err) {
      logger.error('이메일 발송 실패', err, { email: logger.mask(params.email) })
    }
  }
}
