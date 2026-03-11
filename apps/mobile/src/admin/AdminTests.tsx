import React from 'react'
import { Platform, Linking } from 'react-native'
import { YStack, Text } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { AppButton, FadeIn } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'

const DASHBOARD_URL = 'http://localhost:3000/dev/tests'

export function TestsAdminTab() {
  const { t } = useTranslation()

  if (Platform.OS === 'web') {
    return (
      <YStack flex={1} paddingHorizontal="$4">
        <FadeIn>
          <YStack
            flex={1}
            borderRadius="$4"
            overflow="hidden"
            borderWidth={1}
            borderColor="$borderColor"
            // @ts-ignore — web-only style
            style={{ minHeight: 'calc(100vh - 120px)' }}
          >
            <iframe
              src={DASHBOARD_URL}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                minHeight: 'calc(100vh - 120px)',
              }}
              title="Test Dashboard"
            />
          </YStack>
        </FadeIn>
      </YStack>
    )
  }

  // Native: open in browser
  return (
    <YStack flex={1} padding="$4" alignItems="center" justifyContent="center" gap="$4">
      <Ionicons name="flask-outline" size={48} color="#888" />
      <Text fontSize="$4" color="$mutedText" textAlign="center">
        {t('admin.testsWebOnly')}
      </Text>
      <AppButton onPress={() => Linking.openURL(DASHBOARD_URL)}>
        {t('admin.openInBrowser')}
      </AppButton>
    </YStack>
  )
}
