type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const PREFIX = '[notification]'

function maskSensitive(value: string | undefined | null): string {
  if (!value) return ''
  if (value.includes('@')) {
    const [local, domain] = value.split('@')
    return `${local.slice(0, 2)}***@${domain}`
  }
  return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${PREFIX} [DEBUG] ${msg}`, ctx ?? '')
    }
  },
  info: (msg: string, ctx?: Record<string, any>) => {
    console.log(`${PREFIX} [INFO] ${msg}`, ctx ?? '')
  },
  warn: (msg: string, ctx?: Record<string, any>) => {
    console.warn(`${PREFIX} [WARN] ${msg}`, ctx ?? '')
  },
  error: (msg: string, error?: unknown, ctx?: Record<string, any>) => {
    console.error(`${PREFIX} [ERROR] ${msg}`, {
      error: error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error,
      ...(ctx ?? {}),
    })
  },
  mask: maskSensitive,
}
