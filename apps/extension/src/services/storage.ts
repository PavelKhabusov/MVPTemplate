export async function getItem<T = string>(key: string): Promise<T | null> {
  const result = await chrome.storage.local.get(key)
  return (result[key] as T) ?? null
}

export async function setItem(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
}

export async function removeItem(key: string): Promise<void> {
  await chrome.storage.local.remove(key)
}

export async function getMultiple(keys: string[]): Promise<Record<string, unknown>> {
  return chrome.storage.local.get(keys)
}
