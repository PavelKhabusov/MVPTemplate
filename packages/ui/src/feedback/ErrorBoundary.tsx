import { Component, ReactNode, ErrorInfo } from 'react'
import { YStack, Text } from 'tamagui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
          <Text fontSize="$6" fontWeight="bold" color="$error">
            Something went wrong
          </Text>
          <Text color="$mutedText" fontSize="$3" textAlign="center">
            {this.state.error?.message}
          </Text>
          <Text
            color="$primary"
            fontSize="$3"
            fontWeight="600"
            onPress={this.reset}
            cursor="pointer"
          >
            Try again
          </Text>
        </YStack>
      )
    }

    return this.props.children
  }
}
