import { escapeHtml } from './email-utils'
import { getUnsubscribeUrl } from './unsubscribe'

export function getEmailFooter(recipientEmail: string): string {
  const url = getUnsubscribeUrl(recipientEmail)
  return `
    <div style="margin-top:40px;padding:20px;border-top:1px solid #eee;
                font-size:12px;color:#888;line-height:1.6;font-family:sans-serif;">
      <p>본 메일은 크넥샵 서비스 이용자에게 발송되는 안내 메일입니다.</p>
      <p>
        주식회사 하우파파 (HOWPAPA Inc.)<br>
        대표: 박현용<br>
        서울특별시 | 문의: support@cnecshop.com
      </p>
      <p>
        <a href="${escapeHtml(url)}" style="color:#888;text-decoration:underline;">
          수신거부 (Unsubscribe)
        </a>
      </p>
    </div>`
}
