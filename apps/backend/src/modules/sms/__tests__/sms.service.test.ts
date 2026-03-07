import { describe, it, expect, vi, beforeEach } from 'vitest'

// We need to control env per test, so use a mutable object
const mockEnv: Record<string, unknown> = {
  SMS_ENABLED: true,
  SMS_PROVIDER: 'twilio',
  TWILIO_ACCOUNT_SID: 'AC_test_sid',
  TWILIO_AUTH_TOKEN: 'test_auth_token',
  TWILIO_PHONE_NUMBER: '+15551234567',
  SMSC_LOGIN: 'smsc_login',
  SMSC_PASSWORD: 'smsc_pass',
  SMSC_SENDER: 'TestApp',
}

vi.mock('../../../config/env', () => ({
  env: new Proxy({} as Record<string, unknown>, {
    get(_target, prop: string) {
      return mockEnv[prop]
    },
  }),
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { smsService } from '../sms.service'

describe('smsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset env to defaults
    Object.assign(mockEnv, {
      SMS_ENABLED: true,
      SMS_PROVIDER: 'twilio',
      TWILIO_ACCOUNT_SID: 'AC_test_sid',
      TWILIO_AUTH_TOKEN: 'test_auth_token',
      TWILIO_PHONE_NUMBER: '+15551234567',
      SMSC_LOGIN: 'smsc_login',
      SMSC_PASSWORD: 'smsc_pass',
      SMSC_SENDER: 'TestApp',
    })
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
  })

  describe('send (general)', () => {
    it('should throw when SMS_ENABLED is false', async () => {
      mockEnv.SMS_ENABLED = false

      await expect(smsService.send({ to: '+79001234567', text: 'Hello' }))
        .rejects.toThrow('SMS is disabled (SMS_ENABLED=false)')
    })

    it('should use Twilio provider by default', async () => {
      mockEnv.SMS_PROVIDER = 'twilio'

      await smsService.send({ to: '+79001234567', text: 'Code: 123456' })

      expect(mockFetch).toHaveBeenCalledOnce()
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('api.twilio.com')
      expect(url).toContain('AC_test_sid')
    })

    it('should use SMSC provider when configured', async () => {
      mockEnv.SMS_PROVIDER = 'smsc'

      await smsService.send({ to: '+79001234567', text: 'Code: 123456' })

      expect(mockFetch).toHaveBeenCalledOnce()
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('smsc.ru')
    })
  })

  describe('Twilio provider', () => {
    beforeEach(() => {
      mockEnv.SMS_PROVIDER = 'twilio'
    })

    it('should send POST request with correct URL', async () => {
      await smsService.send({ to: '+79001234567', text: 'Hello' })

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.twilio.com/2010-04-01/Accounts/AC_test_sid/Messages.json')
      expect(options.method).toBe('POST')
    })

    it('should include Basic auth header', async () => {
      await smsService.send({ to: '+79001234567', text: 'Hello' })

      const [, options] = mockFetch.mock.calls[0]
      const expectedAuth = Buffer.from('AC_test_sid:test_auth_token').toString('base64')
      expect(options.headers['Authorization']).toBe(`Basic ${expectedAuth}`)
    })

    it('should send correct body parameters', async () => {
      await smsService.send({ to: '+79001234567', text: 'Your code: 1234' })

      const [, options] = mockFetch.mock.calls[0]
      const body = new URLSearchParams(options.body)
      expect(body.get('To')).toBe('+79001234567')
      expect(body.get('From')).toBe('+15551234567')
      expect(body.get('Body')).toBe('Your code: 1234')
    })

    it('should use Content-Type application/x-www-form-urlencoded', async () => {
      await smsService.send({ to: '+79001234567', text: 'Hello' })

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    })

    it('should throw when Twilio credentials are missing', async () => {
      mockEnv.TWILIO_ACCOUNT_SID = undefined

      await expect(smsService.send({ to: '+79001234567', text: 'Hello' }))
        .rejects.toThrow('Twilio is not configured')
    })

    it('should throw when TWILIO_AUTH_TOKEN is missing', async () => {
      mockEnv.TWILIO_AUTH_TOKEN = undefined

      await expect(smsService.send({ to: '+79001234567', text: 'Hello' }))
        .rejects.toThrow('Twilio is not configured')
    })

    it('should throw when TWILIO_PHONE_NUMBER is missing', async () => {
      mockEnv.TWILIO_PHONE_NUMBER = undefined

      await expect(smsService.send({ to: '+79001234567', text: 'Hello' }))
        .rejects.toThrow('Twilio is not configured')
    })

    it('should throw on non-ok response with error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Invalid phone number' }),
      })

      await expect(smsService.send({ to: 'invalid', text: 'Hello' }))
        .rejects.toThrow('Twilio error: Invalid phone number')
    })

    it('should use statusText when response body has no message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('parse error')),
      })

      await expect(smsService.send({ to: '+79001234567', text: 'Hello' }))
        .rejects.toThrow('Twilio error: Internal Server Error')
    })
  })

  describe('SMSC provider', () => {
    beforeEach(() => {
      mockEnv.SMS_PROVIDER = 'smsc'
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      })
    })

    it('should send GET request to smsc.ru', async () => {
      await smsService.send({ to: '+79001234567', text: 'Code: 5678' })

      expect(mockFetch).toHaveBeenCalledOnce()
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('https://smsc.ru/sys/send.php')
    })

    it('should include login and password in query params', async () => {
      await smsService.send({ to: '+79001234567', text: 'Hello' })

      const [url] = mockFetch.mock.calls[0]
      const params = new URL(url).searchParams
      expect(params.get('login')).toBe('smsc_login')
      expect(params.get('psw')).toBe('smsc_pass')
    })

    it('should include phone and message in query params', async () => {
      await smsService.send({ to: '+79001234567', text: 'Code: 9999' })

      const [url] = mockFetch.mock.calls[0]
      const params = new URL(url).searchParams
      expect(params.get('phones')).toBe('+79001234567')
      expect(params.get('mes')).toBe('Code: 9999')
    })

    it('should include fmt=3 for JSON response', async () => {
      await smsService.send({ to: '+79001234567', text: 'Hello' })

      const [url] = mockFetch.mock.calls[0]
      const params = new URL(url).searchParams
      expect(params.get('fmt')).toBe('3')
    })

    it('should include sender when SMSC_SENDER is set', async () => {
      mockEnv.SMSC_SENDER = 'MyBrand'

      await smsService.send({ to: '+79001234567', text: 'Hello' })

      const [url] = mockFetch.mock.calls[0]
      const params = new URL(url).searchParams
      expect(params.get('sender')).toBe('MyBrand')
    })

    it('should not include sender when SMSC_SENDER is not set', async () => {
      mockEnv.SMSC_SENDER = undefined

      await smsService.send({ to: '+79001234567', text: 'Hello' })

      const [url] = mockFetch.mock.calls[0]
      const params = new URL(url).searchParams
      expect(params.has('sender')).toBe(false)
    })

    it('should throw when SMSC credentials are missing', async () => {
      mockEnv.SMSC_LOGIN = undefined

      await expect(smsService.send({ to: '+79001234567', text: 'Hello' }))
        .rejects.toThrow('SMSC is not configured')
    })

    it('should throw when SMSC_PASSWORD is missing', async () => {
      mockEnv.SMSC_PASSWORD = undefined

      await expect(smsService.send({ to: '+79001234567', text: 'Hello' }))
        .rejects.toThrow('SMSC is not configured')
    })

    it('should throw on HTTP error from SMSC', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Service Unavailable',
      })

      await expect(smsService.send({ to: '+79001234567', text: 'Hello' }))
        .rejects.toThrow('SMSC HTTP error: Service Unavailable')
    })

    it('should throw on SMSC API error in response body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: 'Invalid phone format', error_code: 2 }),
      })

      await expect(smsService.send({ to: 'invalid', text: 'Hello' }))
        .rejects.toThrow('SMSC error: Invalid phone format')
    })
  })
})
