import { useState, useMemo, useCallback } from 'react'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation, SUPPORTED_LANGUAGES } from '@mvp/i18n'
import { ScalePress } from '@mvp/ui'
import { DOC_GROUPS } from './docData'
import type { DocGroup } from './docData'

interface PageListProps {
  pages: DocGroup['pages']
  selectedPageId?: string | null
  onPageSelect?: (pageId: string) => void
  theme: ReturnType<typeof useTheme>
  t: (key: string) => string
}

function PageList({ pages, selectedPageId, onPageSelect, theme, t }: PageListProps) {
  return (
    <YStack paddingLeft="$4" gap="$0.5">
      {pages.map((page) => {
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
  )
}

interface DocTreeViewProps {
  onPageSelect?: (pageId: string) => void
  selectedPageId?: string | null
}

export function DocTreeView({ onPageSelect, selectedPageId }: DocTreeViewProps) {
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

  const matchesAnyLang = useCallback(
    (key: string, query: string) => {
      for (const lng of SUPPORTED_LANGUAGES) {
        if (t(key, { lng }).toLowerCase().includes(query)) return true
      }
      return false
    },
    [t],
  )

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return DOC_GROUPS
    const q = searchQuery.toLowerCase()
    return DOC_GROUPS.map((group) => {
      const matchingPages = group.pages.filter(
        (page) => matchesAnyLang(page.titleKey, q) || matchesAnyLang(page.contentKey, q),
      )
      if (matchingPages.length > 0 || matchesAnyLang(group.titleKey, q)) {
        return { ...group, pages: matchingPages.length > 0 ? matchingPages : group.pages }
      }
      return null
    }).filter(Boolean) as DocGroup[]
  }, [searchQuery, matchesAnyLang])

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
            width={38}
            height={38}
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons
              name={allExpanded ? 'contract-outline' : 'expand-outline'}
              size={18}
              color={theme.mutedText.val}
            />
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
                {isExpanded && (
                  <PageList
                    pages={group.pages}
                    selectedPageId={selectedPageId}
                    onPageSelect={onPageSelect}
                    theme={theme}
                    t={t}
                  />
                )}
              </YStack>
            )
          })}
        </YStack>
      )}
    </YStack>
  )
}
