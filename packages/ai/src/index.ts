export type AIProvider = 'gemini' | 'openai'

export interface AIProviderConfig {
  key: AIProvider
  label: string
  color: string
  envKeys: string[]
  hintKey: string
  hintUrl: string
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    key: 'gemini',
    label: 'Google Gemini',
    color: '#4285F4',
    envKeys: ['GEMINI_API_KEY', 'GEMINI_MODEL', 'GEMINI_CONCURRENT_LIMIT'],
    hintKey: 'admin.hintGemini',
    hintUrl: 'https://aistudio.google.com/apikey',
  },
  {
    key: 'openai',
    label: 'OpenAI',
    color: '#10A37F',
    envKeys: ['OPENAI_API_KEY', 'OPENAI_MODEL', 'OPENAI_MAX_TOKENS'],
    hintKey: 'admin.hintOpenai',
    hintUrl: 'https://platform.openai.com/api-keys',
  },
]

export const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash', labelKey: 'admin.geminiModelFlash' },
  { value: 'gemini-2.5-pro', labelKey: 'admin.geminiModelPro' },
  { value: 'gemini-3-pro-image-preview', labelKey: 'admin.geminiModel3ProImage' },
  { value: 'gemini-2.0-flash', labelKey: 'admin.geminiModelLegacy' },
] as const

export const OPENAI_MODELS = [
  { value: 'gpt-4o', labelKey: 'admin.openaiModel4o' },
  { value: 'gpt-4o-mini', labelKey: 'admin.openaiModel4oMini' },
  { value: 'o3-mini', labelKey: 'admin.openaiModelO3Mini' },
] as const
