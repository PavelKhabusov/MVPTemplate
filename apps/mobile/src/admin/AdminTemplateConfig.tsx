import React, { useState, useCallback } from 'react'
import { ScrollView } from 'react-native'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppCard, AppModal, AppSwitch, FadeIn, ScalePress, useToast } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import {
  useTemplateConfigStore,
  TEMPLATE_FLAGS,
  COLOR_SCHEMES,
  DEFAULT_SCHEME_KEY,
  applyColorScheme,
  applyCustomColor,
  applyRadiusScale,
  applyCardStyle,
  FONT_FAMILY_CONFIG,
  type RadiusScale,
  type CardStyle,
  type FontScale,
  type FontFamily,
} from '@mvp/template-config'
import { api } from '../services/api'

const AdminModal = AppModal

export function TemplateConfigTab() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const overrides = useTemplateConfigStore((s) => s.overrides)
  const setFlag = useTemplateConfigStore((s) => s.setFlag)
  const colorScheme = useTemplateConfigStore((s) => s.colorScheme)
  const customColor = useTemplateConfigStore((s) => s.customColor)
  const setColorScheme = useTemplateConfigStore((s) => s.setColorScheme)
  const setCustomColor = useTemplateConfigStore((s) => s.setCustomColor)
  const radiusScale = useTemplateConfigStore((s) => s.radiusScale)
  const setRadiusScale = useTemplateConfigStore((s) => s.setRadiusScale)
  const cardStyle = useTemplateConfigStore((s) => s.cardStyle)
  const setCardStyle = useTemplateConfigStore((s) => s.setCardStyle)
  const fontScale = useTemplateConfigStore((s) => s.fontScale)
  const setFontScale = useTemplateConfigStore((s) => s.setFontScale)
  const fontFamily = useTemplateConfigStore((s) => s.fontFamily)
  const setFontFamily = useTemplateConfigStore((s) => s.setFontFamily)
  const resetAll = useTemplateConfigStore((s) => s.resetAll)

  const [hexInput, setHexInput] = useState(customColor ?? '')
  const [showFontModal, setShowFontModal] = useState(false)

  const frontendFlags = TEMPLATE_FLAGS.filter((f) => f.scope === 'frontend')

  const getFlagValue = (key: string, defaultValue: boolean) =>
    overrides[key] !== undefined ? overrides[key] : defaultValue

  const hasOverrides =
    Object.keys(overrides).length > 0 ||
    colorScheme !== null ||
    customColor !== null ||
    radiusScale !== 'default' ||
    cardStyle !== 'bordered' ||
    fontScale !== 'default' ||
    fontFamily !== 'monospace'

  const handleSetRadius = (scale: RadiusScale) => {
    setRadiusScale(scale)
    applyRadiusScale(scale)
  }

  const handleSetCardStyle = (style: CardStyle) => {
    setCardStyle(style)
    applyCardStyle(style)
  }

  const handleSetFontScale = (scale: FontScale) => {
    setFontScale(scale)
  }

  const handleSetFontFamily = (family: FontFamily) => {
    setFontFamily(family)
  }

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(hexInput)

  // Persist a single env key to backend
  const syncEnv = useCallback(async (patch: Record<string, string | boolean | null>) => {
    try {
      await api.patch('/admin/env', patch)
    } catch {
      toast.error(t('admin.envSaveError'))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  const handleApplyCustom = () => {
    if (!isValidHex) return
    setCustomColor(hexInput)
    applyCustomColor(hexInput)
    syncEnv({ EXPO_PUBLIC_CUSTOM_COLOR: hexInput, EXPO_PUBLIC_COLOR_SCHEME: null })
  }

  const handleSelectPreset = (key: string) => {
    setColorScheme(key)
    applyColorScheme(key)
    setHexInput('')
    syncEnv({ EXPO_PUBLIC_COLOR_SCHEME: key, EXPO_PUBLIC_CUSTOM_COLOR: null })
  }

  const handleToggleFlag = (flag: typeof frontendFlags[number], newValue: boolean) => {
    setFlag(flag.key, newValue)
    if (flag.envVar) {
      syncEnv({ [flag.envVar]: String(newValue) })
    }
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
      <FadeIn>
        <YStack gap="$3">
          <Text color="$mutedText" fontSize="$2" lineHeight={18}>
            {t('templateConfig.description')}
          </Text>

          {/* Color Scheme */}
          <AppCard animated={false}>
            <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$3">
              {t('templateConfig.colorScheme')}
            </Text>

            {/* Preset grid — 6 per row */}
            <XStack flexWrap="wrap" gap="$2" marginBottom="$3">
              {COLOR_SCHEMES.map((scheme) => {
                const isSelected = !customColor && (colorScheme ?? DEFAULT_SCHEME_KEY) === scheme.key
                return (
                  <ScalePress key={scheme.key} onPress={() => handleSelectPreset(scheme.key)}>
                    <YStack alignItems="center" gap="$1" width={48}>
                      <YStack
                        width={36}
                        height={36}
                        borderRadius={18}
                        borderWidth={2}
                        borderColor={isSelected ? '$color' : 'transparent'}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <YStack
                          width={28}
                          height={28}
                          borderRadius={14}
                          style={{ backgroundColor: scheme.swatch } as any}
                          alignItems="center"
                          justifyContent="center"
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="white" />
                          )}
                        </YStack>
                      </YStack>
                      <Text
                        fontSize={10}
                        color={isSelected ? '$color' : '$mutedText'}
                        fontWeight={isSelected ? '600' : '400'}
                        textAlign="center"
                        numberOfLines={1}
                      >
                        {t(scheme.labelKey)}
                      </Text>
                    </YStack>
                  </ScalePress>
                )
              })}
            </XStack>

            {/* Custom hex color */}
            <YStack gap="$2">
              <Text fontSize="$2" color="$mutedText" fontWeight="500">
                {t('templateConfig.customColor')}
              </Text>
              <XStack gap="$2" alignItems="center">
                <YStack
                  width={32}
                  height={32}
                  borderRadius={16}
                  borderWidth={2}
                  borderColor={customColor ? '$color' : '$borderColor'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <YStack
                    width={24}
                    height={24}
                    borderRadius={12}
                    style={{ backgroundColor: isValidHex ? hexInput : theme.subtleBackground.val } as any}
                  />
                </YStack>
                <Input
                  flex={1}
                  size="$3"
                  value={hexInput}
                  onChangeText={setHexInput}
                  placeholder={t('templateConfig.customColorPlaceholder')}
                  placeholderTextColor={'$placeholderColor' as any}
                  backgroundColor="$subtleBackground"
                  borderColor={customColor ? '$accent' : '$borderColor'}
                  color="$color"
                  autoCapitalize="characters"
                  maxLength={7}
                />
                {isValidHex && (
                  <ScalePress onPress={handleApplyCustom}>
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
          </AppCard>

          {/* Border Radius */}
          <AppCard animated={false}>
            <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$3">
              {t('templateConfig.borderRadius')}
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {(
                [
                  { value: 'square' as RadiusScale, labelKey: 'templateConfig.radiusSquare' },
                  { value: 'sharp' as RadiusScale, labelKey: 'templateConfig.radiusSharp' },
                  { value: 'default' as RadiusScale, labelKey: 'templateConfig.radiusDefault' },
                  { value: 'rounded' as RadiusScale, labelKey: 'templateConfig.radiusRounded' },
                  { value: 'pill' as RadiusScale, labelKey: 'templateConfig.radiusPill' },
                ] as const
              ).map((opt) => {
                const active = radiusScale === opt.value
                return (
                  <ScalePress key={opt.value} onPress={() => handleSetRadius(opt.value)}>
                    <XStack
                      paddingHorizontal="$3"
                      paddingVertical="$1.5"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={active ? '$accent' : '$borderColor'}
                      backgroundColor="$subtleBackground"
                    >
                      <Text
                        fontSize="$2"
                        color={active ? '$accent' : '$mutedText'}
                        fontWeight={active ? '600' : '400'}
                      >
                        {t(opt.labelKey)}
                      </Text>
                    </XStack>
                  </ScalePress>
                )
              })}
            </XStack>
          </AppCard>

          {/* Card Style */}
          <AppCard animated={false}>
            <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$3">
              {t('templateConfig.cardStyle')}
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {(
                [
                  { value: 'flat' as CardStyle, labelKey: 'templateConfig.cardFlat' },
                  { value: 'bordered' as CardStyle, labelKey: 'templateConfig.cardBordered' },
                  { value: 'elevated' as CardStyle, labelKey: 'templateConfig.cardElevated' },
                  { value: 'glass' as CardStyle, labelKey: 'templateConfig.cardGlass' },
                ] as const
              ).map((opt) => {
                const active = cardStyle === opt.value
                return (
                  <ScalePress key={opt.value} onPress={() => handleSetCardStyle(opt.value)}>
                    <XStack
                      paddingHorizontal="$3"
                      paddingVertical="$1.5"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={active ? '$accent' : '$borderColor'}
                      backgroundColor="$subtleBackground"
                    >
                      <Text
                        fontSize="$2"
                        color={active ? '$accent' : '$mutedText'}
                        fontWeight={active ? '600' : '400'}
                      >
                        {t(opt.labelKey)}
                      </Text>
                    </XStack>
                  </ScalePress>
                )
              })}
            </XStack>
          </AppCard>

          {/* Typography — opens BottomSheet */}
          <ScalePress onPress={() => setShowFontModal(true)}>
            <AppCard animated={false}>
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$3" alignItems="center">
                  <YStack width={36} height={36} borderRadius={18} backgroundColor="$subtleBackground" alignItems="center" justifyContent="center">
                    <Ionicons name="text-outline" size={18} color={theme.accent.val} />
                  </YStack>
                  <YStack gap="$0.5">
                    <Text fontWeight="600" color="$color" fontSize="$4">{t('templateConfig.fontFamily')}</Text>
                    <Text fontSize="$2" color="$mutedText">
                      {FONT_FAMILY_CONFIG[fontFamily]?.label ?? fontFamily} · {fontScale}
                    </Text>
                  </YStack>
                </XStack>
                <Ionicons name="chevron-forward" size={18} color={theme.mutedText.val} />
              </XStack>
            </AppCard>
          </ScalePress>

          <AdminModal
            visible={showFontModal}
            onClose={() => setShowFontModal(false)}
            title={t('templateConfig.fontFamily')}
          >
            <YStack gap="$4">
              {/* Font Scale */}
              <YStack gap="$2">
                <Text fontWeight="600" color="$color" fontSize="$4">{t('templateConfig.fontScale')}</Text>
                <XStack gap="$2">
                  {(
                    [
                      { value: 'compact' as FontScale, labelKey: 'templateConfig.fontCompact' },
                      { value: 'default' as FontScale, labelKey: 'templateConfig.fontDefault' },
                      { value: 'large' as FontScale, labelKey: 'templateConfig.fontLarge' },
                    ] as const
                  ).map((opt) => {
                    const active = fontScale === opt.value
                    return (
                      <ScalePress key={opt.value} onPress={() => handleSetFontScale(opt.value)}>
                        <XStack
                          paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3"
                          borderWidth={1}
                          borderColor={active ? '$accent' : '$borderColor'}
                          backgroundColor={active ? '$accentBackground' : '$subtleBackground'}
                        >
                          <Text fontSize="$3" color={active ? '$accent' : '$color'} fontWeight={active ? '700' : '400'}>
                            {t(opt.labelKey)}
                          </Text>
                        </XStack>
                      </ScalePress>
                    )
                  })}
                </XStack>
              </YStack>

              <YStack height={1} backgroundColor="$borderColor" />

              {/* Font Family */}
              <YStack gap="$2">
                <Text fontWeight="600" color="$color" fontSize="$4">{t('templateConfig.fontFamily')}</Text>
                <YStack gap="$2">
                  {(Object.entries(FONT_FAMILY_CONFIG) as [FontFamily, { label: string }][]).map(([key, cfg]) => {
                    const active = fontFamily === key
                    return (
                      <ScalePress key={key} onPress={() => handleSetFontFamily(key)}>
                        <XStack
                          alignItems="center" justifyContent="space-between"
                          paddingHorizontal="$3" paddingVertical="$3" borderRadius="$3"
                          borderWidth={1}
                          borderColor={active ? '$accent' : '$borderColor'}
                          backgroundColor={active ? '$accentBackground' : '$subtleBackground'}
                        >
                          <YStack gap="$0.5">
                            <Text fontSize="$3" color={active ? '$accent' : '$color'} fontWeight={active ? '700' : '400'}>
                              {cfg.label}
                            </Text>
                          </YStack>
                          {active && <Ionicons name="checkmark-circle" size={20} color={theme.accent.val} />}
                        </XStack>
                      </ScalePress>
                    )
                  })}
                </YStack>
              </YStack>
            </YStack>
          </AdminModal>

          {/* Frontend Flags */}
          <AppCard animated={false}>
            <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$2">
              {t('templateConfig.frontend')}
            </Text>
            <YStack gap="$2">
              {frontendFlags.map((flag) => {
                const value = getFlagValue(flag.key, flag.defaultValue)
                if (flag.key === 'docFeedback' && !getFlagValue('docs', true)) return null
                return (
                  <XStack key={flag.key} alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap="$2" flex={1}>
                      <Ionicons
                        name={flag.icon}
                        size={18}
                        color={value ? theme.accent.val : theme.mutedText.val}
                      />
                      <Text fontSize="$3" color="$color" flex={1} numberOfLines={1}>
                        {t(flag.labelKey)}
                      </Text>
                    </XStack>
                    <AppSwitch
                      checked={value}
                      onCheckedChange={() => handleToggleFlag(flag, !value)}
                    />
                  </XStack>
                )
              })}
            </YStack>
          </AppCard>

          {/* Reset Button */}
          {hasOverrides && (
            <AppButton
              variant="outline"
              onPress={() => {
                resetAll()
                applyColorScheme(DEFAULT_SCHEME_KEY)
                setHexInput('')
                syncEnv({
                  EXPO_PUBLIC_COLOR_SCHEME: DEFAULT_SCHEME_KEY,
                  EXPO_PUBLIC_CUSTOM_COLOR: null,
                  EXPO_PUBLIC_DOCS_ENABLED: 'true',
                  EXPO_PUBLIC_COOKIE_BANNER: 'true',
                })
              }}
            >
              {t('templateConfig.reset')}
            </AppButton>
          )}
        </YStack>
      </FadeIn>
    </ScrollView>
  )
}
