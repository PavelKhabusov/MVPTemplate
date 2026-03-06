import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView, useWindowDimensions, Linking } from 'react-native'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppCard, AppSwitch, FadeIn, ScalePress, useToast } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import {
  useTemplateConfigStore,
  TEMPLATE_FLAGS,
  applyColorScheme,
  applyCustomColor,
} from '@mvp/template-config'
import { api } from '../services/api'

interface EnvEntry { value: string | null; type: string }
type EnvData = Record<string, Record<string, EnvEntry>>

const ENV_GROUP_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; labelKey: string; mainToggle?: string; hintKey?: string; hintUrl?: string }> = {
  analytics: { icon: 'bar-chart-outline', labelKey: 'admin.apiAnalytics', mainToggle: 'ANALYTICS_ENABLED', hintKey: 'admin.hintPosthog', hintUrl: 'https://app.posthog.com/project/settings' },
  email: { icon: 'mail-outline', labelKey: 'admin.apiEmail', mainToggle: 'EMAIL_ENABLED' },
  auth: { icon: 'logo-google', labelKey: 'admin.apiAuth', mainToggle: 'GOOGLE_CLIENT_ID', hintKey: 'admin.hintGoogle', hintUrl: 'https://console.cloud.google.com/apis/credentials' },
  sms: { icon: 'chatbubble-ellipses-outline', labelKey: 'admin.apiSMS', mainToggle: 'SMS_ENABLED' },
  pushNotifications: { icon: 'notifications-outline', labelKey: 'admin.apiPush', mainToggle: 'EXPO_ACCESS_TOKEN', hintKey: 'admin.hintExpo', hintUrl: 'https://expo.dev/settings/access-tokens' },
  payments: { icon: 'card-outline', labelKey: 'admin.apiPayments', mainToggle: 'PAYMENTS_ENABLED' },
  ai: { icon: 'sparkles-outline', labelKey: 'admin.apiAI', mainToggle: 'GEMINI_API_KEY' },
}

const PAYMENT_PROVIDERS = [
  { key: 'stripe',    label: 'Stripe',    color: '#635BFF', enabledKey: 'STRIPE_ENABLED',    keys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],                                 hintKey: 'admin.hintStripe',    hintUrl: 'https://dashboard.stripe.com/apikeys' },
  { key: 'paypal',   label: 'PayPal',    color: '#003087', enabledKey: 'PAYPAL_ENABLED',     keys: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID'],               hintKey: 'admin.hintPaypal',    hintUrl: 'https://developer.paypal.com/dashboard/' },
  { key: 'yookassa', label: 'YooKassa',  color: '#0077FF', enabledKey: 'YOOKASSA_ENABLED',   keys: ['YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET_KEY', 'YOOKASSA_WEBHOOK_SECRET'],          hintKey: 'admin.hintYookassa',  hintUrl: 'https://yookassa.ru/my/merchant/integration' },
  { key: 'robokassa', label: 'Robokassa', color: '#E5392B', enabledKey: 'ROBOKASSA_ENABLED',  keys: ['ROBOKASSA_MERCHANT_LOGIN', 'ROBOKASSA_PASSWORD1', 'ROBOKASSA_PASSWORD2'],      hintKey: 'admin.hintRobokassa', hintUrl: 'https://partner.robokassa.ru/' },
  { key: 'polar',    label: 'Polar',     color: '#0062FF', enabledKey: 'POLAR_ENABLED',      keys: ['POLAR_ACCESS_TOKEN', 'POLAR_WEBHOOK_SECRET', 'POLAR_ORGANIZATION_ID'],         hintKey: 'admin.hintPolar',     hintUrl: 'https://dashboard.polar.sh/' },
] as const

const SMS_PROVIDERS = [
  { key: 'twilio' as const, label: 'Twilio', color: '#F22F46', keys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'], hintKey: 'admin.hintTwilio', hintUrl: 'https://console.twilio.com/' },
  { key: 'smsc' as const, label: 'SMSC.ru', color: '#0078D4', keys: ['SMSC_LOGIN', 'SMSC_PASSWORD', 'SMSC_SENDER'], hintKey: 'admin.hintSmsc', hintUrl: 'https://smsc.ru/api/' },
] as const

const AI_PROVIDERS_UI = [
  { key: 'gemini' as const, label: 'Google Gemini', color: '#4285F4', apiKeyEnv: 'GEMINI_API_KEY', modelEnv: 'GEMINI_MODEL', limitEnv: 'GEMINI_CONCURRENT_LIMIT', limitLabel: 'admin.geminiConcurrentLimit', limitDesc: 'admin.geminiConcurrentLimitDesc', limitDefault: '3', limitMax: 10, hintKey: 'admin.hintGemini', hintUrl: 'https://aistudio.google.com/apikey', models: [
    { value: 'gemini-2.5-flash', labelKey: 'admin.geminiModelFlash' },
    { value: 'gemini-2.5-pro', labelKey: 'admin.geminiModelPro' },
    { value: 'gemini-3-pro-image-preview', labelKey: 'admin.geminiModel3ProImage' },
    { value: 'gemini-2.0-flash', labelKey: 'admin.geminiModelLegacy' },
  ]},
  { key: 'openai' as const, label: 'OpenAI', color: '#10A37F', apiKeyEnv: 'OPENAI_API_KEY', modelEnv: 'OPENAI_MODEL', limitEnv: 'OPENAI_MAX_TOKENS', limitLabel: 'admin.openaiMaxTokens', limitDesc: 'admin.openaiMaxTokensDesc', limitDefault: '4096', limitMax: 128000, hintKey: 'admin.hintOpenai', hintUrl: 'https://platform.openai.com/api-keys', models: [
    { value: 'gpt-4o', labelKey: 'admin.openaiModel4o' },
    { value: 'gpt-4o-mini', labelKey: 'admin.openaiModel4oMini' },
    { value: 'o3-mini', labelKey: 'admin.openaiModelO3Mini' },
  ]},
] as const

// Map env var names → template flag keys for syncing API Settings ↔ Template Config
const ENV_TO_FLAG: Record<string, string> = {}
for (const flag of TEMPLATE_FLAGS) {
  if (flag.envVar) ENV_TO_FLAG[flag.envVar] = flag.key
}

export function EnvStringField({ envKey, label, value, isSecret, onSave }: {
  envKey: string
  label?: string
  value: string | null
  isSecret: boolean
  onSave: (key: string, value: string | null) => void
}) {
  const theme = useTheme()
  const [localValue, setLocalValue] = useState(value ?? '')
  const [dirty, setDirty] = useState(false)

  const handleChange = (text: string) => {
    setLocalValue(text)
    setDirty(text !== (value ?? ''))
  }

  const handleSave = () => {
    onSave(envKey, localValue || null)
    setDirty(false)
  }

  return (
    <YStack gap="$1.5">
      <Text fontSize="$2" color="$mutedText">{label ?? envKey}</Text>
      <XStack gap="$2" alignItems="center">
        <Input
          flex={1}
          size="$3"
          value={localValue}
          onChangeText={handleChange}
          placeholder={isSecret ? '••••••••' : ''}
          secureTextEntry={isSecret && !localValue}
          backgroundColor="$subtleBackground"
          borderColor="$borderColor"
          color="$color"
        />
        {dirty && (
          <ScalePress onPress={handleSave}>
            <XStack
              backgroundColor="$accent"
              paddingHorizontal="$2.5"
              paddingVertical="$1.5"
              borderRadius="$2"
            >
              <Ionicons name="checkmark" size={18} color="white" />
            </XStack>
          </ScalePress>
        )}
      </XStack>
    </YStack>
  )
}

function PaymentsEnvCard({ keys, isGroupOn, onToggle, onUpdate }: {
  keys: Record<string, EnvEntry>
  isGroupOn: boolean
  onToggle: (checked: boolean) => void
  onUpdate: (key: string, value: string | boolean | null) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [activeProvider, setActiveProvider] = useState<typeof PAYMENT_PROVIDERS[number]['key']>('stripe')

  const testModeEntry = keys['ROBOKASSA_TEST_MODE']
  const paypalModeEntry = keys['PAYPAL_MODE']
  const activeProviderData = PAYMENT_PROVIDERS.find((p) => p.key === activeProvider)!
  const enabledEntry = keys[activeProviderData.enabledKey]
  const isProviderEnabled = enabledEntry ? enabledEntry.value === 'true' : true
  const providerKeys = activeProviderData.keys
    .filter((k) => k in keys)
    .map((k) => [k, keys[k]] as [string, EnvEntry])

  return (
    <AppCard animated={false}>
      <XStack alignItems="center" justifyContent="space-between" marginBottom={isGroupOn ? '$3' : 0}>
        <XStack alignItems="center" gap="$2" flex={1}>
          <Ionicons name="card-outline" size={20} color={isGroupOn ? theme.accent.val : theme.mutedText.val} />
          <Text fontWeight="600" color="$color" fontSize="$4">
            {t('admin.apiPayments')}
          </Text>
        </XStack>
        <AppSwitch checked={isGroupOn} onCheckedChange={onToggle} />
      </XStack>

      {isGroupOn && (
        <YStack gap="$3">
          {/* Provider tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              {PAYMENT_PROVIDERS.map((provider) => {
                const isActive = activeProvider === provider.key
                const providerEnabledEntry = keys[provider.enabledKey]
                const isEnabled = providerEnabledEntry ? providerEnabledEntry.value === 'true' : true
                return (
                  <ScalePress key={provider.key} onPress={() => setActiveProvider(provider.key)}>
                    <XStack
                      backgroundColor={isActive ? provider.color : '$subtleBackground'}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={isActive ? provider.color : '$borderColor'}
                      gap="$2"
                      alignItems="center"
                    >
                      <Text
                        color={isActive ? 'white' : '$color'}
                        fontWeight="700"
                        fontSize="$2"
                      >
                        {provider.label}
                      </Text>
                      {providerEnabledEntry && (
                        <AppSwitch
                          checked={isEnabled}
                          onCheckedChange={(checked) => onUpdate(provider.enabledKey, String(checked))}
                          size="sm"
                        />
                      )}
                    </XStack>
                  </ScalePress>
                )
              })}
            </XStack>
          </ScrollView>

          {/* Provider env fields */}
          {providerKeys.map(([key, entry]) => (
            <EnvStringField
              key={key}
              envKey={key}
              label={t(`admin.envLabel_${key}`, { defaultValue: key })}
              value={entry.value}
              isSecret={entry.type === 'secret'}
              onSave={onUpdate}
            />
          ))}

          {/* Provider dashboard link */}
          <ScalePress onPress={() => Linking.openURL(activeProviderData.hintUrl)}>
            <Text fontSize="$2" color="$accent">
              {t(activeProviderData.hintKey)}
            </Text>
          </ScalePress>

          {/* Robokassa test mode toggle */}
          {activeProvider === 'robokassa' && testModeEntry && (
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize="$3" color="$color" flex={1} numberOfLines={1}>
                {t('admin.envLabel_ROBOKASSA_TEST_MODE')}
              </Text>
              <AppSwitch
                checked={testModeEntry.value === 'true'}
                onCheckedChange={(checked) => onUpdate('ROBOKASSA_TEST_MODE', String(checked))}
              />
            </XStack>
          )}

          {/* PayPal sandbox/live mode toggle */}
          {activeProvider === 'paypal' && paypalModeEntry && (
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize="$3" color="$color" flex={1} numberOfLines={1}>
                {t('admin.paypalSandbox')}
              </Text>
              <AppSwitch
                checked={paypalModeEntry.value !== 'live'}
                onCheckedChange={(checked) => onUpdate('PAYPAL_MODE', checked ? 'sandbox' : 'live')}
              />
            </XStack>
          )}
        </YStack>
      )}
    </AppCard>
  )
}

function SMSEnvCard({ keys, isGroupOn, onToggle, onUpdate }: {
  keys: Record<string, EnvEntry>
  isGroupOn: boolean
  onToggle: (checked: boolean) => void
  onUpdate: (key: string, value: string | boolean | null) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [activeProvider, setActiveProvider] = useState<'twilio' | 'smsc'>('twilio')

  const providerData = SMS_PROVIDERS.find((p) => p.key === activeProvider)!
  const currentProviderKey = keys['SMS_PROVIDER']?.value ?? 'twilio'
  const providerKeys = providerData.keys
    .filter((k) => k in keys)
    .map((k) => [k, keys[k]] as [string, EnvEntry])

  return (
    <AppCard animated={false}>
      <XStack alignItems="center" justifyContent="space-between" marginBottom={isGroupOn ? '$3' : 0}>
        <XStack alignItems="center" gap="$2" flex={1}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={isGroupOn ? theme.accent.val : theme.mutedText.val} />
          <Text fontWeight="600" color="$color" fontSize="$4">
            {t('admin.apiSMS')}
          </Text>
        </XStack>
        <AppSwitch checked={isGroupOn} onCheckedChange={onToggle} />
      </XStack>

      {isGroupOn && (
        <YStack gap="$3">
          {/* SMS verification required toggle */}
          <XStack alignItems="center" justifyContent="space-between" backgroundColor="$subtleBackground" paddingHorizontal="$3" paddingVertical="$2.5" borderRadius="$3">
            <YStack flex={1}>
              <Text fontSize="$3" color="$color">{t('admin.smsVerificationRequired')}</Text>
              <Text fontSize="$1" color="$mutedText">{t('admin.smsVerificationRequiredDesc')}</Text>
            </YStack>
            <AppSwitch
              checked={keys['SMS_VERIFICATION_REQUIRED']?.value === 'true'}
              onCheckedChange={(checked) => onUpdate('SMS_VERIFICATION_REQUIRED', String(checked))}
            />
          </XStack>

          {/* Provider tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              {SMS_PROVIDERS.map((provider) => {
                const isActive = activeProvider === provider.key
                const isSelected = currentProviderKey === provider.key
                return (
                  <ScalePress key={provider.key} onPress={() => setActiveProvider(provider.key)}>
                    <XStack
                      backgroundColor={isActive ? provider.color : '$subtleBackground'}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={isActive ? provider.color : '$borderColor'}
                      gap="$2"
                      alignItems="center"
                    >
                      <Text color={isActive ? 'white' : '$color'} fontWeight="700" fontSize="$2">
                        {provider.label}
                      </Text>
                      {isSelected && (
                        <XStack backgroundColor={isActive ? 'rgba(255,255,255,0.25)' : provider.color} paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$1">
                          <Text fontSize="$1" color="white" fontWeight="600">{t('admin.smsActive')}</Text>
                        </XStack>
                      )}
                    </XStack>
                  </ScalePress>
                )
              })}
            </XStack>
          </ScrollView>

          {/* Set as active provider button */}
          {currentProviderKey !== activeProvider && (
            <ScalePress onPress={() => onUpdate('SMS_PROVIDER', activeProvider)}>
              <XStack backgroundColor="$accentBackground" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" borderWidth={1} borderColor="$accent" justifyContent="center">
                <Text fontSize="$2" color="$accent" fontWeight="600">
                  {t('admin.smsSetActive', { provider: providerData.label })}
                </Text>
              </XStack>
            </ScalePress>
          )}

          {/* Provider credentials */}
          {providerKeys.map(([key, entry]) => (
            <EnvStringField
              key={key}
              envKey={key}
              label={t(`admin.envLabel_${key}`, { defaultValue: key })}
              value={entry.value}
              isSecret={entry.type === 'secret'}
              onSave={onUpdate}
            />
          ))}

          {/* Provider link */}
          <ScalePress onPress={() => Linking.openURL(providerData.hintUrl)}>
            <Text fontSize="$2" color="$accent">
              {t(providerData.hintKey)}
            </Text>
          </ScalePress>
        </YStack>
      )}
    </AppCard>
  )
}

function AIEnvCard({ keys, isGroupOn, onToggle, onUpdate }: {
  keys: Record<string, EnvEntry>
  isGroupOn: boolean
  onToggle: (checked: boolean) => void
  onUpdate: (key: string, value: string | boolean | null) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'openai'>('gemini')

  const provider = AI_PROVIDERS_UI.find((p) => p.key === activeProvider)!
  const currentModel = keys[provider.modelEnv]?.value || provider.models[0].value
  const currentLimit = keys[provider.limitEnv]?.value || provider.limitDefault
  const [limitValue, setLimitValue] = useState(currentLimit)
  const [limitDirty, setLimitDirty] = useState(false)

  const handleLimitChange = (text: string) => {
    const num = text.replace(/[^0-9]/g, '')
    setLimitValue(num)
    setLimitDirty(num !== currentLimit)
  }

  const handleLimitSave = () => {
    const num = Math.max(1, Math.min(provider.limitMax, parseInt(limitValue) || parseInt(provider.limitDefault)))
    onUpdate(provider.limitEnv, String(num))
    setLimitValue(String(num))
    setLimitDirty(false)
  }

  // Reset limit input when switching providers
  const handleProviderSwitch = (key: 'gemini' | 'openai') => {
    setActiveProvider(key)
    const p = AI_PROVIDERS_UI.find((pp) => pp.key === key)!
    setLimitValue(keys[p.limitEnv]?.value || p.limitDefault)
    setLimitDirty(false)
  }

  return (
    <AppCard animated={false}>
      <XStack alignItems="center" justifyContent="space-between" marginBottom={isGroupOn ? '$3' : 0}>
        <XStack alignItems="center" gap="$2" flex={1}>
          <Ionicons name="sparkles-outline" size={20} color={isGroupOn ? theme.accent.val : theme.mutedText.val} />
          <Text fontWeight="600" color="$color" fontSize="$4">
            {t('admin.apiAI')}
          </Text>
        </XStack>
        <AppSwitch checked={isGroupOn} onCheckedChange={onToggle} />
      </XStack>

      {isGroupOn && (
        <YStack gap="$3">
          {/* Provider tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              {AI_PROVIDERS_UI.map((p) => {
                const isActive = activeProvider === p.key
                return (
                  <ScalePress key={p.key} onPress={() => handleProviderSwitch(p.key)}>
                    <XStack
                      backgroundColor={isActive ? p.color : '$subtleBackground'}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={isActive ? p.color : '$borderColor'}
                      gap="$1.5"
                      alignItems="center"
                    >
                      <YStack width={8} height={8} borderRadius={4} backgroundColor={isActive ? 'white' : p.color} />
                      <Text color={isActive ? 'white' : '$color'} fontWeight="700" fontSize="$2">
                        {p.label}
                      </Text>
                    </XStack>
                  </ScalePress>
                )
              })}
            </XStack>
          </ScrollView>

          {/* Proxy toggle for AI requests */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            backgroundColor="$subtleBackground"
            paddingHorizontal="$3"
            paddingVertical="$2.5"
            borderRadius="$3"
          >
            <XStack alignItems="center" gap="$2" flex={1}>
              <Ionicons name="globe-outline" size={18} color={theme.mutedText.val} />
              <YStack flex={1}>
                <Text fontSize="$3" color="$color">{t('admin.aiProxyEnabled')}</Text>
                <Text fontSize="$1" color="$mutedText">{t('admin.aiProxyEnabledDesc')}</Text>
              </YStack>
            </XStack>
            <AppSwitch
              checked={keys['AI_PROXY_ENABLED']?.value === 'true'}
              onCheckedChange={(checked) => onUpdate('AI_PROXY_ENABLED', String(checked))}
            />
          </XStack>

          {/* API key */}
          <EnvStringField
            envKey={provider.apiKeyEnv}
            label={t(`admin.envLabel_${provider.apiKeyEnv}`, { defaultValue: `${provider.label} API Key` })}
            value={keys[provider.apiKeyEnv]?.value ?? null}
            isSecret
            onSave={onUpdate}
          />

          <ScalePress onPress={() => Linking.openURL(provider.hintUrl)}>
            <Text fontSize="$2" color="$accent">
              {t(provider.hintKey)}
            </Text>
          </ScalePress>

          {/* Model selection */}
          <YStack gap="$2">
            <Text fontSize="$2" color="$mutedText" fontWeight="600">
              {t('admin.geminiModel')}
            </Text>
            {provider.models.map((model) => {
              const isActive = currentModel === model.value
              return (
                <ScalePress key={model.value} onPress={() => onUpdate(provider.modelEnv, model.value)}>
                  <XStack
                    padding="$2.5"
                    borderRadius="$3"
                    borderWidth={1.5}
                    borderColor={isActive ? '$accent' : '$borderColor'}
                    backgroundColor={isActive ? '$accentBackground' : '$subtleBackground'}
                    alignItems="center"
                    gap="$2"
                  >
                    <YStack width={18} height={18} borderRadius={9} borderWidth={2} borderColor={isActive ? '$accent' : '$mutedText'} alignItems="center" justifyContent="center">
                      {isActive && <YStack width={10} height={10} borderRadius={5} backgroundColor="$accent" />}
                    </YStack>
                    <YStack flex={1}>
                      <Text fontSize="$3" color="$color" fontWeight={isActive ? '600' : '400'}>{t(model.labelKey)}</Text>
                      <Text fontSize="$1" color="$mutedText">{model.value}</Text>
                    </YStack>
                  </XStack>
                </ScalePress>
              )
            })}
          </YStack>

          {/* Limit input */}
          <YStack gap="$1.5">
            <Text fontSize="$2" color="$mutedText" fontWeight="600">{t(provider.limitLabel)}</Text>
            <Text fontSize="$1" color="$mutedText">{t(provider.limitDesc)}</Text>
            <XStack gap="$2" alignItems="center">
              <Input flex={1} size="$3" value={limitValue} onChangeText={handleLimitChange} keyboardType="number-pad" placeholder={provider.limitDefault} backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" />
              {limitDirty && (
                <ScalePress onPress={handleLimitSave}>
                  <XStack backgroundColor="$accent" paddingHorizontal="$2.5" paddingVertical="$1.5" borderRadius="$2">
                    <Ionicons name="checkmark" size={18} color="white" />
                  </XStack>
                </ScalePress>
              )}
            </XStack>
          </YStack>
        </YStack>
      )}
    </AppCard>
  )
}

export function ApiSettingsTab() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const { width: screenWidth } = useWindowDimensions()
  const isWide = screenWidth > 768
  const setFlag = useTemplateConfigStore((s) => s.setFlag)
  const setColorScheme = useTemplateConfigStore((s) => s.setColorScheme)
  const setCustomColor = useTemplateConfigStore((s) => s.setCustomColor)
  const [envData, setEnvData] = useState<EnvData | null>(null)
  const [loading, setLoading] = useState(true)

  const syncFlagsFromEnv = useCallback((data: EnvData) => {
    for (const [, keys] of Object.entries(data)) {
      for (const [envKey, entry] of Object.entries(keys)) {
        // Sync color scheme
        if (envKey === 'EXPO_PUBLIC_COLOR_SCHEME' && entry.value) {
          setColorScheme(entry.value)
          applyColorScheme(entry.value)
          continue
        }
        // Sync custom color
        if (envKey === 'EXPO_PUBLIC_CUSTOM_COLOR' && entry.value) {
          setCustomColor(entry.value)
          applyCustomColor(entry.value)
          continue
        }
        const flagKey = ENV_TO_FLAG[envKey]
        if (!flagKey) continue
        const flag = TEMPLATE_FLAGS.find((f) => f.key === flagKey)
        if (!flag) continue
        const isOn = flag.envType === 'boolean'
          ? entry.value === 'true'
          : entry.value !== null && entry.value !== ''
        setFlag(flagKey, isOn)
      }
    }
  }, [setFlag, setColorScheme, setCustomColor])

  const fetchEnv = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/env')
      const data = res.data.data
      setEnvData(data)
      syncFlagsFromEnv(data)
    } catch {
      // silent — initial load error
    } finally {
      setLoading(false)
    }
  }, [syncFlagsFromEnv])

  useEffect(() => {
    fetchEnv()
  }, [fetchEnv])

  const handleUpdate = useCallback(async (key: string, value: string | boolean | null) => {
    try {
      const res = await api.patch('/admin/env', { [key]: value })
      setEnvData(res.data.data)
      toast.success(t('admin.envSaved'))

      // Sync with Template Config store
      if (key === 'EXPO_PUBLIC_COLOR_SCHEME') {
        if (typeof value === 'string' && value) {
          setColorScheme(value)
          applyColorScheme(value)
        }
      } else if (key === 'EXPO_PUBLIC_CUSTOM_COLOR') {
        if (typeof value === 'string' && value) {
          setCustomColor(value)
          applyCustomColor(value)
        }
      } else {
        const flagKey = ENV_TO_FLAG[key]
        if (flagKey) {
          const flag = TEMPLATE_FLAGS.find((f) => f.key === flagKey)
          if (flag) {
            const isOn = flag.envType === 'boolean'
              ? value === 'true' || value === true
              : value !== null && value !== '' && value !== false
            setFlag(flagKey, isOn)
          }
        }
      }
    } catch {
      toast.error(t('admin.envSaveError'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, setFlag, setColorScheme, setCustomColor])

  if (loading || !envData) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text color="$mutedText">{t('common.loading')}</Text>
      </YStack>
    )
  }

  const renderEnvCard = (group: string, keys: Record<string, { value: string | null; type: string }>) => {
    const meta = ENV_GROUP_META[group]
    if (!meta) return null

    const mainKey = meta.mainToggle
    const mainEntry = mainKey ? keys[mainKey] : undefined
    const isGroupOn = mainEntry
      ? mainEntry.type === 'boolean'
        ? mainEntry.value === 'true'
        : mainEntry.value !== null && mainEntry.value !== ''
      : true

    const handleMainToggle = (checked: boolean) => {
      if (!mainKey || !mainEntry) return
      if (mainEntry.type === 'boolean') {
        handleUpdate(mainKey, String(checked))
      } else {
        handleUpdate(mainKey, checked ? '__TOGGLE_ON__' : null)
      }
    }

    if (group === 'sms') {
      return (
        <SMSEnvCard
          key={group}
          keys={keys}
          isGroupOn={isGroupOn}
          onToggle={handleMainToggle}
          onUpdate={handleUpdate}
        />
      )
    }

    if (group === 'payments') {
      return (
        <PaymentsEnvCard
          key={group}
          keys={keys}
          isGroupOn={isGroupOn}
          onToggle={handleMainToggle}
          onUpdate={handleUpdate}
        />
      )
    }

    if (group === 'ai') {
      return (
        <AIEnvCard
          key={group}
          keys={keys}
          isGroupOn={isGroupOn}
          onToggle={handleMainToggle}
          onUpdate={handleUpdate}
        />
      )
    }

    const subKeys = Object.entries(keys).filter(([key]) => key !== mainKey)

    return (
      <AppCard key={group} animated={false}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom={subKeys.length > 0 && isGroupOn ? '$3' : 0}>
          <XStack alignItems="center" gap="$2" flex={1}>
            <Ionicons name={meta.icon} size={20} color={isGroupOn ? theme.accent.val : theme.mutedText.val} />
            <Text fontWeight="600" color="$color" fontSize="$4">
              {t(meta.labelKey)}
            </Text>
          </XStack>
          {mainEntry && (
            <AppSwitch
              checked={isGroupOn}
              onCheckedChange={handleMainToggle}
            />
          )}
        </XStack>
        {isGroupOn && (
          <YStack gap="$3">
            {mainKey && mainEntry && mainEntry.type === 'secret' && (
              <EnvStringField
                envKey={mainKey}
                label={t(`admin.envLabel_${mainKey}`, { defaultValue: mainKey })}
                value={mainEntry.value}
                isSecret
                onSave={handleUpdate}
              />
            )}
            {meta.hintUrl && meta.hintKey && (
              <ScalePress onPress={() => Linking.openURL(meta.hintUrl!)}>
                <Text fontSize="$2" color="$accent">
                  {t(meta.hintKey)}
                </Text>
              </ScalePress>
            )}
            {subKeys.map(([key, entry]) => {
              const label = t(`admin.envLabel_${key}`, { defaultValue: key })
              if (entry.type === 'boolean') {
                const isOn = entry.value === 'true'
                return (
                  <XStack key={key} alignItems="center" justifyContent="space-between">
                    <Text fontSize="$3" color="$color" flex={1} numberOfLines={1}>
                      {label}
                    </Text>
                    <AppSwitch
                      checked={isOn}
                      onCheckedChange={(checked) => handleUpdate(key, String(checked))}
                    />
                  </XStack>
                )
              }
              return (
                <EnvStringField
                  key={key}
                  envKey={key}
                  label={label}
                  value={entry.value}
                  isSecret={entry.type === 'secret'}
                  onSave={handleUpdate}
                />
              )
            })}
          </YStack>
        )}
      </AppCard>
    )
  }

  const cards = envData ? Object.entries(envData).map(([group, keys]) => renderEnvCard(group, keys)).filter(Boolean) : []

  // Distribute cards into 2 columns for masonry layout
  const col1: React.ReactNode[] = []
  const col2: React.ReactNode[] = []
  cards.forEach((card, i) => {
    if (i % 2 === 0) col1.push(card)
    else col2.push(card)
  })

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
      <FadeIn>
        <YStack gap="$3">
          <Text color="$mutedText" fontSize="$2" lineHeight={18}>
            {t('admin.apiSettingsDesc')}
          </Text>

          {isWide ? (
            <XStack gap="$3" alignItems="flex-start">
              <YStack flex={1} gap="$3">{col1}</YStack>
              <YStack flex={1} gap="$3">{col2}</YStack>
            </XStack>
          ) : (
            <YStack gap="$3">{cards}</YStack>
          )}

          <Text color="$mutedText" fontSize="$1" textAlign="center" marginTop="$2">
            {t('admin.restartRequired')}
          </Text>
        </YStack>
      </FadeIn>
    </ScrollView>
  )
}
