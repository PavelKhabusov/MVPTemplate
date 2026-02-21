import { ScrollView } from 'react-native'
import { YStack, Text, XStack, H2 } from 'tamagui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@mvp/i18n'
import { StateView, FadeIn, AnimatedListItem, AppCard, ScalePress } from '@mvp/ui'
import { api } from '../../services/api'
import { useQueryState } from '@mvp/lib'

interface Notification {
  id: string
  title: string
  body: string | null
  type: string
  isRead: boolean
  createdAt: string
}

function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications')
      return data.data as Notification[]
    },
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

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (state.status !== 'success') {
    return <StateView state={state} />
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <YStack padding="$4" gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <FadeIn>
            <H2>{t('notifications.title')}</H2>
          </FadeIn>
          <ScalePress onPress={() => markAllRead.mutate()}>
            <Text color="$primary" fontSize="$2" fontWeight="600">
              {t('notifications.markAllRead')}
            </Text>
          </ScalePress>
        </XStack>

        {state.data.map((notification, index) => (
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
        ))}
      </YStack>
    </ScrollView>
  )
}
