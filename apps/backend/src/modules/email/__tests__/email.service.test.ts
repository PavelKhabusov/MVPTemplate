import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock nodemailer before importing the service
const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' })
const mockTransporter = { sendMail: mockSendMail }

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => mockTransporter),
    createTestAccount: vi.fn().mockResolvedValue({ user: 'test@ethereal.email', pass: 'pass' }),
    getTestMessageUrl: vi.fn(() => 'https://ethereal.email/message/test'),
  },
}))

vi.mock('../../../config/env', () => ({
  env: {
    SMTP_HOST: 'smtp.test.com',
    SMTP_PORT: 587,
    SMTP_USER: 'user@test.com',
    SMTP_PASS: 'password',
    SMTP_FROM: 'noreply@test.com',
    APP_URL: 'https://app.test.com',
    NODE_ENV: 'test',
  },
}))

vi.mock('../../../common/utils/retry', () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}))

vi.mock('../email.templates', () => ({
  getEmailTemplate: vi.fn((_type: string, _locale: string, _vars: Record<string, string>) => ({
    subject: 'Test Subject',
    html: '<p>Test HTML</p>',
  })),
  buildAnnouncementEmail: vi.fn(() => ({
    subject: 'Announcement Subject',
    html: '<p>Announcement</p>',
  })),
}))

import { emailService } from '../email.service'
import { getEmailTemplate, buildAnnouncementEmail } from '../email.templates'

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset sendMail default
    mockSendMail.mockResolvedValue({ messageId: 'test-id' })
  })

  describe('sendVerificationEmail', () => {
    it('should call getEmailTemplate with verification type and correct vars', async () => {
      await emailService.sendVerificationEmail('user@example.com', 'token123', 'John')

      expect(getEmailTemplate).toHaveBeenCalledWith('verification', 'en', {
        userName: 'John',
        verifyUrl: 'https://app.test.com/verify-email?token=token123',
      })
    })

    it('should call sendMail with correct from, to, subject, and html', async () => {
      await emailService.sendVerificationEmail('user@example.com', 'token123', 'John')

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      })
    })

    it('should pass locale to getEmailTemplate', async () => {
      await emailService.sendVerificationEmail('user@example.com', 'token123', 'John', 'ru')

      expect(getEmailTemplate).toHaveBeenCalledWith('verification', 'ru', expect.any(Object))
    })

    it('should default locale to en', async () => {
      await emailService.sendVerificationEmail('user@example.com', 'token123', 'John')

      expect(getEmailTemplate).toHaveBeenCalledWith('verification', 'en', expect.any(Object))
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should call getEmailTemplate with passwordReset type', async () => {
      await emailService.sendPasswordResetEmail('user@example.com', 'reset-token', 'Jane')

      expect(getEmailTemplate).toHaveBeenCalledWith('passwordReset', 'en', {
        userName: 'Jane',
        resetUrl: 'https://app.test.com/reset-password?token=reset-token',
      })
    })

    it('should send email with correct parameters', async () => {
      await emailService.sendPasswordResetEmail('user@example.com', 'reset-token', 'Jane', 'es')

      expect(getEmailTemplate).toHaveBeenCalledWith('passwordReset', 'es', expect.any(Object))
      expect(mockSendMail).toHaveBeenCalledOnce()
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should call getEmailTemplate with welcome type', async () => {
      await emailService.sendWelcomeEmail('user@example.com', 'Alice')

      expect(getEmailTemplate).toHaveBeenCalledWith('welcome', 'en', {
        userName: 'Alice',
        appUrl: 'https://app.test.com',
      })
    })

    it('should support locale parameter', async () => {
      await emailService.sendWelcomeEmail('user@example.com', 'Alice', 'ja')

      expect(getEmailTemplate).toHaveBeenCalledWith('welcome', 'ja', expect.any(Object))
    })
  })

  describe('broadcastAnnouncement', () => {
    it('should call buildAnnouncementEmail with vars', async () => {
      const vars = { subject: 'News', title: 'Big News', body: 'Details here' }
      const recipients = [{ email: 'a@test.com', name: 'A' }]

      await emailService.broadcastAnnouncement(recipients, vars)

      expect(buildAnnouncementEmail).toHaveBeenCalledWith(vars)
    })

    it('should send to all recipients', async () => {
      const vars = { subject: 'News', title: 'Big News', body: 'Details' }
      const recipients = [
        { email: 'a@test.com', name: 'A' },
        { email: 'b@test.com', name: 'B' },
        { email: 'c@test.com', name: 'C' },
      ]

      const result = await emailService.broadcastAnnouncement(recipients, vars)

      expect(result.total).toBe(3)
      expect(result.sent).toBe(3)
      expect(result.failed).toBe(0)
      expect(mockSendMail).toHaveBeenCalledTimes(3)
    })

    it('should count failures correctly', async () => {
      mockSendMail
        .mockResolvedValueOnce({ messageId: '1' })
        .mockRejectedValueOnce(new Error('SMTP error'))

      const vars = { subject: 'News', title: 'Title', body: 'Body' }
      const recipients = [
        { email: 'ok@test.com', name: 'OK' },
        { email: 'fail@test.com', name: 'Fail' },
      ]

      const result = await emailService.broadcastAnnouncement(recipients, vars)

      expect(result.sent).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.total).toBe(2)
    })
  })

  describe('broadcastWelcome', () => {
    it('should use each recipient locale for template', async () => {
      const recipients = [
        { email: 'a@test.com', name: 'A', locale: 'ru' },
        { email: 'b@test.com', name: 'B', locale: 'ja' },
      ]

      await emailService.broadcastWelcome(recipients)

      expect(getEmailTemplate).toHaveBeenCalledWith('welcome', 'ru', {
        userName: 'A',
        appUrl: 'https://app.test.com',
      })
      expect(getEmailTemplate).toHaveBeenCalledWith('welcome', 'ja', {
        userName: 'B',
        appUrl: 'https://app.test.com',
      })
    })

    it('should default locale to en when not provided', async () => {
      const recipients = [{ email: 'a@test.com', name: 'A' }]

      await emailService.broadcastWelcome(recipients)

      expect(getEmailTemplate).toHaveBeenCalledWith('welcome', 'en', expect.any(Object))
    })

    it('should return correct counts', async () => {
      const recipients = [
        { email: 'a@test.com', name: 'A' },
        { email: 'b@test.com', name: 'B' },
      ]

      const result = await emailService.broadcastWelcome(recipients)

      expect(result).toEqual({ sent: 2, failed: 0, total: 2 })
    })
  })

  describe('send', () => {
    it('should call transporter.sendMail via withRetry', async () => {
      await emailService.send('to@test.com', 'Subject', '<p>Body</p>')

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: 'to@test.com',
        subject: 'Subject',
        html: '<p>Body</p>',
      })
    })

    it('should return sendMail result', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'abc-123' })

      const result = await emailService.send('to@test.com', 'Subject', '<p>Body</p>')

      expect(result).toEqual({ messageId: 'abc-123' })
    })

    it('should propagate sendMail errors', async () => {
      mockSendMail.mockRejectedValue(new Error('Connection refused'))

      await expect(emailService.send('to@test.com', 'Subject', '<p>Body</p>'))
        .rejects.toThrow('Connection refused')
    })
  })

  describe('_broadcast concurrency', () => {
    it('should process in batches of 10', async () => {
      const recipients = Array.from({ length: 25 }, (_, i) => ({
        email: `user${i}@test.com`,
        name: `User ${i}`,
      }))
      const vars = { subject: 'Test', title: 'Test', body: 'Test' }

      await emailService.broadcastAnnouncement(recipients, vars)

      expect(mockSendMail).toHaveBeenCalledTimes(25)
    })

    it('should handle empty recipients list', async () => {
      const vars = { subject: 'Test', title: 'Test', body: 'Test' }

      const result = await emailService.broadcastAnnouncement([], vars)

      expect(result).toEqual({ sent: 0, failed: 0, total: 0 })
      expect(mockSendMail).not.toHaveBeenCalled()
    })
  })
})
