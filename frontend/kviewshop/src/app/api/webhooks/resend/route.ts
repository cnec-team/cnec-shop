import { Webhook } from 'svix'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface ResendWebhookEvent {
  type: string
  data: {
    email_id?: string
    to?: string[]
    created_at?: string
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()

  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const wh = new Webhook(webhookSecret)
  let event: ResendWebhookEvent

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendWebhookEvent
  } catch (err) {
    console.error('[resend-webhook] signature invalid', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const emailId = event.data?.email_id
  const to = event.data?.to?.[0]

  try {
    switch (event.type) {
      case 'email.bounced':
        if (to) {
          await prisma.creator.updateMany({
            where: { brandContactEmail: to },
            data: { hasBrandEmail: false, brandContactEmail: null },
          })
          if (emailId) {
            await prisma.creatorProposal.updateMany({
              where: { emailMessageId: emailId },
              data: { emailStatus: 'FAILED' },
            })
          }
        }
        break

      case 'email.complained':
        console.error('[resend-webhook] complaint from', to)
        if (to) {
          await prisma.creator.updateMany({
            where: { brandContactEmail: to },
            data: { hasBrandEmail: false },
          })
        }
        break

      case 'email.delivered':
        if (emailId) {
          await prisma.creatorProposal.updateMany({
            where: { emailMessageId: emailId },
            data: { emailStatus: 'SENT' },
          })
        }
        break
    }
  } catch (err) {
    console.error('[resend-webhook] DB update error:', err)
  }

  return NextResponse.json({ received: true })
}
