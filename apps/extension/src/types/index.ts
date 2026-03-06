export type LoginStep = 'welcome' | 'form' | 'done'

export type Tab = string

export type ThemeMode = 'system' | 'light' | 'dark'

export interface Subscription {
  id: string
  planName: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export interface Plan {
  id: string
  name: string
  description: string | null
  priceAmount: number
  currency: string
  interval: string
  features: string[]
}
