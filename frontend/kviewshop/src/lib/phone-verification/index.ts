import type { PhoneVerificationProvider } from './types'
import { PopbillProvider } from './popbill-provider'

export type { PhoneVerificationProvider } from './types'

const PROVIDER = process.env.PHONE_VERIFICATION_PROVIDER ?? 'popbill'

let instance: PhoneVerificationProvider | null = null

export function getPhoneVerificationProvider(): PhoneVerificationProvider {
  if (instance) return instance

  switch (PROVIDER) {
    case 'popbill':
      instance = new PopbillProvider()
      break
    // case 'danal':
    //   instance = new DanalProvider()
    //   break
    default:
      throw new Error(`Unknown phone verification provider: ${PROVIDER}`)
  }

  return instance
}
