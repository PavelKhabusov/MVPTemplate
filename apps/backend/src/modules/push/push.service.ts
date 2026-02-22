import Expo, { ExpoPushMessage } from 'expo-server-sdk'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../config/database'
import { env } from '../../config/env'
import { pushTokens, notifications, users } from '../../database/schema/index'
import { sendSSE } from '../../realtime/sse'

const expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN || undefined })

interface NotificationPayload {
  title: string
  body?: string
  type?: string
  data?: Record<string, unknown>
}

/** Create a notification record, send push, and emit SSE event */
export async function createNotification(userId: string, payload: NotificationPayload) {
  // Insert notification record
  const [notification] = await db
    .insert(notifications)
    .values({
      userId,
      title: payload.title,
      body: payload.body ?? null,
      type: payload.type ?? 'general',
      data: payload.data ?? null,
    })
    .returning()

  // Send SSE event for real-time update
  sendSSE(userId, 'notification', { id: notification.id, title: payload.title })

  // Send push notification to devices
  await sendPushToUser(userId, payload)

  return notification
}

/** Send push notification to a specific user's devices */
async function sendPushToUser(userId: string, payload: NotificationPayload) {
  const tokens = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId))

  if (tokens.length === 0) return

  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({
      to: t.token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: 'default' as const,
    }))

  if (messages.length === 0) return

  const chunks = expo.chunkPushNotifications(messages)
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk)
    } catch (err) {
      console.error('Failed to send push chunk:', err)
    }
  }
}

/** Send notification to multiple users (or all users) */
export async function sendToUsers(userIds: string[] | null, payload: NotificationPayload) {
  let targetUserIds: string[]

  if (userIds && userIds.length > 0) {
    targetUserIds = userIds
  } else {
    // Send to ALL users — push delivery happens only for those with tokens
    const rows = await db
      .select({ id: users.id })
      .from(users)

    targetUserIds = rows.map((r) => r.id)
  }

  const results = await Promise.allSettled(
    targetUserIds.map((userId) => createNotification(userId, payload))
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return { sent, failed, total: targetUserIds.length }
}
