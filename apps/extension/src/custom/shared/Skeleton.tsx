interface SkeletonProps { className?: string }

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-bg-tertiary/50 rounded animate-pulse ${className}`} />
}

export function ContactSkeleton() {
  return (
    <div className="flex items-center gap-2.5 py-2 px-2.5">
      <Skeleton className="w-7.5 h-7.5 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-3 w-24 mb-1.5" />
        <Skeleton className="h-2.5 w-32" />
      </div>
    </div>
  )
}

export function CallCardSkeleton() {
  return (
    <div className="bg-bg-secondary rounded-xl p-3">
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <Skeleton className="h-3.5 w-28 mb-1.5" />
          <Skeleton className="h-2.5 w-32" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-2.5 w-12" />
        </div>
      </div>
    </div>
  )
}

export function SettingSkeleton() {
  return (
    <div className="bg-bg-secondary rounded-xl p-3">
      <Skeleton className="h-2.5 w-20 mb-3" />
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div>
          <Skeleton className="h-3 w-24 mb-1" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
    </div>
  )
}