import { useMemo, useState, useEffect } from 'react'
import { Platform, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import { useTranslation, useAppTranslation, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@mvp/i18n'
import type { SupportedLanguage } from '@mvp/i18n'
import { useCookieConsentStore, useThemeStore } from '@mvp/store'

function useIsMobileWeb() {
  const { width } = useWindowDimensions()
  const [isMobile, setIsMobile] = useState(() => Platform.OS === 'web' && width <= 768)
  useEffect(() => {
    setIsMobile(Platform.OS === 'web' && width <= 768)
  }, [width])
  return isMobile
}
import type { ThemeMode } from '@mvp/store'
import { useTemplateConfigStore } from './store'
import type { WebLayout, UserBadgePlacement, HeaderNavAlign, ItemPlacement, SearchPlacement, RadiusScale, FontScale, FontFamily, CardStyle } from './store'
import { TEMPLATE_FLAGS } from './flags'
import type { TemplateFlag } from './flags'
import { COLOR_SCHEMES, DEFAULT_SCHEME_KEY, applyColorScheme } from './colorSchemes'
import { applyRadiusScale, applyCardStyle, applyFontFamily, FONT_FAMILY_CONFIG } from './designTokens'

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

function ToggleRow({ icon, label, value, onToggle }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: boolean; onToggle: () => void }) {
  const theme = useTheme()

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
          <Ionicons name={icon} size={16} color={value ? theme.accent.val : theme.mutedText.val} />
          <Text fontSize="$2" color="$color" flex={1} numberOfLines={1}>{label}</Text>
        </XStack>
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
            style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: 'white' }}
          />
        </YStack>
      </XStack>
    </Pressable>
  )
}

function SegmentedControl<T extends string>({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const theme = useTheme()

  return (
    <YStack paddingHorizontal="$3" paddingVertical="$1.5" gap="$1.5">
      <XStack alignItems="center" gap="$2">
        <Ionicons name={icon} size={16} color={theme.accent.val} />
        <Text fontSize="$2" color="$color">{label}</Text>
      </XStack>
      <XStack
        borderRadius={8}
        borderWidth={1}
        borderColor="$borderColor"
        overflow="hidden"
      >
        {options.map((opt, i) => (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{ flex: 1 }}
          >
            <XStack
              alignItems="center"
              justifyContent="center"
              paddingVertical={6}
              backgroundColor={value === opt.value ? '$accent' : 'transparent'}
              borderLeftWidth={i > 0 ? 1 : 0}
              borderLeftColor="$borderColor"
            >
              <Text
                fontSize={11}
                fontWeight={value === opt.value ? '600' : '400'}
                color={value === opt.value ? 'white' : '$mutedText'}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </XStack>
          </Pressable>
        ))}
      </XStack>
    </YStack>
  )
}

function IconButtonGroup<T extends string>({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: T
  options: { value: T; icon?: keyof typeof Ionicons.glyphMap; text?: string }[]
  onChange: (value: T) => void
}) {
  const theme = useTheme()

  return (
    <YStack paddingHorizontal="$3" paddingVertical="$1.5" gap="$1.5">
      <XStack alignItems="center" gap="$2">
        <Ionicons name={icon} size={16} color={theme.accent.val} />
        <Text fontSize="$2" color="$color">{label}</Text>
      </XStack>
      <XStack gap="$1.5">
        {options.map((opt) => (
          <Pressable key={opt.value} onPress={() => onChange(opt.value)}>
            <YStack
              width={36}
              height={32}
              borderRadius={8}
              alignItems="center"
              justifyContent="center"
              backgroundColor={value === opt.value ? '$accent' : '$subtleBackground'}
              borderWidth={1}
              borderColor={value === opt.value ? '$accent' : '$borderColor'}
            >
              {opt.icon ? (
                <Ionicons
                  name={opt.icon}
                  size={16}
                  color={value === opt.value ? 'white' : theme.mutedText.val}
                />
              ) : (
                <Text
                  fontSize={11}
                  fontWeight="700"
                  color={value === opt.value ? 'white' : '$mutedText'}
                >
                  {opt.text}
                </Text>
              )}
            </YStack>
          </Pressable>
        ))}
      </XStack>
    </YStack>
  )
}

const RADIUS_OUTPUT: Record<RadiusScale, string> = {
  sharp:   'radiusSm: 2, radiusMd: 4, radiusLg: 6',
  default: 'radiusSm: 8, radiusMd: 12, radiusLg: 16',
  rounded: 'radiusSm: 12, radiusMd: 20, radiusLg: 28',
  pill:    'radiusSm: 50, radiusMd: 50, radiusLg: 50',
}

function buildThemeOutput(schemeKey: string | null, radius: RadiusScale, card: CardStyle): string | null {
  const lines: string[] = []
  const scheme = schemeKey ? COLOR_SCHEMES.find((s) => s.key === schemeKey) : null

  if (scheme && schemeKey !== DEFAULT_SCHEME_KEY) {
    lines.push(
      '// tamagui.config.ts — light theme',
      `accent: '${scheme.light.accent}',`,
      `accentGradientStart: '${scheme.light.accentGradientStart}',`,
      `accentGradientEnd: '${scheme.light.accentGradientEnd}',`,
      `secondary: '${scheme.light.secondary}',`,
      '',
      '// tamagui.config.ts — dark theme',
      `accent: '${scheme.dark.accent}',`,
      `accentGradientStart: '${scheme.dark.accentGradientStart}',`,
      `accentGradientEnd: '${scheme.dark.accentGradientEnd}',`,
      `secondary: '${scheme.dark.secondary}',`,
    )
  }

  if (radius !== 'default') {
    if (lines.length > 0) lines.push('')
    lines.push(`// Border radius: ${radius}`, RADIUS_OUTPUT[radius])
  }

  if (card !== 'elevated') {
    if (lines.length > 0) lines.push('')
    lines.push(`// Card style: ${card}`)
  }

  return lines.length > 0 ? lines.join('\n') : null
}


export function TemplateConfigSidebar() {
  const { t, i18n, changeLanguage } = useAppTranslation()
  const theme = useTheme()
  const sidebarOpen = useTemplateConfigStore((s) => s.sidebarOpen)
  const setSidebarOpen = useTemplateConfigStore((s) => s.setSidebarOpen)
  const overrides = useTemplateConfigStore((s) => s.overrides)
  const setFlag = useTemplateConfigStore((s) => s.setFlag)
  const colorScheme = useTemplateConfigStore((s) => s.colorScheme)
  const setColorScheme = useTemplateConfigStore((s) => s.setColorScheme)
  const webLayout = useTemplateConfigStore((s) => s.webLayout)
  const setWebLayout = useTemplateConfigStore((s) => s.setWebLayout)
  const userBadgePlacement = useTemplateConfigStore((s) => s.userBadgePlacement)
  const setUserBadgePlacement = useTemplateConfigStore((s) => s.setUserBadgePlacement)
  const headerNavAlign = useTemplateConfigStore((s) => s.headerNavAlign)
  const setHeaderNavAlign = useTemplateConfigStore((s) => s.setHeaderNavAlign)
  const compactProfile = useTemplateConfigStore((s) => s.compactProfile)
  const setCompactProfile = useTemplateConfigStore((s) => s.setCompactProfile)
  const languagePlacement = useTemplateConfigStore((s) => s.languagePlacement)
  const setLanguagePlacement = useTemplateConfigStore((s) => s.setLanguagePlacement)
  const themePlacement = useTemplateConfigStore((s) => s.themePlacement)
  const setThemePlacement = useTemplateConfigStore((s) => s.setThemePlacement)
  const searchPlacement = useTemplateConfigStore((s) => s.searchPlacement)
  const setSearchPlacement = useTemplateConfigStore((s) => s.setSearchPlacement)
  const radiusScale = useTemplateConfigStore((s) => s.radiusScale)
  const setRadiusScale = useTemplateConfigStore((s) => s.setRadiusScale)
  const fontScale = useTemplateConfigStore((s) => s.fontScale)
  const setFontScale = useTemplateConfigStore((s) => s.setFontScale)
  const fontFamily = useTemplateConfigStore((s) => s.fontFamily)
  const setFontFamily = useTemplateConfigStore((s) => s.setFontFamily)
  const cardStyle = useTemplateConfigStore((s) => s.cardStyle)
  const setCardStyle = useTemplateConfigStore((s) => s.setCardStyle)
  const resetAll = useTemplateConfigStore((s) => s.resetAll)
  const resetConsent = useCookieConsentStore((s) => s.resetConsent)
  const isMobile = useIsMobileWeb()
  const { mode, setMode } = useThemeStore()
  const showHeaderControls = webLayout === 'header' || webLayout === 'both'

  const themeOutput = useMemo(() => buildThemeOutput(colorScheme, radiusScale, cardStyle), [colorScheme, radiusScale, cardStyle])

  if (Platform.OS !== 'web') return null
  if (isMobile) return null
  if (!sidebarOpen) return null

  const frontendFlags = TEMPLATE_FLAGS.filter((f) => f.scope === 'frontend')

  const getFlagValue = (key: string, defaultValue: boolean) =>
    overrides[key] !== undefined ? overrides[key] : defaultValue

  const hasOverrides = Object.keys(overrides).length > 0 || colorScheme !== null || webLayout !== 'sidebar' || userBadgePlacement !== 'sidebar' || headerNavAlign !== 'center' || compactProfile || languagePlacement !== 'nowhere' || themePlacement !== 'nowhere' || searchPlacement !== 'nowhere' || radiusScale !== 'default' || fontScale !== 'default' || fontFamily !== 'inter' || cardStyle !== 'elevated'

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

        {/* Color Scheme */}
        <Text
          fontSize={11}
          fontWeight="700"
          color="$mutedText"
          textTransform="uppercase"
          letterSpacing={1}
          paddingHorizontal="$3"
          marginBottom="$2"
        >
          {t('templateConfig.colorScheme')}
        </Text>
        <XStack paddingHorizontal="$3" gap="$2.5" marginBottom="$3" flexWrap="wrap">
          {COLOR_SCHEMES.map((scheme) => {
            const isSelected = (colorScheme ?? DEFAULT_SCHEME_KEY) === scheme.key
            return (
              <Pressable
                key={scheme.key}
                onPress={() => {
                  setColorScheme(scheme.key)
                  applyColorScheme(scheme.key)
                }}
              >
                <YStack
                  width={32}
                  height={32}
                  borderRadius={16}
                  borderWidth={2}
                  borderColor={isSelected ? '$color' : 'transparent'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <YStack
                    width={24}
                    height={24}
                    borderRadius={12}
                    style={{ backgroundColor: scheme.swatch } as any}
                  />
                </YStack>
              </Pressable>
            )
          })}
        </XStack>

        {/* Theme */}
        <Text
          fontSize={11}
          fontWeight="700"
          color="$mutedText"
          textTransform="uppercase"
          letterSpacing={1}
          paddingHorizontal="$3"
          marginBottom="$2"
        >
          {t('templateConfig.themeSection')}
        </Text>

        {/* Border Radius */}
        <YStack paddingHorizontal="$3" gap="$1.5" marginBottom="$3">
          <Text fontSize="$2" color="$color">{t('templateConfig.borderRadius')}</Text>
          <XStack gap="$2">
            {([
              { value: 'sharp' as RadiusScale, label: t('templateConfig.radiusSharp'), radius: 2 },
              { value: 'default' as RadiusScale, label: t('templateConfig.radiusDefault'), radius: 8 },
              { value: 'rounded' as RadiusScale, label: t('templateConfig.radiusRounded'), radius: 14 },
              { value: 'pill' as RadiusScale, label: t('templateConfig.radiusPill'), radius: 50 },
            ]).map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { setRadiusScale(opt.value); applyRadiusScale(opt.value) }}
              >
                <YStack alignItems="center" gap="$1">
                  <YStack
                    width={36}
                    height={36}
                    borderRadius={opt.radius}
                    borderWidth={2}
                    borderColor={radiusScale === opt.value ? '$accent' : '$borderColor'}
                    backgroundColor={radiusScale === opt.value ? '$accent' : '$cardBackground'}
                    opacity={radiusScale === opt.value ? 1 : 0.6}
                  />
                  <Text fontSize={10} color={radiusScale === opt.value ? '$accent' : '$mutedText'}>
                    {opt.label}
                  </Text>
                </YStack>
              </Pressable>
            ))}
          </XStack>
        </YStack>

        {/* Card Style */}
        <YStack paddingHorizontal="$3" gap="$1.5" marginBottom="$3">
          <Text fontSize="$2" color="$color">{t('templateConfig.cardStyle')}</Text>
          <XStack gap="$2">
            {([
              { value: 'flat' as CardStyle, label: t('templateConfig.cardFlat') },
              { value: 'bordered' as CardStyle, label: t('templateConfig.cardBordered') },
              { value: 'elevated' as CardStyle, label: t('templateConfig.cardElevated') },
              { value: 'glass' as CardStyle, label: t('templateConfig.cardGlass') },
            ]).map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { setCardStyle(opt.value); applyCardStyle(opt.value) }}
              >
                <YStack alignItems="center" gap="$1">
                  <YStack
                    width={48}
                    height={32}
                    borderRadius={6}
                    borderWidth={cardStyle === opt.value ? 2 : opt.value === 'bordered' || opt.value === 'flat' ? 1 : 0.5}
                    borderColor={cardStyle === opt.value ? '$accent' : opt.value === 'flat' ? 'transparent' : opt.value === 'bordered' ? '$borderColorHover' : '$borderColor'}
                    backgroundColor={opt.value === 'glass' ? '$surfaceGlass' : '$cardBackground'}
                    style={{
                      ...(opt.value === 'elevated' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 } : {}),
                      ...(opt.value === 'glass' ? { backdropFilter: 'blur(8px)' } : {}),
                    } as any}
                  />
                  <Text fontSize={10} color={cardStyle === opt.value ? '$accent' : '$mutedText'}>
                    {opt.label}
                  </Text>
                </YStack>
              </Pressable>
            ))}
          </XStack>
        </YStack>

        {/* Font Scale */}
        <YStack marginBottom="$3">
          <SegmentedControl<FontScale>
            icon="text-outline"
            label={t('templateConfig.fontScale')}
            value={fontScale}
            options={[
              { value: 'compact', label: t('templateConfig.fontCompact') },
              { value: 'default', label: t('templateConfig.fontDefault') },
              { value: 'large', label: t('templateConfig.fontLarge') },
            ]}
            onChange={setFontScale}
          />
        </YStack>

        {/* Font Family */}
        <YStack paddingHorizontal="$3" gap="$1.5" marginBottom="$3">
          <XStack alignItems="center" gap="$2">
            <Ionicons name="logo-google" size={16} color={theme.accent.val} />
            <Text fontSize="$2" color="$color">{t('templateConfig.fontFamily')}</Text>
          </XStack>
          <YStack gap="$1">
            {(Object.keys(FONT_FAMILY_CONFIG) as FontFamily[]).map((key) => {
              const cfg = FONT_FAMILY_CONFIG[key]
              const isSelected = fontFamily === key
              return (
                <Pressable
                  key={key}
                  onPress={() => { setFontFamily(key); applyFontFamily(key) }}
                >
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal="$2"
                    paddingVertical={6}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor={isSelected ? '$accent' : 'transparent'}
                    backgroundColor={isSelected ? '$subtleBackground' : 'transparent'}
                    hoverStyle={{ backgroundColor: '$backgroundHover' } as any}
                  >
                    <Text
                      fontSize={13}
                      color={isSelected ? '$accent' : '$color'}
                      fontWeight={isSelected ? '600' : '400'}
                      style={{ fontFamily: cfg.cssStack } as any}
                    >
                      {cfg.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color={theme.accent.val} />
                    )}
                  </XStack>
                </Pressable>
              )
            })}
          </YStack>
        </YStack>

        {/* Web Layout */}
        <Text
          fontSize={11}
          fontWeight="700"
          color="$mutedText"
          textTransform="uppercase"
          letterSpacing={1}
          paddingHorizontal="$3"
          marginBottom="$1"
        >
          {t('templateConfig.layoutSection')}
        </Text>
        <YStack marginBottom="$3">
          <SegmentedControl<WebLayout>
            icon="browsers-outline"
            label={t('templateConfig.webLayout')}
            value={webLayout}
            options={[
              { value: 'sidebar', label: t('templateConfig.layoutSidebar') },
              { value: 'header', label: t('templateConfig.layoutHeader') },
              { value: 'both', label: t('templateConfig.layoutBoth') },
            ]}
            onChange={setWebLayout}
          />
          <SegmentedControl<UserBadgePlacement>
            icon="person-outline"
            label={t('templateConfig.userBadge')}
            value={userBadgePlacement}
            options={
              webLayout === 'sidebar'
                ? [
                    { value: 'sidebar', label: t('templateConfig.placementSidebar') },
                    { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                  ]
                : webLayout === 'header'
                ? [
                    { value: 'header', label: t('templateConfig.placementHeader') },
                    { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                  ]
                : [
                    { value: 'sidebar', label: t('templateConfig.placementSidebar') },
                    { value: 'header', label: t('templateConfig.placementHeader') },
                    { value: 'both', label: t('templateConfig.placementBoth') },
                    { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                  ]
            }
            onChange={setUserBadgePlacement}
          />
          <IconButtonGroup<SupportedLanguage>
            icon="language-outline"
            label={t('templateConfig.language')}
            value={i18n.language as SupportedLanguage}
            options={SUPPORTED_LANGUAGES.map((lang) => ({
              value: lang,
              text: lang.toUpperCase(),
            }))}
            onChange={(lang) => changeLanguage(lang)}
          />
          <IconButtonGroup<ThemeMode>
            icon="contrast-outline"
            label={t('profileMenu.theme')}
            value={mode}
            options={[
              { value: 'light', icon: 'sunny-outline' },
              { value: 'dark', icon: 'moon-outline' },
              { value: 'system', icon: 'contrast-outline' },
            ]}
            onChange={(m) => setMode(m)}
          />
          {showHeaderControls && (
            <SegmentedControl<HeaderNavAlign>
              icon="apps-outline"
              label={t('templateConfig.headerNavAlign')}
              value={headerNavAlign}
              options={[
                { value: 'left', label: t('templateConfig.alignLeft') },
                { value: 'center', label: t('templateConfig.alignCenter') },
                { value: 'right', label: t('templateConfig.alignRight') },
              ]}
              onChange={setHeaderNavAlign}
            />
          )}
          {userBadgePlacement !== 'nowhere' && (
            <ToggleRow
              icon="person-circle-outline"
              label={t('templateConfig.compactProfile')}
              value={compactProfile}
              onToggle={() => setCompactProfile(!compactProfile)}
            />
          )}
          {!compactProfile && (
            <SegmentedControl<ItemPlacement>
              icon="language-outline"
              label={t('templateConfig.languagePlacement')}
              value={languagePlacement}
              options={
                webLayout === 'sidebar'
                  ? [
                      { value: 'sidebar', label: t('templateConfig.placementSidebar') },
                      { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                    ]
                  : webLayout === 'header'
                  ? [
                      { value: 'header', label: t('templateConfig.placementHeader') },
                      { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                    ]
                  : [
                      { value: 'sidebar', label: t('templateConfig.placementSidebar') },
                      { value: 'header', label: t('templateConfig.placementHeader') },
                      { value: 'both', label: t('templateConfig.placementBoth') },
                      { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                    ]
              }
              onChange={setLanguagePlacement}
            />
          )}
          {!compactProfile && (
            <SegmentedControl<ItemPlacement>
              icon="contrast-outline"
              label={t('templateConfig.themePlacement')}
              value={themePlacement}
              options={
                webLayout === 'sidebar'
                  ? [
                      { value: 'sidebar', label: t('templateConfig.placementSidebar') },
                      { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                    ]
                  : webLayout === 'header'
                  ? [
                      { value: 'header', label: t('templateConfig.placementHeader') },
                      { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                    ]
                  : [
                      { value: 'sidebar', label: t('templateConfig.placementSidebar') },
                      { value: 'header', label: t('templateConfig.placementHeader') },
                      { value: 'both', label: t('templateConfig.placementBoth') },
                      { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                    ]
              }
              onChange={setThemePlacement}
            />
          )}
          <SegmentedControl<SearchPlacement>
            icon="search-outline"
            label={t('templateConfig.searchPlacement')}
            value={searchPlacement}
            options={
              webLayout === 'sidebar'
                ? [
                    { value: 'sidebar', label: t('templateConfig.placementSidebar') },
                    { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                  ]
                : webLayout === 'header'
                ? [
                    { value: 'header', label: t('templateConfig.placementHeader') },
                    { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                  ]
                : [
                    { value: 'sidebar', label: t('templateConfig.placementSidebar') },
                    { value: 'header', label: t('templateConfig.placementHeader') },
                    { value: 'nowhere', label: t('templateConfig.placementNowhere') },
                  ]
            }
            onChange={setSearchPlacement}
          />
        </YStack>

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

        {/* Theme Output */}
        {themeOutput && (
          <YStack paddingHorizontal="$3" gap="$2" marginBottom="$3">
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize={11} fontWeight="700" color="$mutedText" textTransform="uppercase" letterSpacing={1}>
                tamagui.config.ts
              </Text>
              <Pressable onPress={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(themeOutput)
                }
              }}>
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
                {themeOutput}
              </Text>
            </YStack>
          </YStack>
        )}

        {/* Reset Button */}
        {hasOverrides && (
          <YStack paddingHorizontal="$3" marginTop="$3">
            <Pressable onPress={() => { resetAll(); applyColorScheme(DEFAULT_SCHEME_KEY); applyRadiusScale('default'); applyCardStyle('elevated'); applyFontFamily('inter') }}>
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
