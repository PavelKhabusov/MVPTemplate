/**
 * Feature flags abstraction.
 * Priority: local (env-based) > remote (PostHog) > default value.
 */

import { analytics } from './analytics'

type FlagValue = boolean | string | number

const localFlags: Record<string, FlagValue> = {}
const remoteFlags: Record<string, FlagValue> = {}

export const featureFlags = {
  setLocalFlag(key: string, value: FlagValue) {
    localFlags[key] = value
  },

  setRemoteFlags(flags: Record<string, FlagValue>) {
    Object.assign(remoteFlags, flags)
  },

  isEnabled(key: string, defaultValue = false): boolean {
    // Local flags take precedence
    if (key in localFlags) return !!localFlags[key]
    if (key in remoteFlags) return !!remoteFlags[key]
    // Try PostHog remote flags
    const phValue = analytics.isFeatureEnabled(key)
    if (phValue !== undefined) return phValue
    return defaultValue
  },

  getValue<T extends FlagValue>(key: string, defaultValue: T): T {
    if (key in localFlags) return localFlags[key] as T
    if (key in remoteFlags) return remoteFlags[key] as T
    return defaultValue
  },

  getAllFlags(): Record<string, FlagValue> {
    return { ...remoteFlags, ...localFlags }
  },
}
