import { env } from '../../../config/env'
import type { PaymentProvider } from './payment-provider'
import { StripeProvider } from './stripe.provider'
import { YooKassaProvider } from './yookassa.provider'
import { RobokassaProvider } from './robokassa.provider'

let stripeProvider: StripeProvider | null = null
let yookassaProvider: YooKassaProvider | null = null
let robokassaProvider: RobokassaProvider | null = null

export function getPaymentProvider(provider: 'stripe' | 'yookassa' | 'robokassa'): PaymentProvider {
  if (provider === 'stripe') {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.')
    }
    if (!stripeProvider) {
      stripeProvider = new StripeProvider(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET)
    }
    return stripeProvider
  }

  if (provider === 'yookassa') {
    if (!env.YOOKASSA_SHOP_ID || !env.YOOKASSA_SECRET_KEY) {
      throw new Error('YooKassa is not configured. Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY.')
    }
    if (!yookassaProvider) {
      yookassaProvider = new YooKassaProvider(env.YOOKASSA_SHOP_ID, env.YOOKASSA_SECRET_KEY)
    }
    return yookassaProvider
  }

  if (provider === 'robokassa') {
    if (!env.ROBOKASSA_MERCHANT_LOGIN || !env.ROBOKASSA_PASSWORD1 || !env.ROBOKASSA_PASSWORD2) {
      throw new Error('Robokassa is not configured. Set ROBOKASSA_MERCHANT_LOGIN, ROBOKASSA_PASSWORD1, and ROBOKASSA_PASSWORD2.')
    }
    if (!robokassaProvider) {
      robokassaProvider = new RobokassaProvider(
        env.ROBOKASSA_MERCHANT_LOGIN,
        env.ROBOKASSA_PASSWORD1,
        env.ROBOKASSA_PASSWORD2,
        env.ROBOKASSA_TEST_MODE,
      )
    }
    return robokassaProvider
  }

  throw new Error(`Unknown payment provider: ${provider}`)
}

export function getEnabledProviders(): Array<'stripe' | 'yookassa' | 'robokassa'> {
  const providers: Array<'stripe' | 'yookassa' | 'robokassa'> = []
  if (env.STRIPE_SECRET_KEY) providers.push('stripe')
  if (env.YOOKASSA_SHOP_ID) providers.push('yookassa')
  if (env.ROBOKASSA_MERCHANT_LOGIN) providers.push('robokassa')
  return providers
}
