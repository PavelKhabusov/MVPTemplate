import { Platform, ScrollView, Pressable } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { AppSwitch } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { AnimatePresence, MotiView } from 'moti'
import { useTranslation } from '@mvp/i18n'
import { useTemplateConfigStore } from './store'
import { TEMPLATE_FLAGS } from './flags'

export function TemplateConfigSidebar() {
  const { t } = useTranslation()
  const theme = useTheme()
  const sidebarOpen = useTemplateConfigStore((s) => s.sidebarOpen)
  const setSidebarOpen = useTemplateConfigStore((s) => s.setSidebarOpen)
  const overrides = useTemplateConfigStore((s) => s.overrides)
  const setFlag = useTemplateConfigStore((s) => s.setFlag)
  const resetAll = useTemplateConfigStore((s) => s.resetAll)

  if (Platform.OS !== 'web') return null

  const frontendFlags = TEMPLATE_FLAGS.filter((f) => f.scope === 'frontend')
  const backendFlags = TEMPLATE_FLAGS.filter((f) => f.scope !== 'frontend')

  const getFlagValue = (key: string, defaultValue: boolean) =>
    overrides[key] !== undefined ? overrides[key] : defaultValue

  const hasOverrides = Object.keys(overrides).length > 0

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 200 }}
            style={{
              position: 'fixed' as any,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 999,
            } as any}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setSidebarOpen(false)}
            />
          </MotiView>

          {/* Sidebar */}
          <MotiView
            from={{ translateX: 320 }}
            animate={{ translateX: 0 }}
            exit={{ translateX: 320 }}
            transition={{ type: 'timing', duration: 250 }}
            style={{
              position: 'fixed' as any,
              top: 0,
              right: 0,
              bottom: 0,
              width: 320,
              zIndex: 1000,
              backgroundColor: theme.background.val,
              borderLeftWidth: 1,
              borderLeftColor: theme.borderColor.val,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
            } as any}
          >
            <YStack flex={1}>
              {/* Header */}
              <XStack
                alignItems="center"
                justifyContent="space-between"
                paddingHorizontal="$4"
                paddingVertical="$3"
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
              >
                <XStack alignItems="center" gap="$2">
                  <Ionicons name="construct-outline" size={20} color={theme.accent.val} />
                  <Text fontWeight="700" fontSize="$4" color="$color">
                    {t('templateConfig.title')}
                  </Text>
                </XStack>
                <Pressable onPress={() => setSidebarOpen(false)}>
                  <YStack
                    width={32}
                    height={32}
                    borderRadius="$2"
                    alignItems="center"
                    justifyContent="center"
                    hoverStyle={{ backgroundColor: '$backgroundHover' }}
                  >
                    <Ionicons name="close" size={20} color={theme.mutedText.val} />
                  </YStack>
                </Pressable>
              </XStack>

              {/* Content */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, gap: 16 }}
              >
                <Text fontSize="$2" color="$mutedText" lineHeight={18}>
                  {t('templateConfig.description')}
                </Text>

                {/* Frontend Flags */}
                <YStack gap="$2">
                  <Text
                    fontSize="$1"
                    fontWeight="700"
                    color="$mutedText"
                    textTransform="uppercase"
                    letterSpacing={1}
                  >
                    {t('templateConfig.frontend')}
                  </Text>
                  <YStack
                    backgroundColor="$cardBackground"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                    overflow="hidden"
                  >
                    {frontendFlags.map((flag, i) => (
                      <XStack
                        key={flag.key}
                        alignItems="center"
                        justifyContent="space-between"
                        paddingHorizontal="$3"
                        paddingVertical="$2.5"
                        borderTopWidth={i > 0 ? 1 : 0}
                        borderTopColor="$borderColor"
                      >
                        <XStack alignItems="center" gap="$2.5" flex={1}>
                          <Ionicons
                            name={flag.icon}
                            size={18}
                            color={getFlagValue(flag.key, flag.defaultValue) ? theme.accent.val : theme.mutedText.val}
                          />
                          <Text fontSize="$3" color="$color" flex={1} numberOfLines={1}>
                            {t(flag.labelKey)}
                          </Text>
                        </XStack>
                        <AppSwitch
                          size="sm"
                          checked={getFlagValue(flag.key, flag.defaultValue)}
                          onCheckedChange={(checked) => setFlag(flag.key, checked)}
                        />
                      </XStack>
                    ))}
                  </YStack>
                </YStack>

                {/* Backend Flags */}
                <YStack gap="$2">
                  <XStack alignItems="center" gap="$2">
                    <Text
                      fontSize="$1"
                      fontWeight="700"
                      color="$mutedText"
                      textTransform="uppercase"
                      letterSpacing={1}
                    >
                      {t('templateConfig.backend')}
                    </Text>
                    <XStack
                      backgroundColor="$subtleBackground"
                      paddingHorizontal="$1.5"
                      paddingVertical={2}
                      borderRadius="$1"
                    >
                      <Text fontSize={10} color="$mutedText" fontWeight="600">
                        {t('templateConfig.server')}
                      </Text>
                    </XStack>
                  </XStack>
                  <YStack
                    backgroundColor="$cardBackground"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                    overflow="hidden"
                  >
                    {backendFlags.map((flag, i) => (
                      <XStack
                        key={flag.key}
                        alignItems="center"
                        justifyContent="space-between"
                        paddingHorizontal="$3"
                        paddingVertical="$2.5"
                        borderTopWidth={i > 0 ? 1 : 0}
                        borderTopColor="$borderColor"
                      >
                        <XStack alignItems="center" gap="$2.5" flex={1}>
                          <Ionicons
                            name={flag.icon}
                            size={18}
                            color={getFlagValue(flag.key, flag.defaultValue) ? theme.accent.val : theme.mutedText.val}
                          />
                          <Text fontSize="$3" color="$color" flex={1} numberOfLines={1}>
                            {t(flag.labelKey)}
                          </Text>
                        </XStack>
                        <AppSwitch
                          size="sm"
                          checked={getFlagValue(flag.key, flag.defaultValue)}
                          onCheckedChange={(checked) => setFlag(flag.key, checked)}
                        />
                      </XStack>
                    ))}
                  </YStack>
                </YStack>

                {/* Reset Button */}
                {hasOverrides && (
                  <Pressable onPress={resetAll}>
                    <XStack
                      alignItems="center"
                      justifyContent="center"
                      gap="$2"
                      paddingVertical="$2.5"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor="$borderColor"
                      hoverStyle={{ backgroundColor: '$backgroundHover' } as any}
                    >
                      <Ionicons name="refresh-outline" size={16} color={theme.mutedText.val} />
                      <Text fontSize="$2" color="$mutedText" fontWeight="600">
                        {t('templateConfig.reset')}
                      </Text>
                    </XStack>
                  </Pressable>
                )}
              </ScrollView>
            </YStack>
          </MotiView>
        </>
      )}
    </AnimatePresence>
  )
}
