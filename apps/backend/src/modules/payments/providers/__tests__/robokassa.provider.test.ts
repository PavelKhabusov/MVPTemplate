import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import { RobokassaProvider } from '../robokassa.provider'

describe('RobokassaProvider', () => {
  let provider: RobokassaProvider
  const merchantLogin = 'TestMerchant'
  const password1 = 'pwd1_secret'
  const password2 = 'pwd2_secret'

  beforeEach(() => {
    provider = new RobokassaProvider(merchantLogin, password1, password2, true)
  })

  const baseParams = {
    userId: 'user_1',
    userEmail: 'test@test.com',
    planId: 'plan_pro',
    priceId: '',
    planName: 'Pro Plan',
    amount: 199900, // 1999.00 RUB in kopecks
    currency: 'rub',
    interval: 'one_time' as const,
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  }

  describe('createCheckoutSession', () => {
    it('should generate a valid checkout URL with signature', async () => {
      const result = await provider.createCheckoutSession(baseParams)

      expect(result.checkoutUrl).toContain('https://auth.robokassa.ru/Merchant/Index.aspx')
      expect(result.checkoutUrl).toContain(`MerchantLogin=${merchantLogin}`)
      expect(result.checkoutUrl).toContain('OutSum=1999.00')
      expect(result.checkoutUrl).toContain('IsTest=1')
      expect(result.checkoutUrl).toContain('Shp_userId=user_1')
      expect(result.checkoutUrl).toContain('Shp_planId=plan_pro')
      expect(result.sessionId).toBeTruthy()
    })

    it('should include correct signature in URL', async () => {
      const result = await provider.createCheckoutSession(baseParams)
      const url = new URL(result.checkoutUrl)
      const signatureValue = url.searchParams.get('SignatureValue')

      expect(signatureValue).toBeTruthy()
      // Signature is MD5(MerchantLogin:OutSum:InvId:Password1:Shp_params sorted)
      expect(signatureValue!.length).toBe(32) // MD5 hex length
    })
  })

  describe('parseWebhook', () => {
    function buildWebhookBody(
      outSum: string,
      invId: string,
      shpParams: Record<string, string>,
    ): string {
      const shpString = Object.keys(shpParams)
        .sort()
        .map((key) => `${key}=${shpParams[key]}`)
        .join(':')

      const signatureBase = shpString
        ? `${outSum}:${invId}:${password2}:${shpString}`
        : `${outSum}:${invId}:${password2}`
      const signature = crypto.createHash('md5').update(signatureBase).digest('hex')

      const params = new URLSearchParams({
        OutSum: outSum,
        InvId: invId,
        SignatureValue: signature,
        ...shpParams,
      })
      return params.toString()
    }

    it('should parse a valid one-time payment webhook', async () => {
      const body = buildWebhookBody('19.99', '12345', {
        Shp_interval: 'one_time',
        Shp_planId: 'plan_pro',
        Shp_userId: 'user_1',
      })

      const event = await provider.parseWebhook(body, {})

      expect(event.type).toBe('payment.succeeded')
      expect(event.providerPaymentId).toBe('12345')
      expect(event.userId).toBe('user_1')
      expect(event.planId).toBe('plan_pro')
      expect(event.amount).toBe(1999)
      expect(event.currency).toBe('rub')
    })

    it('should parse a subscription webhook', async () => {
      const body = buildWebhookBody('9.99', '67890', {
        Shp_interval: 'month',
        Shp_planId: 'plan_pro',
        Shp_userId: 'user_2',
      })

      const event = await provider.parseWebhook(body, {})

      expect(event.type).toBe('subscription.created')
      expect(event.providerSubscriptionId).toBe('robokassa_67890')
    })

    it('should reject invalid signature', async () => {
      const params = new URLSearchParams({
        OutSum: '19.99',
        InvId: '12345',
        SignatureValue: 'invalid_signature',
        Shp_userId: 'user_1',
        Shp_planId: 'plan_pro',
        Shp_interval: 'one_time',
      })

      await expect(
        provider.parseWebhook(params.toString(), {}),
      ).rejects.toThrow('Invalid Robokassa signature')
    })

    it('should throw when required parameters are missing', async () => {
      const params = new URLSearchParams({ OutSum: '19.99' })
      await expect(
        provider.parseWebhook(params.toString(), {}),
      ).rejects.toThrow('Missing required Robokassa webhook parameters')
    })
  })
})
