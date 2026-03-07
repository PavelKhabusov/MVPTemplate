import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so these are available inside vi.mock factories
const {
  mockSendPushNotificationsAsync,
  mockChunkPushNotifications,
  mockIsExpoPushToken,
  mockDbSelect,
  mockDbInsert,
  mockDbFrom,
  mockDbWhere,
  mockDbValues,
  mockDbReturning,
  mockSendSSE,
} = vi.hoisted(() => ({
  mockSendPushNotificationsAsync: vi.fn().mockResolvedValue([]),
  mockChunkPushNotifications: vi.fn((messages: unknown[]) => [messages]),
  mockIsExpoPushToken: vi.fn((token: string) => token.startsWith('ExponentPushToken[')),
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbFrom: vi.fn(),
  mockDbWhere: vi.fn(),
  mockDbValues: vi.fn(),
  mockDbReturning: vi.fn(),
  mockSendSSE: vi.fn(),
}))

vi.mock('expo-server-sdk', () => {
  const ExpoMock = vi.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: mockSendPushNotificationsAsync,
    chunkPushNotifications: mockChunkPushNotifications,
  }))
  ;(ExpoMock as unknown as Record<string, unknown>).isExpoPushToken = mockIsExpoPushToken
  return { default: ExpoMock }
})

vi.mock('../../../config/database', () => {
  // Default from() result: array-like with .where() method
  function defaultFromResult() {
    const result: unknown[] & { where?: (...args: unknown[]) => unknown[] } = []
    result.where = (...wArgs: unknown[]) => {
      mockDbWhere(...wArgs)
      return (mockDbWhere as unknown as Record<string, unknown>)._returnValue ?? []
    }
    return result
  }

  return {
    db: {
      select: (...args: unknown[]) => {
        mockDbSelect(...args)
        return {
          from: (...fArgs: unknown[]) => {
            // mockDbFrom may have mockImplementationOnce set for special cases
            const result = mockDbFrom(...fArgs)
            // If mockDbFrom returned something (via mockImplementationOnce), use it
            if (result !== undefined) return result
            // Otherwise return default
            return defaultFromResult()
          },
        }
      },
      insert: (...args: unknown[]) => {
        mockDbInsert(...args)
        return {
          values: (...vArgs: unknown[]) => {
            mockDbValues(...vArgs)
            return {
              returning: () => {
                return (mockDbReturning as unknown as Record<string, unknown>)._returnValue ?? []
              },
            }
          },
        }
      },
    },
  }
})

vi.mock('../../../config/env', () => ({
  env: {
    EXPO_ACCESS_TOKEN: 'test-expo-token',
  },
}))

vi.mock('../../../database/schema/index', () => ({
  pushTokens: { token: 'token', userId: 'userId' },
  notifications: {},
  users: { id: 'id' },
}))

vi.mock('../../../realtime/sse', () => ({
  sendSSE: (...args: unknown[]) => mockSendSSE(...args),
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ _type: 'eq', args })),
  inArray: vi.fn((...args: unknown[]) => ({ _type: 'inArray', args })),
}))

import { createNotification, sendToUsers } from '../push.service'

describe('push.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = []
    ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = []
    ;(mockDbFrom as unknown as Record<string, unknown>)._lastReturn = undefined
    mockChunkPushNotifications.mockImplementation((messages: unknown[]) => [messages])
    mockSendPushNotificationsAsync.mockResolvedValue([])
    mockIsExpoPushToken.mockImplementation((token: string) => token.startsWith('ExponentPushToken['))
  })

  describe('createNotification', () => {
    it('should insert a notification record into the database', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', title: 'Hello' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]

      await createNotification('user-1', { title: 'Hello', body: 'World' })

      expect(mockDbInsert).toHaveBeenCalled()
      expect(mockDbValues).toHaveBeenCalledWith({
        userId: 'user-1',
        title: 'Hello',
        body: 'World',
        type: 'general',
        data: null,
      })
    })

    it('should use custom type when provided', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', title: 'Alert' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]

      await createNotification('user-1', { title: 'Alert', type: 'alert' })

      expect(mockDbValues).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'alert' }),
      )
    })

    it('should send SSE event after inserting notification', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', title: 'Hello' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]

      await createNotification('user-1', { title: 'Hello' })

      expect(mockSendSSE).toHaveBeenCalledWith('user-1', 'notification', {
        id: 'notif-1',
        title: 'Hello',
      })
    })

    it('should return the created notification', async () => {
      const notification = { id: 'notif-2', userId: 'user-1', title: 'Test' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]

      const result = await createNotification('user-1', { title: 'Test' })

      expect(result).toEqual(notification)
    })

    it('should skip push when user has no tokens', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', title: 'Hi' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = []

      await createNotification('user-1', { title: 'Hi' })

      expect(mockSendPushNotificationsAsync).not.toHaveBeenCalled()
    })

    it('should send push notification when user has valid tokens', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', title: 'Hi' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = [
        { token: 'ExponentPushToken[abc123]' },
      ]

      await createNotification('user-1', { title: 'Hi', body: 'There' })

      expect(mockChunkPushNotifications).toHaveBeenCalled()
      expect(mockSendPushNotificationsAsync).toHaveBeenCalled()
    })

    it('should filter out invalid push tokens', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', title: 'Hi' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = [
        { token: 'invalid-token' },
        { token: 'ExponentPushToken[valid]' },
      ]

      await createNotification('user-1', { title: 'Hi' })

      const chunkedMessages = mockChunkPushNotifications.mock.calls[0][0]
      expect(chunkedMessages).toHaveLength(1)
      expect(chunkedMessages[0].to).toBe('ExponentPushToken[valid]')
    })

    it('should skip push when all tokens are invalid', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', title: 'Hi' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = [
        { token: 'bad-token-1' },
        { token: 'bad-token-2' },
      ]

      await createNotification('user-1', { title: 'Hi' })

      expect(mockSendPushNotificationsAsync).not.toHaveBeenCalled()
    })

    it('should include sound default in push message', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', title: 'Hi' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = [
        { token: 'ExponentPushToken[abc]' },
      ]

      await createNotification('user-1', { title: 'Hi', body: 'Body', data: { key: 'val' } })

      const chunkedMessages = mockChunkPushNotifications.mock.calls[0][0]
      expect(chunkedMessages[0]).toEqual({
        to: 'ExponentPushToken[abc]',
        title: 'Hi',
        body: 'Body',
        data: { key: 'val' },
        sound: 'default',
      })
    })

    it('should handle push send errors gracefully (console.error)', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', title: 'Hi' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = [
        { token: 'ExponentPushToken[abc]' },
      ]
      mockSendPushNotificationsAsync.mockRejectedValueOnce(new Error('Expo API down'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await createNotification('user-1', { title: 'Hi' })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to send push chunk:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should default body to null and type to general', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', title: 'Minimal' }
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = [notification]

      await createNotification('user-1', { title: 'Minimal' })

      expect(mockDbValues).toHaveBeenCalledWith({
        userId: 'user-1',
        title: 'Minimal',
        body: null,
        type: 'general',
        data: null,
      })
    })
  })

  describe('sendToUsers', () => {
    it('should return zeros when all-users query returns empty', async () => {
      // Empty array falls through to "all users" branch, which queries DB
      // Mock db.select().from(users) to return empty array (no users)
      mockDbFrom.mockImplementationOnce(() => [])

      const result = await sendToUsers([], { title: 'Test' })

      expect(result).toEqual({ sent: 0, failed: 0, total: 0 })
    })

    it('should batch insert notifications for all target users', async () => {
      const inserted = [
        { id: 'n1', userId: 'u1', title: 'News' },
        { id: 'n2', userId: 'u2', title: 'News' },
      ]
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = inserted
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = []

      await sendToUsers(['u1', 'u2'], { title: 'News', body: 'Content' })

      expect(mockDbValues).toHaveBeenCalledWith([
        { userId: 'u1', title: 'News', body: 'Content', type: 'general', data: null },
        { userId: 'u2', title: 'News', body: 'Content', type: 'general', data: null },
      ])
    })

    it('should emit SSE events for each inserted notification', async () => {
      const inserted = [
        { id: 'n1', userId: 'u1', title: 'News' },
        { id: 'n2', userId: 'u2', title: 'News' },
      ]
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = inserted
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = []

      await sendToUsers(['u1', 'u2'], { title: 'News' })

      expect(mockSendSSE).toHaveBeenCalledTimes(2)
      expect(mockSendSSE).toHaveBeenCalledWith('u1', 'notification', { id: 'n1', title: 'News' })
      expect(mockSendSSE).toHaveBeenCalledWith('u2', 'notification', { id: 'n2', title: 'News' })
    })

    it('should return correct sent count', async () => {
      const inserted = [{ id: 'n1', userId: 'u1', title: 'Test' }]
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = inserted
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = []

      const result = await sendToUsers(['u1'], { title: 'Test' })

      expect(result).toEqual({ sent: 1, failed: 0, total: 1 })
    })

    it('should send push notifications for valid tokens across users', async () => {
      const inserted = [{ id: 'n1', userId: 'u1', title: 'Test' }]
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = inserted
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = [
        { token: 'ExponentPushToken[device1]' },
        { token: 'ExponentPushToken[device2]' },
      ]

      await sendToUsers(['u1'], { title: 'Test', body: 'Body' })

      expect(mockChunkPushNotifications).toHaveBeenCalled()
      expect(mockSendPushNotificationsAsync).toHaveBeenCalled()
      const messages = mockChunkPushNotifications.mock.calls[0][0]
      expect(messages).toHaveLength(2)
    })

    it('should skip push when no tokens exist for target users', async () => {
      const inserted = [{ id: 'n1', userId: 'u1', title: 'Test' }]
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = inserted
      ;(mockDbWhere as unknown as Record<string, unknown>)._returnValue = []

      await sendToUsers(['u1'], { title: 'Test' })

      expect(mockSendPushNotificationsAsync).not.toHaveBeenCalled()
    })

    it('should query all users when userIds is null', async () => {
      const inserted = [{ id: 'n1', userId: 'u1', title: 'Test' }]
      ;(mockDbReturning as unknown as Record<string, unknown>)._returnValue = inserted

      // First from() call: select all users -> returns array [{ id: 'u1' }]
      // Second from() call: select push tokens -> needs .where()
      mockDbFrom
        .mockImplementationOnce(() => [{ id: 'u1' }])
        .mockImplementationOnce(() => ({ where: () => [] }))

      const result = await sendToUsers(null, { title: 'Test' })

      expect(result).toEqual({ sent: 1, failed: 0, total: 1 })
    })
  })
})
