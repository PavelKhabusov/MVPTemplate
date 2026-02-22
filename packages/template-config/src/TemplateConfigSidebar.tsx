import { useMemo } from 'react'
import { Platform, ScrollView, Pressable } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import { useTranslation } from '@mvp/i18n'
import { useIsMobileWeb } from '@mvp/ui'
import { useCookieConsentStore } from '@mvp/store'
import { useTemplateConfigStore } from './store'
import { TEMPLATE_FLAGS } from './flags'
import type { TemplateFlag } from './flags'

function FlagRow({ flag, value, onToggle, action }: { flag: TemplateFlag; value: boolean; onToggle: () => void; action?: { label: string; onPress: () => void } }) {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Pressable onPress={onToggle}>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$3"
        paddingVertical="$2"
        hoverStyle={{ backgroundColor: '$backgroundHover' } as any}
      >
        <XStack alignItems="center" gap="$2" flex={1}>
          <Ionicons
            name={flag.icon}
            size={16}
            color={value ? theme.accent.val : theme.mutedText.val}
          />
          <Text fontSize="$2" color="$color" flex={1} numberOfLines={1}>
            {t(flag.labelKey)}
          </Text>
        </XStack>
        <XStack alignItems="center" gap="$2">
          {action && value && (
            <Pressable onPress={(e) => { e.stopPropagation(); action.onPress() }}>
              <XStack
                paddingHorizontal="$1.5"
                paddingVertical={2}
                borderRadius="$1"
                borderWidth={1}
                borderColor="$borderColor"
                hoverStyle={{ backgroundColor: '$backgroundHover' } as any}
              >
                <Text fontSize={10} color="$mutedText" fontWeight="600">
                  {action.label}
                </Text>
              </XStack>
            </Pressable>
          )}
          <YStack
            width={36}
            height={20}
            borderRadius={10}
            backgroundColor={value ? '$accent' : '$borderColor'}
            justifyContent="center"
            paddingHorizontal={2}
          >
            <MotiView
              animate={{ translateX: value ? 16 : 0 }}
              transition={{ type: 'timing', duration: 150 }}
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: 'white',
              }}
            />
          </YStack>
        </XStack>
      </XStack>
    </Pressable>
  )
}

function buildEnvOutput(overrides: Record<string, boolean>): string {
  const lines: string[] = ['# Template Configuration']

  for (const flag of TEMPLATE_FLAGS) {
    if (!flag.envVar) continue
    const value = overrides[flag.key] !== undefined ? overrides[flag.key] : flag.defaultValue

    if (flag.envType === 'boolean') {
      lines.push(`${flag.envVar}=${value}`)
    } else {
      if (value) {
        lines.push(`${flag.envVar}=your-${flag.envVar.toLowerCase().replace(/_/g, '-')}`)
      } else {
        lines.push(`# ${flag.envVar}=`)
      }
    }
  }

  lines.push('')
  lines.push('EXPO_PUBLIC_ENABLE_TEMPLATE_CONFIG=false')

  return lines.join('\n')
}

export function TemplateConfigSidebar() {
  const { t } = useTranslation()
  const theme = useTheme()
  const sidebarOpen = useTemplateConfigStore((s) => s.sidebarOpen)
  const setSidebarOpen = useTemplateConfigStore((s) => s.setSidebarOpen)
  const overrides = useTemplateConfigStore((s) => s.overrides)
  const setFlag = useTemplateConfigStore((s) => s.setFlag)
  const resetAll = useTemplateConfigStore((s) => s.resetAll)
  const resetConsent = useCookieConsentStore((s) => s.resetConsent)
  const isMobile = useIsMobileWeb()

  const envOutput = useMemo(() => buildEnvOutput(overrides), [overrides])

  if (Platform.OS !== 'web') return null
  if (isMobile) return null
  if (!sidebarOpen) return null

  const frontendFlags = TEMPLATE_FLAGS.filter((f) => f.scope === 'frontend')
  const backendFlags = TEMPLATE_FLAGS.filter((f) => f.scope !== 'frontend')

  const getFlagValue = (key: string, defaultValue: boolean) =>
    overrides[key] !== undefined ? overrides[key] : defaultValue

  const hasOverrides = Object.keys(overrides).length > 0

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(envOutput)
    }
  }

  return (
    <YStack
      width={300}
      height="100%"
      borderLeftWidth={1}
      borderLeftColor="$borderColor"
      backgroundColor="$background"
      style={{ flexShrink: 0, overflow: 'hidden' } as any}
    >
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$3"
        paddingVertical="$2.5"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack alignItems="center" gap="$2">
          <Ionicons name="construct-outline" size={18} color={theme.accent.val} />
          <Text fontWeight="700" fontSize="$3" color="$color">
            {t('templateConfig.title')}
          </Text>
        </XStack>
        <Pressable onPress={() => setSidebarOpen(false)}>
          <YStack
            width={28}
            height={28}
            borderRadius="$2"
            alignItems="center"
            justifyContent="center"
            hoverStyle={{ backgroundColor: '$backgroundHover' }}
          >
            <Ionicons name="close" size={18} color={theme.mutedText.val} />
          </YStack>
        </Pressable>
      </XStack>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 12 }}
      >
        <Text fontSize="$1" color="$mutedText" paddingHorizontal="$3" marginBottom="$3" lineHeight={16}>
          {t('templateConfig.description')}
        </Text>

        {/* Frontend Flags */}
        <Text
          fontSize={11}
          fontWeight="700"
          color="$mutedText"
          textTransform="uppercase"
          letterSpacing={1}
          paddingHorizontal="$3"
          marginBottom="$1"
        >
          {t('templateConfig.frontend')}
        </Text>
        <YStack marginBottom="$3">
          {frontendFlags.map((flag) => (
            <FlagRow
              key={flag.key}
              flag={flag}
              value={getFlagValue(flag.key, flag.defaultValue)}
              onToggle={() => setFlag(flag.key, !getFlagValue(flag.key, flag.defaultValue))}
              action={flag.key === 'cookieBanner' ? { label: t('templateConfig.showBanner'), onPress: resetConsent } : undefined}
            />
          ))}
        </YStack>

        {/* Backend Flags */}
        <XStack alignItems="center" gap="$1.5" paddingHorizontal="$3" marginBottom="$1">
          <Text
            fontSize={11}
            fontWeight="700"
            color="$mutedText"
            textTransform="uppercase"
            letterSpacing={1}
          >
            {t('templateConfig.backend')}
          </Text>
          <XStack
            backgroundColor="$subtleBackground"
            paddingHorizontal="$1"
            paddingVertical={1}
            borderRadius="$1"
          >
            <Text fontSize={9} color="$mutedText" fontWeight="600">
              .env
            </Text>
          </XStack>
        </XStack>
        <YStack marginBottom="$3">
          {backendFlags.map((flag) => (
            <FlagRow
              key={flag.key}
              flag={flag}
              value={getFlagValue(flag.key, flag.defaultValue)}
              onToggle={() => setFlag(flag.key, !getFlagValue(flag.key, flag.defaultValue))}
            />
          ))}
        </YStack>

        {/* .env Output */}
        <YStack paddingHorizontal="$3" gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={11} fontWeight="700" color="$mutedText" textTransform="uppercase" letterSpacing={1}>
              .env
            </Text>
            <Pressable onPress={handleCopy}>
              <XStack
                alignItems="center"
                gap="$1"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
                hoverStyle={{ backgroundColor: '$backgroundHover' } as any}
              >
                <Ionicons name="copy-outline" size={12} color={theme.mutedText.val} />
                <Text fontSize={11} color="$mutedText">
                  {t('templateConfig.copy')}
                </Text>
              </XStack>
            </Pressable>
          </XStack>
          <YStack
            backgroundColor="$subtleBackground"
            borderRadius="$2"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$2"
          >
            <Text
              fontSize={11}
              color="$color"
              style={{ fontFamily: 'monospace', whiteSpace: 'pre', userSelect: 'all' } as any}
            >
              {envOutput}
            </Text>
          </YStack>
        </YStack>

        {/* Reset Button */}
        {hasOverrides && (
          <YStack paddingHorizontal="$3" marginTop="$3">
            <Pressable onPress={resetAll}>
              <XStack
                alignItems="center"
                justifyContent="center"
                gap="$1.5"
                paddingVertical="$2"
                borderRadius="$2"
                borderWidth={1}
                borderColor="$borderColor"
                hoverStyle={{ backgroundColor: '$backgroundHover' } as any}
              >
                <Ionicons name="refresh-outline" size={14} color={theme.mutedText.val} />
                <Text fontSize="$2" color="$mutedText" fontWeight="600">
                  {t('templateConfig.reset')}
                </Text>
              </XStack>
            </Pressable>
          </YStack>
        )}
      </ScrollView>
    </YStack>
  )
}
