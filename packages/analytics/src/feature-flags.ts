/**
 * Feature flags abstraction.
 * Supports local (env-based) and remote (PostHog) flags.
 */

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
