const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY ?? ''
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET ?? ''
const SOLAPI_SENDER_PHONE = process.env.SOLAPI_SENDER_PHONE ?? ''
const KAKAO_PFID = process.env.KAKAO_ALIMTALK_PFID ?? ''
const SOLAPI_BASE_URL = 'https://api.solapi.com/messages/v4/send'

// 템플릿 코드 (카카오비즈센터 심사 후 확정)
const TEMPLATE_CODES = {
  GONGGU: 'CNEC_PROPOSAL_001',
  PRODUCT_PICK: 'CNEC_PROPOSAL_002',
} as const

function createHmacSignature(date: string, salt: string): string {
  // Node.js crypto for HMAC-SHA256
  const crypto = require('crypto') as typeof import('crypto')
  return crypto
    .createHmac('sha256', SOLAPI_API_SECRET)
    .update(date + salt)
    .digest('hex')
}

function getAuthHeader(): string {
  const date = new Date().toISOString()
  const salt = Math.random().toString(36).substring(2, 15)
  const signature = createHmacSignature(date, salt)
  return `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`
}

export async function sendProposalAlimtalk(params: {
  to: string
  creatorName: string
  brandName: string
  proposalType: 'GONGGU' | 'PRODUCT_PICK'
  campaignOrProductName: string
  commissionRate?: number
  acceptUrl: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER_PHONE) {
    console.error('[solapi] Solapi 환경변수가 설정되지 않았습니다')
    return { success: false, error: 'Solapi 환경변수 누락' }
  }

  const phone = params.to.replace(/-/g, '')
  if (!phone) {
    return { success: false, error: '수신자 번호 없음' }
  }

  const templateCode = TEMPLATE_CODES[params.proposalType]
  const typeLabel = params.proposalType === 'GONGGU' ? '공구 초대' : '상품 추천 요청'

  try {
    const res = await fetch(SOLAPI_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify({
        message: {
          to: phone,
          from: SOLAPI_SENDER_PHONE,
          kakaoOptions: {
            pfId: KAKAO_PFID,
            templateId: templateCode,
            variables: {
              '#{크리에이터명}': params.creatorName,
              '#{브랜드명}': params.brandName,
              '#{캠페인명}': params.campaignOrProductName,
              '#{상품명}': params.campaignOrProductName,
              '#{커미션율}': String(params.commissionRate ?? 0),
              '#{수락URL}': params.acceptUrl,
            },
            buttons: [
              {
                buttonType: 'WL',
                buttonName: params.proposalType === 'GONGGU' ? '초대 확인하기' : '상품 확인하기',
                linkMo: params.acceptUrl,
                linkPc: params.acceptUrl,
              },
            ],
          },
        },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[solapi] 알림톡 발송 실패:', res.status, errBody)
      return { success: false, error: `${res.status}: ${errBody}` }
    }

    const data = await res.json()
    const msgId = data?.groupInfo?.groupId || data?.messageId
    return { success: true, messageId: msgId }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[solapi] 알림톡 발송 중 에러:', message)
    return { success: false, error: message }
  }
}
