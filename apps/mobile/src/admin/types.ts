// Shared TypeScript interfaces, constants, and utility functions for Admin screens

export interface AdminUser {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  bio?: string | null
  phone?: string | null
  location?: string | null
  role: string
  features: string[]
  createdAt: string
}

export interface AdminStats {
  totalUsers: number
  newThisWeek: number
}

export interface AdminConfig {
  roles: string[]
  features: string[]
}

export interface DocFeedbackStat {
  pageId: string
  likes: number
  dislikes: number
  total: number
}

export interface AnalyticsDashboard {
  activeUsers: { dau: number; wau: number; mau: number }
  registrations: Array<{ day: string; count: number }>
  popularScreens: Array<{ screenName: string; views: number }>
  dailyActivity: Array<{ day: string; events: number; uniqueUsers: number }>
  avgSessionTime: number
  docFeedback: DocFeedbackStat[]
}

export interface AdminPlan {
  id: string
  name: string
  description: string | null
  priceAmount: number
  currency: string
  interval: string
  features: string[]
  provider: string
  providerPriceId: string | null
  isActive: boolean
  sortOrder: number
}

export const FEATURE_LABELS: Record<string, string> = {
  beta_access: 'Beta Access',
  premium: 'Premium',
  push_notifications: 'Push Notifications',
  advanced_analytics: 'Advanced Analytics',
  api_access: 'API Access',
  custom_theme: 'Custom Theme',
  export_data: 'Export Data',
  priority_support: 'Priority Support',
}

export const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444',
  moderator: '#F59E0B',
  user: '#6B7280',
}

export const PROVIDER_CFG: Record<string, { label: string; color: string }> = {
  stripe: { label: 'Stripe', color: '#635BFF' },
  yookassa: { label: 'YooKassa', color: '#00B2FF' },
  robokassa: { label: 'Robokassa', color: '#F5A623' },
  paypal: { label: 'PayPal', color: '#003087' },
}

export const PAYMENT_STATUS_COLOR: Record<string, string> = {
  succeeded: '#22C55E',
  pending: '#F59E0B',
  failed: '#EF4444',
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
