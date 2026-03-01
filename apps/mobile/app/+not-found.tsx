import { YStack, Text, H1 } from 'tamagui'
import { Link, Stack } from 'expo-router'
import { FadeIn } from '@mvp/ui'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$4">
        <FadeIn>
          <H1>404</H1>
          <Text color="$mutedText" textAlign="center" marginTop="$2">
            This page doesn't exist.
          </Text>
        </FadeIn>

        <Link href="/">
          <Text color="$accent" fontWeight="bold">
            Go to Home
          </Text>
        </Link>
      </YStack>
    </>
  )
}
