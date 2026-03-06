import { Layout } from 'lucide-react'
import SubscriptionCard from './SubscriptionCard'
import type { Subscription } from '../types'

interface HomeTabProps {
  subscription: Subscription | null
  subscriptionLoading: boolean
}

export default function HomeTab({ subscription, subscriptionLoading }: HomeTabProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
      <SubscriptionCard subscription={subscription} loading={subscriptionLoading} />

      {/* Placeholder content */}
      <div className="bg-bg-secondary border border-bg-tertiary border-dashed rounded-xl p-6 flex flex-col items-center gap-3 text-center">
        <Layout size={24} className="text-text-muted" />
        <div className="text-[13px] text-text-secondary">
          Your content here
        </div>
        <div className="text-[11px] text-text-muted">
          Replace this placeholder with your extension features
        </div>
      </div>
    </div>
  )
}
