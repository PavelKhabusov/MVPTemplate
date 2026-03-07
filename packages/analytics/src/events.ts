/**
 * Typed analytics events for the entire funnel.
 * Usage: import { trackEvent } from '@mvp/analytics'
 */
import { analytics } from './analytics'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function trackSignIn(method: 'email' | 'google' | 'phone') {
  analytics.track('auth_sign_in', { method })
}

export function trackSignInError(method: 'email' | 'google' | 'phone', error: string) {
  analytics.track('auth_sign_in_error', { method, error })
}

export function trackSignUp(method: 'email' | 'google' | 'phone') {
  analytics.track('auth_sign_up', { method })
}

export function trackSignUpError(method: 'email' | 'google' | 'phone', error: string) {
  analytics.track('auth_sign_up_error', { method, error })
}

export function trackSignOut() {
  analytics.track('auth_sign_out')
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export function trackOnboardingStep(step: number, totalSteps: number) {
  analytics.track('onboarding_step', { step, totalSteps })
}

export function trackOnboardingComplete() {
  analytics.track('onboarding_complete')
}

export function trackOnboardingSkip(step: number) {
  analytics.track('onboarding_skip', { step })
}

export function trackCoachMarkStep(stepId: string, index: number) {
  analytics.track('coach_mark_step', { stepId, index })
}

export function trackCoachMarkComplete() {
  analytics.track('coach_mark_complete')
}

// ---------------------------------------------------------------------------
// Pricing & Payments
// ---------------------------------------------------------------------------

export function trackPricingView(planCount: number) {
  analytics.track('pricing_view', { planCount })
}

export function trackBillingToggle(interval: 'month' | 'year') {
  analytics.track('billing_toggle', { interval })
}

export function trackPlanSelect(planId: string, planName: string, price: number, interval: string) {
  analytics.track('plan_select', { planId, planName, price, interval })
}

export function trackCheckoutStart(planId: string) {
  analytics.track('checkout_start', { planId })
}

export function trackCheckoutSuccess() {
  analytics.track('checkout_success')
}

export function trackSubscriptionCancel() {
  analytics.track('subscription_cancel')
}

// ---------------------------------------------------------------------------
// Cookie Consent
// ---------------------------------------------------------------------------

export function trackCookieConsent(action: 'accepted' | 'declined') {
  analytics.track('cookie_consent', { action })
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

export function trackLandingCTA(button: 'primary' | 'secondary') {
  analytics.track('landing_cta_click', { button })
}

// ---------------------------------------------------------------------------
// General Navigation
// ---------------------------------------------------------------------------

export function trackQuickAction(action: string) {
  analytics.track('quick_action', { action })
}
