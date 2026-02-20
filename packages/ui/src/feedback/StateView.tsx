import { ReactNode } from 'react'
import { YStack, Text, Spinner } from 'tamagui'
import { MotiView, AnimatePresence } from 'moti'

type ViewState =
  | { status: 'loading' }
  | { status: 'error'; message?: string; onRetry?: () => void }
  | { status: 'empty'; message?: string }
  | { status: 'success'; children: ReactNode }

interface StateViewProps {
  state: ViewState
  loadingMessage?: string
  emptyMessage?: string
}

export function StateView({ state, loadingMessage, emptyMessage }: StateViewProps) {
  return (
    <AnimatePresence exitBeforeEnter>
      {state.status === 'loading' && (
        <MotiView
          key="loading"
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
            <Spinner size="large" color="$primary" />
            {loadingMessage && (
              <Text color="$mutedText" fontSize="$3">
                {loadingMessage}
              </Text>
            )}
          </YStack>
        </MotiView>
      )}

      {state.status === 'error' && (
        <MotiView
          key="error"
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
            <Text fontSize="$7">!</Text>
            <Text color="$error" fontSize="$4" fontWeight="600" textAlign="center">
              {state.message ?? 'Something went wrong'}
            </Text>
            {state.onRetry && (
              <Text
                color="$primary"
                fontSize="$3"
                fontWeight="600"
                onPress={state.onRetry}
                cursor="pointer"
              >
                Retry
              </Text>
            )}
          </YStack>
        </MotiView>
      )}

      {state.status === 'empty' && (
        <MotiView
          key="empty"
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
            <Text color="$mutedText" fontSize="$4" textAlign="center">
              {state.message ?? emptyMessage ?? 'Nothing here yet'}
            </Text>
          </YStack>
        </MotiView>
      )}

      {state.status === 'success' && (
        <MotiView
          key="success"
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
        >
          {state.children}
        </MotiView>
      )}
    </AnimatePresence>
  )
}
