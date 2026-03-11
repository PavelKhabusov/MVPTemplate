import { useState, useCallback, useRef } from 'react'
import { ScrollView, Platform, RefreshControl, View } from 'react-native'
import { YStack, XStack, Text, H2, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore, useNotesStore } from '@mvp/store'
import { router } from 'expo-router'
import { FadeIn, SlideIn, AnimatedListItem, AppCard, AppButton, ScalePress, RefreshSpinner } from '@mvp/ui'
import { CoachMark } from '@mvp/onboarding'
import {
  Plus,
  List,
  BarChart3,
  FileText,
  XCircle,
  FolderOpen,
  CheckCircle2,
  Users,
  UserPlus,
  CheckCheck,
  Rocket,
  HelpCircle,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

const ICON_MAP: Record<string, LucideIcon> = {
  'folder-outline': FolderOpen,
  'checkmark-circle-outline': CheckCircle2,
  'people-outline': Users,
  'person-add-outline': UserPlus,
  'checkmark-done-outline': CheckCheck,
  'rocket-outline': Rocket,
}

function StatCard({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  const theme = useTheme()
  const IconComponent = ICON_MAP[icon] || HelpCircle
  return (
    <AppCard flex={1} padding="$3" gap="$2" alignItems="center">
      <IconComponent size={24} color={color} />
      <Text fontSize="$6" fontWeight="bold" color="$color">{value}</Text>
      <Text fontSize="$1" color="$mutedText" textAlign="center">{label}</Text>
    </AppCard>
  )
}

function ActivityItem({ text, time, icon, color }: { text: string; time: string; icon: string; color?: string }) {
  const theme = useTheme()
  const iconColor = color ?? theme.mutedText.val
  const IconComponent = ICON_MAP[icon] || HelpCircle
  return (
    <XStack gap="$3" alignItems="center" paddingVertical="$2">
      <YStack
        width={36}
        height={36}
        borderRadius={18}
        backgroundColor={color ? (color + '18') : '$subtleBackground'}
        alignItems="center"
        justifyContent="center"
      >
        <IconComponent size={16} color={iconColor} />
      </YStack>
      <YStack flex={1}>
        <Text fontSize="$2" color="$color">{text}</Text>
        <Text fontSize="$1" color="$mutedText">{time}</Text>
      </YStack>
    </XStack>
  )
}

export default function HomeScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const theme = useTheme()
  const [refreshing, setRefreshing] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    // Simulate refresh — in production, invalidate TanStack Query cache here
    setTimeout(() => setRefreshing(false), 1200)
  }, [])

  const greeting = isAuthenticated
    ? `${t('home.welcome')}, ${user?.name?.split(' ')[0] ?? ''}`
    : t('home.welcomeGuest')

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: theme.background.val }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        Platform.OS !== 'web' ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent.val}
            colors={[theme.accent.val]}
            progressBackgroundColor={theme.cardBackground.val}
            title=""
          />
        ) : undefined
      }
    >
      <YStack
        flex={1}
        padding="$4"
        paddingTop={Platform.OS === 'web' ? '$4' : insets.top + 16}
        gap="$5"
        backgroundColor="$background"
      >
        {/* Header */}
        <FadeIn>
          <YStack gap="$1">
            <H2 color="$color">{greeting}</H2>
            <Text color="$mutedText" fontSize="$3">{t('home.subtitle')}</Text>
          </YStack>
        </FadeIn>

        {/* Stats */}
        <SlideIn from="bottom" delay={100}>
          <CoachMark stepId="home-stats" scrollRef={scrollRef}>
            <XStack gap="$3">
              <StatCard value="12" label={t('home.activeProjects')} icon="folder-outline" color={theme.accent.val} />
              <StatCard value="48" label={t('home.completedTasks')} icon="checkmark-circle-outline" color={theme.success.val} />
              <StatCard value="8" label={t('home.teamMembers')} icon="people-outline" color={theme.secondary.val} />
            </XStack>
          </CoachMark>
        </SlideIn>

        {/* Quick Actions */}
        <SlideIn from="bottom" delay={200}>
          <CoachMark stepId="home-actions" scrollRef={scrollRef}>
            <YStack gap="$3">
              <Text fontWeight="600" fontSize="$4" color="$color">{t('home.quickActions')}</Text>
              <XStack gap="$3" flexWrap="wrap">
                <AppButton variant="accent" size="sm" onPress={() => {}}>
                  <XStack gap="$2" alignItems="center">
                    <Plus size={16} color={theme.background.val} />
                    <Text color="$background" fontWeight="600" fontSize="$2">{t('home.newProject')}</Text>
                  </XStack>
                </AppButton>
                <AppButton variant="outline" size="sm" onPress={() => {}}>
                  <XStack gap="$2" alignItems="center">
                    <List size={16} color={theme.color.val} />
                    <Text color="$color" fontSize="$2">{t('home.viewTasks')}</Text>
                  </XStack>
                </AppButton>
                <AppButton variant="outline" size="sm" onPress={() => {}}>
                  <XStack gap="$2" alignItems="center">
                    <BarChart3 size={16} color={theme.color.val} />
                    <Text color="$color" fontSize="$2">{t('home.analytics')}</Text>
                  </XStack>
                </AppButton>
              </XStack>
            </YStack>
          </CoachMark>
        </SlideIn>

        {/* Recent Activity */}
        <SlideIn from="bottom" delay={300}>
          <AppCard>
            <Text fontWeight="600" fontSize="$4" color="$color" marginBottom="$3">{t('home.recentActivity')}</Text>
            <AnimatedListItem index={0}>
              <ActivityItem text={t('home.activity1')} time="2m ago" icon="folder-outline" color={theme.accent.val} />
            </AnimatedListItem>
            <AnimatedListItem index={1}>
              <ActivityItem text={t('home.activity2')} time="1h ago" icon="person-add-outline" color={theme.secondary.val} />
            </AnimatedListItem>
            <AnimatedListItem index={2}>
              <ActivityItem text={t('home.activity3')} time="3h ago" icon="checkmark-done-outline" color={theme.accent.val} />
            </AnimatedListItem>
            <AnimatedListItem index={3}>
              <ActivityItem text={t('home.activity4')} time="5h ago" icon="rocket-outline" color={theme.secondary.val} />
            </AnimatedListItem>
          </AppCard>
        </SlideIn>

        {/* Notes — authenticated users */}
        {isAuthenticated && (
          <CoachMark stepId="home-notes" scrollRef={scrollRef}>
            <NotesSection />
          </CoachMark>
        )}

        {/* Sign in CTA for guests */}
        {!isAuthenticated && (
          <SlideIn from="bottom" delay={400}>
            <AppCard borderColor="$accent" borderWidth={0.5}>
              <YStack gap="$3" alignItems="center">
                <Text fontWeight="600" fontSize="$3" color="$color" textAlign="center">
                  {t('profile.signInPrompt')}
                </Text>
                <XStack gap="$3">
                  <AppButton size="sm" onPress={() => router.push('/sign-in')}>
                    {t('auth.signIn')}
                  </AppButton>
                  <AppButton size="sm" variant="outline" onPress={() => router.push('/sign-up')}>
                    {t('auth.createAccount')}
                  </AppButton>
                </XStack>
              </YStack>
            </AppCard>
          </SlideIn>
        )}
      </YStack>
    </ScrollView>
  )
}

function NotesSection() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { notes, addNote, deleteNote } = useNotesStore()
  const [newNote, setNewNote] = useState('')

  const handleAdd = () => {
    const trimmed = newNote.trim()
    if (!trimmed) return
    addNote(trimmed)
    setNewNote('')
  }

  return (
    <SlideIn from="bottom" delay={400}>
      <AppCard>
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
          <XStack gap="$2" alignItems="center">
            <FileText size={18} color={theme.accent.val} />
            <Text fontWeight="600" fontSize="$4" color="$color">{t('interactive.notes')}</Text>
          </XStack>
          <Text fontSize="$1" color="$mutedText">{notes.length}</Text>
        </XStack>

        <XStack gap="$2" marginBottom="$3">
          <Input
            flex={1}
            placeholder={t('interactive.notePlaceholder')}
            value={newNote}
            onChangeText={setNewNote}
            onSubmitEditing={handleAdd}
            backgroundColor="$subtleBackground"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$3"
            paddingHorizontal="$3"
            height={40}
            fontSize="$2"
            color="$color"
            placeholderTextColor="$placeholderColor"
          />
          <ScalePress onPress={handleAdd}>
            <YStack
              width={40}
              height={40}
              borderRadius="$3"
              backgroundColor="$accent"
              alignItems="center"
              justifyContent="center"
            >
              <Plus size={20} color="white" />
            </YStack>
          </ScalePress>
        </XStack>

        {notes.length === 0 ? (
          <Text color="$mutedText" fontSize="$2" textAlign="center" paddingVertical="$3">
            {t('interactive.noteEmpty')}
          </Text>
        ) : (
          <YStack gap="$2">
            {notes.slice(0, 5).map((note, idx) => (
              <AnimatedListItem key={note.id} index={idx}>
                <XStack
                  gap="$3"
                  alignItems="center"
                  paddingVertical="$2"
                  paddingHorizontal="$3"
                  backgroundColor="$subtleBackground"
                  borderRadius="$2"
                >
                  <Text flex={1} fontSize="$2" color="$color" numberOfLines={2}>{note.text}</Text>
                  <ScalePress onPress={() => deleteNote(note.id)}>
                    <XCircle size={18} color={theme.mutedText.val} />
                  </ScalePress>
                </XStack>
              </AnimatedListItem>
            ))}
          </YStack>
        )}
      </AppCard>
    </SlideIn>
  )
}
