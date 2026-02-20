import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { storage } from './storage'

const WEB_PREFIX = '__secure_'

/**
 * Secure storage wrapper.
 * - iOS/Android: uses expo-secure-store (Keychain / Keystore)
 * - Web: falls back to localStorage (no secure enclave available)
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return storage.getString(WEB_PREFIX + key) ?? null
    }
    return SecureStore.getItemAsync(key)
  },

  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      storage.set(WEB_PREFIX + key, value)
      return
    }
    await SecureStore.setItemAsync(key, value)
  },

  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      storage.delete(WEB_PREFIX + key)
      return
    }
    await SecureStore.deleteItemAsync(key)
  },
}
