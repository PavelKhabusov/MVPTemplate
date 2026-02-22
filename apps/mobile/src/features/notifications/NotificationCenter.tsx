import { useState, useCallback } from 'react'
import { ScrollView, Platform } from 'react-native'
import { YStack, Text, XStack, H2 } from 'tamagui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore } from '@mvp/store'
import { StateView, FadeIn, AnimatedListItem, AppCard, ScalePress, SettingsGroup, SettingsGroupItem } from '@mvp/ui'
import { useTemplateFlag } from '@mvp/template-config'
import { api } from '../../services/api'
import { useQueryState } from '@mvp/lib'
import { storage } from '@mvp/lib'
import { registerForPushNotifications } from '../../services/push'

interface Notification {
  id: string
  title: string
  body: string | null
  type: string
  isRead: boolean
  createdAt: string
}

const PUSH_PREF_KEY = 'push_notifications_enabled'

function usePushPreference() {
  const [enabled, setEnabled] = useState(() => {
    return storage.getString(PUSH_PREF_KEY) !== 'false'
  })

  const toggle = useCallback(async (value: boolean) => {
    setEnabled(value)
    storage.set(PUSH_PREF_KEY, value ? 'true' : 'false')

    if (value) {
      await registerForPushNotifications().catch(() => {})
    } else {
      try {
        await api.delete('/push/unregister')
      } catch {}
    }
  }, [])

  return { enabled, toggle }
}

function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications')
      return data.data as Notification[]
    },
    enabled: isAuthenticated,
  })
}

export function NotificationCenter() {
  const { t } = useTranslation()
  const query = useNotifications()
  const state = useQueryState(query, {
    emptyCheck: (data) => data.length === 0,
    emptyMessage: t('notifications.empty'),
  })
  const queryClient = useQueryClient()
  const pushPref = usePushPreference()
  const emailEnabled = useTemplateFlag('email', false)

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <YStack padding="$4" gap="$3">
        {/* Settings */}
        <FadeIn>
          <SettingsGroup header={t('notifications.settings')}>
            <SettingsGroupItem
              icon="notifications-outline"
              label={t('notifications.pushToggle')}
              toggle
              toggleValue={pushPref.enabled}
              onToggleChange={pushPref.toggle}
            />
            {emailEnabled && (
              <SettingsGroupItem
                icon="mail-outline"
                label={t('notifications.emailToggle')}
                value={t('common.comingSoon')}
              />
            )}
          </SettingsGroup>
        </FadeIn>

        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
          <FadeIn>
            <H2>{t('notifications.title')}</H2>
          </FadeIn>
          <ScalePress onPress={() => markAllRead.mutate()}>
            <XStack alignItems="center" gap="$1.5">
              <Text color="$primary" fontSize="$2" fontWeight="600">
                {t('notifications.markAllRead')}
              </Text>
            </XStack>
          </ScalePress>
        </XStack>

        {state.status !== 'success' ? (
          <StateView state={state} />
        ) : (
          state.data.map((notification, index) => (
            <AnimatedListItem key={notification.id} index={index}>
              <AppCard
                opacity={notification.isRead ? 0.6 : 1}
                borderLeftWidth={3}
                borderLeftColor={notification.isRead ? '$borderColor' : '$primary'}
              >
                <Text fontWeight="600" fontSize="$3">
                  {notification.title}
                </Text>
                {notification.body && (
                  <Text color="$mutedText" fontSize="$2" marginTop="$1">
                    {notification.body}
                  </Text>
                )}
                <Text color="$mutedText" fontSize="$1" marginTop="$2">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </Text>
              </AppCard>
            </AnimatedListItem>
          ))
        )}
      </YStack>
    </ScrollView>
  )
}
