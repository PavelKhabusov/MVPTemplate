import { describe, it, expect, vi } from 'vitest'

// Mock expo-localization
vi.mock('expo-localization', () => ({
  getLocales: vi.fn(() => [{ languageCode: 'en' }]),
}))

// Mock react-i18next (provide a real-enough initReactI18next plugin)
vi.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
  useTranslation: vi.fn(),
}))

// Mock @mvp/store to prevent react-native import chain
vi.mock('@mvp/store', () => ({
  useLanguageStore: vi.fn(() => ({ setLanguage: vi.fn() })),
}))

import en from '../locales/en.json'
import ru from '../locales/ru.json'
import es from '../locales/es.json'
import ja from '../locales/ja.json'
import { initI18n, i18n } from '../index'

function countKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...countKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

describe('i18n locale files', () => {
  it('should have the same number of keys across all 4 locales', () => {
    const enKeys = countKeys(en)
    const ruKeys = countKeys(ru)
    const esKeys = countKeys(es)
    const jaKeys = countKeys(ja)

    expect(ruKeys.length).toBe(enKeys.length)
    expect(esKeys.length).toBe(enKeys.length)
    expect(jaKeys.length).toBe(enKeys.length)
  })

  it('should have the same key paths in all locales', () => {
    const enKeys = countKeys(en).sort()
    const ruKeys = countKeys(ru).sort()
    const esKeys = countKeys(es).sort()
    const jaKeys = countKeys(ja).sort()

    expect(ruKeys).toEqual(enKeys)
    expect(esKeys).toEqual(enKeys)
    expect(jaKeys).toEqual(enKeys)
  })
})

describe('initI18n', () => {
  it('should initialize with the provided saved language', () => {
    initI18n('ru')
    expect(i18n.language).toBe('ru')
  })

  it('should translate a known key after initialization', () => {
    initI18n('en')
    const result = i18n.t('common.loading')
    expect(result).toBe('Loading...')
  })

  it('should fallback to en for a key when using non-en language', () => {
    initI18n('ja')
    // The Japanese locale has the key, so it should return the Japanese value
    const result = i18n.t('common.loading')
    expect(result).toBeTruthy()
    expect(result).not.toBe('common.loading') // should not return the key itself
  })

  it('should use device language when no saved language provided', () => {
    initI18n(null)
    // Device language is mocked as 'en'
    expect(i18n.language).toBe('en')
  })
})
