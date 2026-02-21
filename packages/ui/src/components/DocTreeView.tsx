import { useState, useMemo } from 'react'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { MotiView, AnimatePresence } from 'moti'
import { useTranslation } from '@mvp/i18n'
import { ScalePress } from '../animations'

interface DocPage {
  id: string
  titleKey: string
  contentKey: string
}

interface DocGroup {
  id: string
  titleKey: string
  icon: keyof typeof Ionicons.glyphMap
  pages: DocPage[]
}

const DOC_GROUPS: DocGroup[] = [
  {
    id: 'getting-started',
    titleKey: 'docs.groupGettingStarted',
    icon: 'rocket-outline',
    pages: [
      { id: 'quick-start', titleKey: 'docs.pageQuickStart', contentKey: 'docs.contentQuickStart' },
      { id: 'prerequisites', titleKey: 'docs.pagePrerequisites', contentKey: 'docs.contentPrerequisites' },
      { id: 'project-structure', titleKey: 'docs.pageProjectStructure', contentKey: 'docs.contentProjectStructure' },
    ],
  },
  {
    id: 'configuration',
    titleKey: 'docs.groupConfiguration',
    icon: 'construct-outline',
    pages: [
      { id: 'env-vars', titleKey: 'docs.pageEnvVars', contentKey: 'docs.contentEnvVars' },
      { id: 'database-setup', titleKey: 'docs.pageDatabaseSetup', contentKey: 'docs.contentDatabaseSetup' },
      { id: 'auth', titleKey: 'docs.pageAuth', contentKey: 'docs.contentAuth' },
    ],
  },
  {
    id: 'features',
    titleKey: 'docs.groupFeatures',
    icon: 'sparkles-outline',
    pages: [
      { id: 'theming', titleKey: 'docs.pageTheming', contentKey: 'docs.contentTheming' },
      { id: 'i18n', titleKey: 'docs.pageI18n', contentKey: 'docs.contentI18n' },
      { id: 'push-notifications', titleKey: 'docs.pagePushNotifications', contentKey: 'docs.contentPushNotifications' },
      { id: 'email', titleKey: 'docs.pageEmail', contentKey: 'docs.contentEmail' },
    ],
  },
  {
    id: 'deployment',
    titleKey: 'docs.groupDeployment',
    icon: 'cloud-upload-outline',
    pages: [
      { id: 'build-production', titleKey: 'docs.pageBuildProduction', contentKey: 'docs.contentBuildProduction' },
      { id: 'docker', titleKey: 'docs.pageDocker', contentKey: 'docs.contentDocker' },
    ],
  },
  {
    id: 'customization',
    titleKey: 'docs.groupCustomization',
    icon: 'color-palette-outline',
    pages: [
      { id: 'add-screens', titleKey: 'docs.pageAddScreens', contentKey: 'docs.contentAddScreens' },
      { id: 'styling', titleKey: 'docs.pageStyling', contentKey: 'docs.contentStyling' },
    ],
  },
]

interface DocTreeViewProps {
  onPageSelect?: (contentKey: string) => void
  selectedPageId?: string | null
  renderContent?: (contentKey: string) => React.ReactNode
}

export function DocTreeView({ onPageSelect, selectedPageId, renderContent }: DocTreeViewProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['getting-started']))
  const [searchQuery, setSearchQuery] = useState('')

  const allExpanded = expandedGroups.size === DOC_GROUPS.length

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedGroups(new Set())
    } else {
      setExpandedGroups(new Set(DOC_GROUPS.map((g) => g.id)))
    }
  }

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return DOC_GROUPS
    const q = searchQuery.toLowerCase()
    return DOC_GROUPS.map((group) => {
      const matchingPages = group.pages.filter((page) =>
        t(page.titleKey).toLowerCase().includes(q)
      )
      if (matchingPages.length > 0 || t(group.titleKey).toLowerCase().includes(q)) {
        return { ...group, pages: matchingPages.length > 0 ? matchingPages : group.pages }
      }
      return null
    }).filter(Boolean) as DocGroup[]
  }, [searchQuery, t])

  const isSearchActive = searchQuery.trim().length > 0

  return (
    <YStack gap="$3">
      {/* Search + Expand/Collapse */}
      <XStack gap="$2" alignItems="center">
        <XStack
          flex={1}
          backgroundColor="$subtleBackground"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$borderColor"
          paddingHorizontal="$3"
          alignItems="center"
          gap="$2"
        >
          <Ionicons name="search-outline" size={16} color={theme.mutedText.val} />
          <Input
            flex={1}
            placeholder={t('docs.search')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            backgroundColor="transparent"
            borderWidth={0}
            height={38}
            fontSize="$2"
            color="$color"
            placeholderTextColor="$placeholderColor"
          />
          {searchQuery.length > 0 && (
            <ScalePress onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={theme.mutedText.val} />
            </ScalePress>
          )}
        </XStack>
        <ScalePress onPress={toggleAll}>
          <XStack
            backgroundColor="$subtleBackground"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
            paddingHorizontal="$2.5"
            height={38}
            alignItems="center"
            gap="$1.5"
          >
            <Ionicons
              name={allExpanded ? 'contract-outline' : 'expand-outline'}
              size={16}
              color={theme.mutedText.val}
            />
            <Text fontSize="$1" color="$mutedText" numberOfLines={1}>
              {allExpanded ? t('docs.collapseAll') : t('docs.expandAll')}
            </Text>
          </XStack>
        </ScalePress>
      </XStack>

      {/* Tree */}
      {filteredGroups.length === 0 ? (
        <YStack paddingVertical="$4" alignItems="center">
          <Text color="$mutedText" fontSize="$2">{t('docs.noResults')}</Text>
        </YStack>
      ) : (
        <YStack gap="$1">
          {filteredGroups.map((group) => {
            const isExpanded = isSearchActive || expandedGroups.has(group.id)
            return (
              <YStack key={group.id}>
                {/* Group Header */}
                <ScalePress onPress={() => toggleGroup(group.id)}>
                  <XStack
                    paddingVertical="$2.5"
                    paddingHorizontal="$3"
                    borderRadius="$3"
                    alignItems="center"
                    gap="$2.5"
                    hoverStyle={{ backgroundColor: '$backgroundHover' }}
                  >
                    <Ionicons name={group.icon} size={18} color={theme.accent.val} />
                    <Text flex={1} fontWeight="600" fontSize="$3" color="$color">
                      {t(group.titleKey)}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.mutedText.val}
                    />
                  </XStack>
                </ScalePress>

                {/* Pages */}
                <AnimatePresence>
                  {isExpanded && (
                    <MotiView
                      from={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' as any }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'timing', duration: 200 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <YStack paddingLeft="$4" gap="$0.5">
                        {group.pages.map((page) => {
                          const isSelected = selectedPageId === page.id
                          return (
                            <ScalePress
                              key={page.id}
                              onPress={() => onPageSelect?.(page.id)}
                            >
                              <XStack
                                paddingVertical="$2"
                                paddingHorizontal="$3"
                                borderRadius="$2"
                                alignItems="center"
                                gap="$2"
                                backgroundColor={isSelected ? '$subtleBackground' : 'transparent'}
                                hoverStyle={{ backgroundColor: '$backgroundHover' }}
                              >
                                <Ionicons
                                  name={isSelected ? 'document' : 'document-outline'}
                                  size={14}
                                  color={isSelected ? theme.accent.val : theme.mutedText.val}
                                />
                                <Text
                                  fontSize="$2"
                                  color={isSelected ? '$accent' : '$mutedText'}
                                  fontWeight={isSelected ? '600' : '400'}
                                >
                                  {t(page.titleKey)}
                                </Text>
                              </XStack>
                            </ScalePress>
                          )
                        })}
                      </YStack>
                    </MotiView>
                  )}
                </AnimatePresence>
              </YStack>
            )
          })}
        </YStack>
      )}

      {/* Content */}
      {selectedPageId && renderContent && (
        <YStack
          borderTopWidth={1}
          borderTopColor="$borderColor"
          paddingTop="$3"
          marginTop="$1"
        >
          {renderContent(
            DOC_GROUPS
              .flatMap((g) => g.pages)
              .find((p) => p.id === selectedPageId)?.contentKey ?? ''
          )}
        </YStack>
      )}
    </YStack>
  )
}
