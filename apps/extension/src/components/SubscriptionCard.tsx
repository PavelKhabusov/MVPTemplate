import { Crown, ExternalLink } from 'lucide-react'
import type { Subscription } from '../types'

interface SubscriptionCardProps {
  subscription: Subscription | null
  loading: boolean
}

export default function SubscriptionCard({ subscription, loading }: SubscriptionCardProps) {
  if (loading) {
    return (
      <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-bg-tertiary rounded w-1/2 mb-2" />
        <div className="h-3 bg-bg-tertiary rounded w-3/4" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Crown size={16} className="text-text-muted" />
          <span className="text-[13px] font-medium">Free Plan</span>
        </div>
        <p className="text-[12px] text-text-secondary mb-3">
          Upgrade to unlock all features
        </p>
        <a
          href="http://localhost:8081/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-gradient-to-br from-brand to-brand-dark text-white rounded-lg py-2 text-[12px] font-medium no-underline hover:opacity-90 transition"
        >
          <ExternalLink size={12} />
          Upgrade
        </a>
      </div>
    )
  }

  const isActive = subscription.status === 'active'
  const endDate = new Date(subscription.currentPeriodEnd).toLocaleDateString()

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-brand" />
          <span className="text-[13px] font-medium">{subscription.planName}</span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full ${
            isActive ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
          }`}
        >
          {isActive ? 'Active' : subscription.status}
        </span>
      </div>
      <p className="text-[11px] text-text-secondary">
        {subscription.cancelAtPeriodEnd
          ? `Cancels on ${endDate}`
          : `Renews on ${endDate}`}
      </p>
    </div>
  )
}
