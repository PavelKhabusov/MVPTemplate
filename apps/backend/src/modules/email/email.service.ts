import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../../config/env'
import { getEmailTemplate } from './email.templates'

type EmailLocale = 'en' | 'ru' | 'es' | 'ja'

let transporter: Transporter | null = null

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
    console.log(`Email transport: SMTP (${env.SMTP_HOST})`)
  } else if (env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    console.log(`Email transport: Ethereal (${testAccount.user})`)
    console.log(`View emails at: https://ethereal.email/login`)
  } else {
    console.warn('SMTP not configured in production. Emails will NOT be sent.')
    transporter = nodemailer.createTransport({ jsonTransport: true })
  }

  return transporter
}

export const emailService = {
  async sendVerificationEmail(to: string, token: string, userName: string, locale: EmailLocale = 'en') {
    const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`
    const { subject, html } = getEmailTemplate('verification', locale, { userName, verifyUrl })
    return this.send(to, subject, html)
  },

  async sendPasswordResetEmail(to: string, token: string, userName: string, locale: EmailLocale = 'en') {
    const resetUrl = `${env.APP_URL}/reset-password?token=${token}`
    const { subject, html } = getEmailTemplate('passwordReset', locale, { userName, resetUrl })
    return this.send(to, subject, html)
  },

  async sendWelcomeEmail(to: string, userName: string, locale: EmailLocale = 'en') {
    const appUrl = env.APP_URL
    const { subject, html } = getEmailTemplate('welcome', locale, { userName, appUrl })
    return this.send(to, subject, html)
  },

  async send(to: string, subject: string, html: string) {
    const transport = await getTransporter()
    const info = await transport.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    })

    if (env.NODE_ENV !== 'production' && !env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) {
        console.log(`Email preview: ${previewUrl}`)
      }
    }

    return info
  },
}
