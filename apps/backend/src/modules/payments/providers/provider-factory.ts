import { env } from '../../../config/env'
import type { PaymentProvider } from './payment-provider'
import { StripeProvider } from './stripe.provider'
import { YooKassaProvider } from './yookassa.provider'
import { RobokassaProvider } from './robokassa.provider'
import { PayPalProvider } from './paypal.provider'

let stripeProvider: StripeProvider | null = null
let yookassaProvider: YooKassaProvider | null = null
let robokassaProvider: RobokassaProvider | null = null
let paypalProvider: PayPalProvider | null = null

export type ProviderName = 'stripe' | 'yookassa' | 'robokassa' | 'paypal'

export function getPaymentProvider(provider: ProviderName): PaymentProvider {
  if (provider === 'stripe') {
    if (!env.STRIPE_ENABLED) throw new Error('Stripe is disabled (STRIPE_ENABLED=false)')
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.')
    }
    if (!stripeProvider) {
      stripeProvider = new StripeProvider(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET)
    }
    return stripeProvider
  }

  if (provider === 'yookassa') {
    if (!env.YOOKASSA_ENABLED) throw new Error('YooKassa is disabled (YOOKASSA_ENABLED=false)')
    if (!env.YOOKASSA_SHOP_ID || !env.YOOKASSA_SECRET_KEY) {
      throw new Error('YooKassa is not configured. Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY.')
    }
    if (!yookassaProvider) {
      yookassaProvider = new YooKassaProvider(env.YOOKASSA_SHOP_ID, env.YOOKASSA_SECRET_KEY)
    }
    return yookassaProvider
  }

  if (provider === 'robokassa') {
    if (!env.ROBOKASSA_ENABLED) throw new Error('Robokassa is disabled (ROBOKASSA_ENABLED=false)')
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

  if (provider === 'paypal') {
    if (!env.PAYPAL_ENABLED) throw new Error('PayPal is disabled (PAYPAL_ENABLED=false)')
    if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.')
    }
    if (!paypalProvider) {
      paypalProvider = new PayPalProvider(
        env.PAYPAL_CLIENT_ID,
        env.PAYPAL_CLIENT_SECRET,
        env.PAYPAL_WEBHOOK_ID ?? '',
        env.PAYPAL_MODE,
      )
    }
    return paypalProvider
  }

  throw new Error(`Unknown payment provider: ${provider}`)
}

export function getEnabledProviders(): ProviderName[] {
  const providers: ProviderName[] = []
  if (env.STRIPE_ENABLED && env.STRIPE_SECRET_KEY) providers.push('stripe')
  if (env.YOOKASSA_ENABLED && env.YOOKASSA_SHOP_ID) providers.push('yookassa')
  if (env.ROBOKASSA_ENABLED && env.ROBOKASSA_MERCHANT_LOGIN) providers.push('robokassa')
  if (env.PAYPAL_ENABLED && env.PAYPAL_CLIENT_ID) providers.push('paypal')
  return providers
}
