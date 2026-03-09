import { APP_BRAND } from '@mvp/template-config'

/**
 * Runtime app configuration.
 * Product name and branding come from APP_BRAND
 * (packages/template-config/src/brand.ts) — change it there when forking.
 */

export const APP_CONFIG = {
  name: APP_BRAND.name,
  version: '1.0.0',
  developer: 'Pavel Khabusov',
  year: '2026',

  // API
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  apiTimeout: 15000,

  // Cache
  queryStaleTime: 5 * 60 * 1000, // 5 minutes
  queryGcTime: 30 * 60 * 1000, // 30 minutes

  // Pagination
  defaultPageSize: 20,
  maxPageSize: 50,

  // Search
  searchMinLength: 2,
  searchDebounceMs: 300,
  maxRecentSearches: 10,

  // Push notifications
  pushChannelId: 'default',

  // SSE
  sseHeartbeatInterval: 30000,
  sseReconnectDelay: 3000,

  // Auth
  tokenRefreshBuffer: 60 * 1000, // Refresh 1 min before expiry
} as const
