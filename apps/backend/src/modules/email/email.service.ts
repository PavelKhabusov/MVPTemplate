import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../../config/env'
import { getEmailTemplate, buildAnnouncementEmail, type AnnouncementVars } from './email.templates'

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

  // Broadcast an announcement to a list of users (batched, max 10 concurrent)
  async broadcastAnnouncement(
    recipients: Array<{ email: string; name: string; locale?: string }>,
    vars: AnnouncementVars,
  ): Promise<{ sent: number; failed: number; total: number }> {
    const { subject, html } = buildAnnouncementEmail(vars)
    return this._broadcast(recipients.map((r) => ({ to: r.email, subject, html })))
  },

  // Re-broadcast the welcome email to all given users (uses their locale)
  async broadcastWelcome(
    recipients: Array<{ email: string; name: string; locale?: string }>,
  ): Promise<{ sent: number; failed: number; total: number }> {
    const jobs = recipients.map((r) => {
      const locale = (r.locale ?? 'en') as 'en' | 'ru' | 'es' | 'ja'
      const { subject, html } = getEmailTemplate('welcome', locale, { userName: r.name, appUrl: env.APP_URL })
      return { to: r.email, subject, html }
    })
    return this._broadcast(jobs)
  },

  async _broadcast(
    jobs: Array<{ to: string; subject: string; html: string }>,
  ): Promise<{ sent: number; failed: number; total: number }> {
    const CONCURRENCY = 10
    let sent = 0
    let failed = 0
    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
      const batch = jobs.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(batch.map((j) => this.send(j.to, j.subject, j.html)))
      results.forEach((r) => { if (r.status === 'fulfilled') sent++; else failed++ })
    }
    return { sent, failed, total: jobs.length }
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
