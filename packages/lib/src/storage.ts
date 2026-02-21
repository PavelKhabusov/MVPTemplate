import { Platform } from 'react-native'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { StateStorage } from 'zustand/middleware'

let mmkvInstance: any = null
let mmkvChecked = false

function getMMKV() {
  if (mmkvInstance) return mmkvInstance
  if (mmkvChecked) return null
  mmkvChecked = true

  // MMKV uses NitroModules which aren't available in Expo Go — skip entirely
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  if (Platform.OS !== 'web' && !isExpoGo) {
    try {
      const { MMKV } = require('react-native-mmkv')
      mmkvInstance = new MMKV({ id: 'mvp-app-storage' })
    } catch {
      // MMKV not available — fall through to null
    }
  }
  return mmkvInstance
}

/** Safe localStorage access — returns null on native where it doesn't exist */
function getLocalStorage(): Storage | null {
  if (typeof localStorage !== 'undefined') return localStorage
  return null
}

/**
 * Get AsyncStorage for native fallback (Expo Go).
 * Returns null on web or if the package is unavailable.
 */
let asyncStorageInstance: any = null
let asyncStorageChecked = false

function getAsyncStorage(): any {
  if (asyncStorageInstance) return asyncStorageInstance
  if (asyncStorageChecked) return null
  asyncStorageChecked = true

  if (Platform.OS !== 'web') {
    try {
      asyncStorageInstance = require('@react-native-async-storage/async-storage').default
    } catch {
      // Not available
    }
  }
  return asyncStorageInstance
}

/**
 * Zustand-compatible StateStorage adapter.
 * - Native (dev build): backed by MMKV (synchronous, 10x faster than AsyncStorage)
 * - Native (Expo Go): backed by AsyncStorage (async, persists to disk)
 * - Web: backed by localStorage
 * - Fallback: in-memory (if nothing else is available)
 */
const memoryStore = new Map<string, string>()

export const mmkvStorage: StateStorage = {
  getItem: (name: string) => {
    const mmkv = getMMKV()
    if (mmkv) return mmkv.getString(name) ?? null
    const ls = getLocalStorage()
    if (ls) return ls.getItem(name)
    const asyncStorage = getAsyncStorage()
    if (asyncStorage) return asyncStorage.getItem(name) // returns Promise<string | null>
    return memoryStore.get(name) ?? null
  },
  setItem: (name: string, value: string) => {
    const mmkv = getMMKV()
    if (mmkv) { mmkv.set(name, value); return }
    const ls = getLocalStorage()
    if (ls) { ls.setItem(name, value); return }
    const asyncStorage = getAsyncStorage()
    if (asyncStorage) { asyncStorage.setItem(name, value); return }
    memoryStore.set(name, value)
  },
  removeItem: (name: string) => {
    const mmkv = getMMKV()
    if (mmkv) { mmkv.delete(name); return }
    const ls = getLocalStorage()
    if (ls) { ls.removeItem(name); return }
    const asyncStorage = getAsyncStorage()
    if (asyncStorage) { asyncStorage.removeItem(name); return }
    memoryStore.delete(name)
  },
}

/**
 * Direct key-value access for non-Zustand usage.
 */
export const storage = {
  getString(key: string): string | undefined {
    const mmkv = getMMKV()
    if (mmkv) return mmkv.getString(key)
    const ls = getLocalStorage()
    if (ls) return ls.getItem(key) ?? undefined
    return memoryStore.get(key)
  },
  set(key: string, value: string): void {
    const mmkv = getMMKV()
    if (mmkv) { mmkv.set(key, value); return }
    const ls = getLocalStorage()
    if (ls) { ls.setItem(key, value); return }
    const asyncStorage = getAsyncStorage()
    if (asyncStorage) { asyncStorage.setItem(key, value); return }
    memoryStore.set(key, value)
  },
  delete(key: string): void {
    const mmkv = getMMKV()
    if (mmkv) { mmkv.delete(key); return }
    const ls = getLocalStorage()
    if (ls) { ls.removeItem(key); return }
    const asyncStorage = getAsyncStorage()
    if (asyncStorage) { asyncStorage.removeItem(key); return }
    memoryStore.delete(key)
  },
}
