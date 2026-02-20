import { lazy, Suspense, ComponentType, ReactNode } from 'react'
import { ActivityIndicator, View } from 'react-native'

/**
 * Lazy load a component with Suspense wrapper.
 * Use for heavy screens/components to reduce initial bundle.
 */
export function lazyWithSuspense<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn)

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense
        fallback={
          fallback ?? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" />
            </View>
          )
        }
      >
        {/* @ts-ignore */}
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}
