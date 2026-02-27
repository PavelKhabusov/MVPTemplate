import crypto from 'node:crypto'
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
  CancelSubscriptionParams,
} from './payment-provider'

const ROBOKASSA_URL = 'https://auth.robokassa.ru/Merchant/Index.aspx'

export class RobokassaProvider implements PaymentProvider {
  readonly name = 'robokassa' as const

  constructor(
    private merchantLogin: string,
    private password1: string,
    private password2: string,
    private testMode: boolean = true,
  ) {}

  private generateInvId(): number {
    return Math.floor(Date.now() / 1000) * 100 + Math.floor(Math.random() * 100)
  }

  private md5(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex')
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const invId = this.generateInvId()
    const outSum = (params.amount / 100).toFixed(2)

    const shpParams: Record<string, string> = {
      Shp_interval: params.interval,
      Shp_planId: params.planId,
      Shp_userId: params.userId,
    }

    // Shp_ params sorted alphabetically, colon-separated
    const shpString = Object.keys(shpParams)
      .sort()
      .map((key) => `${key}=${shpParams[key]}`)
      .join(':')

    // Signature: MD5(MerchantLogin:OutSum:InvId:Password1:Shp_params)
    const signatureValue = this.md5(
      `${this.merchantLogin}:${outSum}:${invId}:${this.password1}:${shpString}`,
    )

    const urlParams = new URLSearchParams({
      MerchantLogin: this.merchantLogin,
      OutSum: outSum,
      InvId: invId.toString(),
      Description: params.planName,
      SignatureValue: signatureValue,
      Culture: 'ru',
      Email: params.userEmail,
      ...shpParams,
    })

    if (this.testMode) {
      urlParams.set('IsTest', '1')
    }

    return {
      checkoutUrl: `${ROBOKASSA_URL}?${urlParams.toString()}`,
      sessionId: invId.toString(),
    }
  }

  async parseWebhook(rawBody: string, _headers: Record<string, string>): Promise<WebhookEvent> {
    const params = new URLSearchParams(rawBody)

    const outSum = params.get('OutSum')
    const invId = params.get('InvId')
    const signatureValue = params.get('SignatureValue')

    if (!outSum || !invId || !signatureValue) {
      throw new Error('Missing required Robokassa webhook parameters')
    }

    // Extract Shp_ parameters
    const shpParams: Record<string, string> = {}
    for (const [key, value] of params.entries()) {
      if (key.startsWith('Shp_')) {
        shpParams[key] = value
      }
    }

    // Verify signature: MD5(OutSum:InvId:Password2:Shp_params_sorted)
    const shpString = Object.keys(shpParams)
      .sort()
      .map((key) => `${key}=${shpParams[key]}`)
      .join(':')

    const signatureBase = shpString
      ? `${outSum}:${invId}:${this.password2}:${shpString}`
      : `${outSum}:${invId}:${this.password2}`

    const expectedSignature = this.md5(signatureBase)

    if (signatureValue.toLowerCase() !== expectedSignature.toLowerCase()) {
      throw new Error('Invalid Robokassa signature')
    }

    const userId = shpParams['Shp_userId']
    const planId = shpParams['Shp_planId']
    const interval = shpParams['Shp_interval']
    const amount = Math.round(parseFloat(outSum) * 100)
    const isSubscription = interval && interval !== 'one_time'

    // Robokassa Result URL is only called on successful payment
    if (isSubscription) {
      return {
        type: 'subscription.created',
        providerPaymentId: invId,
        providerSubscriptionId: `robokassa_${invId}`,
        userId,
        planId,
        amount,
        currency: 'rub',
        rawEvent: Object.fromEntries(params.entries()),
      }
    }

    return {
      type: 'payment.succeeded',
      providerPaymentId: invId,
      userId,
      planId,
      amount,
      currency: 'rub',
      rawEvent: Object.fromEntries(params.entries()),
    }
  }

  async cancelSubscription(_params: CancelSubscriptionParams): Promise<void> {
    // Robokassa doesn't have native subscription management.
    // Cancellation is handled by updating our DB and stopping recurring charges.
  }

  async getSubscription(_providerSubscriptionId: string): Promise<{
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  }> {
    // Robokassa subscriptions are managed locally in our database.
    throw new Error('Robokassa subscriptions are managed locally')
  }

  async refundPayment(_providerPaymentId: string, _amountMinorUnits?: number) {
    throw new Error('Robokassa refunds are not yet implemented')
  }
}
