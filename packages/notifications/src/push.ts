import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import type { NotificationHttpClient } from './types'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotifications(
  http: NotificationHttpClient
): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  const tokenData = await Notifications.getExpoPushTokenAsync()
  const token = tokenData.data

  // Register token with backend
  try {
    await http.post('/push/register', {
      token,
      platform: Platform.OS,
    })
  } catch (err) {
    console.error('Failed to register push token:', err)
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  return token
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler)
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler)
}
