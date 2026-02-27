import { env } from '../../config/env'

export interface SendSmsParams {
  to: string
  text: string
}

async function sendViaTwilio({ to, text }: SendSmsParams): Promise<void> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.')
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`
  const body = new URLSearchParams({
    To: to,
    From: env.TWILIO_PHONE_NUMBER,
    Body: text,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(`Twilio error: ${err.message ?? res.statusText}`)
  }
}

async function sendViaSmsc({ to, text }: SendSmsParams): Promise<void> {
  if (!env.SMSC_LOGIN || !env.SMSC_PASSWORD) {
    throw new Error('SMSC is not configured. Set SMSC_LOGIN and SMSC_PASSWORD.')
  }

  const params = new URLSearchParams({
    login: env.SMSC_LOGIN,
    psw: env.SMSC_PASSWORD,
    phones: to,
    mes: text,
    fmt: '3', // JSON response
    charset: 'utf-8',
  })

  if (env.SMSC_SENDER) {
    params.set('sender', env.SMSC_SENDER)
  }

  const res = await fetch(`https://smsc.ru/sys/send.php?${params.toString()}`)

  if (!res.ok) {
    throw new Error(`SMSC HTTP error: ${res.statusText}`)
  }

  const data = await res.json() as { error?: string; error_code?: number }
  if (data.error) {
    throw new Error(`SMSC error: ${data.error}`)
  }
}

export const smsService = {
  async send(params: SendSmsParams): Promise<void> {
    if (!env.SMS_ENABLED) {
      throw new Error('SMS is disabled (SMS_ENABLED=false)')
    }

    if (env.SMS_PROVIDER === 'smsc') {
      return sendViaSmsc(params)
    }

    return sendViaTwilio(params)
  },
}
