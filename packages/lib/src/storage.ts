import { Platform } from 'react-native'
import { StateStorage } from 'zustand/middleware'

let mmkvInstance: any = null

function getMMKV() {
  if (mmkvInstance) return mmkvInstance
  if (Platform.OS !== 'web') {
    const { MMKV } = require('react-native-mmkv')
    mmkvInstance = new MMKV({ id: 'mvp-app-storage' })
  }
  return mmkvInstance
}

/**
 * Zustand-compatible StateStorage adapter.
 * - Native: backed by MMKV (synchronous, 10x faster than AsyncStorage)
 * - Web: backed by localStorage
 */
export const mmkvStorage: StateStorage = {
  getItem: (name: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name)
    }
    return getMMKV().getString(name) ?? null
  },
  setItem: (name: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value)
      return
    }
    getMMKV().set(name, value)
  },
  removeItem: (name: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name)
      return
    }
    getMMKV().delete(name)
  },
}

/**
 * Direct key-value access for non-Zustand usage.
 */
export const storage = {
  getString(key: string): string | undefined {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key) ?? undefined
    }
    return getMMKV().getString(key)
  },
  set(key: string, value: string): void {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value)
      return
    }
    getMMKV().set(key, value)
  },
  delete(key: string): void {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key)
      return
    }
    getMMKV().delete(key)
  },
}
