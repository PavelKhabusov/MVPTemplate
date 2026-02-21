import React, { useState, useEffect, useCallback } from 'react'
import { FlatList, Platform, Modal, Alert, ScrollView, useWindowDimensions } from 'react-native'
import { YStack, XStack, Text, H2, H4, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppAvatar, AppButton, AppCard, AppSwitch, FadeIn, SlideIn, ScalePress } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg'
import { useTemplateConfigStore, useTemplateFlag } from '@mvp/template-config'
import { api } from '../src/services/api'

const isTemplateConfigEnabled = process.env.EXPO_PUBLIC_ENABLE_TEMPLATE_CONFIG === 'true'

interface AdminUser {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  bio?: string | null
  phone?: string | null
  location?: string | null
  role: string
  features: string[]
  createdAt: string
}

interface AdminStats {
  totalUsers: number
  newThisWeek: number
}

interface AdminConfig {
  roles: string[]
  features: string[]
}

interface AnalyticsDashboard {
  activeUsers: { dau: number; wau: number; mau: number }
  registrations: Array<{ day: string; count: number }>
  popularScreens: Array<{ screenName: string; views: number }>
  dailyActivity: Array<{ day: string; events: number; uniqueUsers: number }>
  avgSessionTime: number
}

const FEATURE_LABELS: Record<string, string> = {
  beta_access: 'Beta Access',
  premium: 'Premium',
  push_notifications: 'Push Notifications',
  advanced_analytics: 'Advanced Analytics',
  api_access: 'API Access',
  custom_theme: 'Custom Theme',
  export_data: 'Export Data',
  priority_support: 'Priority Support',
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444',
  moderator: '#F59E0B',
  user: '#6B7280',
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function ScreensBarChart({ data }: { data: Array<{ screenName: string; views: number }> }) {
  const theme = useTheme()
  const { width: screenWidth } = useWindowDimensions()

  if (!data || data.length === 0) {
    return <Text color="$mutedText" fontSize="$2">No data yet</Text>
  }

  const maxViews = Math.max(...data.map((d) => d.views), 1)
  const chartWidth = Math.min(screenWidth - 80, 400)
  const rowHeight = 28
  const chartHeight = data.length * rowHeight
  const labelWidth = 100
  const barAreaWidth = chartWidth - labelWidth - 50

  return (
    <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
      {data.map((d, i) => {
        const barWidth = Math.max((d.views / maxViews) * barAreaWidth, 4)
        const y = i * rowHeight
        return (
          <React.Fragment key={d.screenName}>
            <SvgText x={0} y={y + 18} fontSize={11} fill={theme.color.val}>
              {d.screenName.length > 14 ? d.screenName.slice(0, 13) + '…' : d.screenName}
            </SvgText>
            <Rect
              x={labelWidth}
              y={y + 5}
              width={barWidth}
              height={16}
              rx={4}
              fill={theme.accent.val}
              opacity={0.8}
            />
            <SvgText
              x={labelWidth + barWidth + 6}
              y={y + 18}
              fontSize={11}
              fill={theme.mutedText.val}
            >
              {d.views}
            </SvgText>
          </React.Fragment>
        )
      })}
    </Svg>
  )
}

function SimpleBarChart({ data }: { data: Array<{ day: string; events: number; uniqueUsers: number }> }) {
  const theme = useTheme()
  const { width: screenWidth } = useWindowDimensions()

  if (!data || data.length === 0) {
    return <Text color="$mutedText" fontSize="$2">No data yet</Text>
  }

  const maxEvents = Math.max(...data.map((d) => d.events), 1)
  const chartWidth = Math.min(screenWidth - 80, 400)
  const chartHeight = 120
  const barWidth = Math.max(4, (chartWidth - 20) / data.length - 2)

  return (
    <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
      <Line
        x1={0} y1={chartHeight - 15}
        x2={chartWidth} y2={chartHeight - 15}
        stroke={theme.borderColor.val} strokeWidth={0.5}
      />
      {data.map((d, i) => {
        const barHeight = (d.events / maxEvents) * (chartHeight - 25)
        const x = 10 + i * (barWidth + 2)
        const y = chartHeight - 15 - barHeight
        return (
          <Rect
            key={d.day}
            x={x} y={y}
            width={barWidth} height={Math.max(barHeight, 1)}
            rx={2}
            fill={theme.accent.val}
            opacity={0.85}
          />
        )
      })}
      <SvgText x={10} y={chartHeight - 2} fontSize={8} fill={theme.mutedText.val}>
        {formatShortDate(data[0].day)}
      </SvgText>
      <SvgText x={chartWidth - 40} y={chartHeight - 2} fontSize={8} fill={theme.mutedText.val}>
        {formatShortDate(data[data.length - 1].day)}
      </SvgText>
    </Svg>
  )
}

export default function AdminScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const analyticsEnabled = useTemplateFlag('analytics', true)
  const [activeTab, setActiveTab] = useState<'analytics' | 'users'>(analyticsEnabled ? 'analytics' : 'users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editFeatures, setEditFeatures] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async (p = 1, q = '') => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = { page: p, limit: 20 }
      if (q) params.search = q
      const [usersRes, statsRes, configRes, analyticsRes] = await Promise.all([
        api.get('/admin/users', { params }),
        api.get('/admin/stats'),
        api.get('/admin/config'),
        analyticsEnabled
          ? api.get('/analytics/dashboard', { params: { days: 30 } }).catch(() => null)
          : Promise.resolve(null),
      ])
      setUsers(usersRes.data.data)
      setTotalPages(usersRes.data.pagination?.totalPages ?? 1)
      setStats(statsRes.data.data)
      setConfig(configRes.data.data)
      if (analyticsRes) setAnalyticsData(analyticsRes.data.data)
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
    } finally {
      setLoading(false)
    }
  }, [t, analyticsEnabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = useCallback(() => {
    setPage(1)
    fetchData(1, search.trim())
  }, [search, fetchData])

  const handleLoadMore = useCallback(() => {
    if (page < totalPages) {
      const next = page + 1
      setPage(next)
      api.get('/admin/users', { params: { page: next, limit: 20, search: search.trim() || undefined } })
        .then((res) => {
          setUsers((prev) => [...prev, ...res.data.data])
        })
    }
  }, [page, totalPages, search])

  const openUserEditor = (user: AdminUser) => {
    setSelectedUser(user)
    setEditRole(user.role)
    setEditFeatures([...user.features])
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      await api.patch(`/admin/users/${selectedUser.id}`, {
        role: editRole,
        features: editFeatures,
      })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: editRole, features: editFeatures } : u
        )
      )
      setSelectedUser(null)
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  const toggleFeature = (feature: string) => {
    setEditFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    )
  }

  const renderUser = ({ item }: { item: AdminUser }) => (
    <ScalePress onPress={() => openUserEditor(item)}>
      <AppCard marginBottom="$2">
        <XStack alignItems="center" gap="$3">
          <AppAvatar name={item.name} uri={item.avatarUrl} size={44} />
          <YStack flex={1} gap="$1">
            <XStack alignItems="center" gap="$2">
              <Text fontWeight="600" color="$color" fontSize="$3" numberOfLines={1} flex={1}>
                {item.name}
              </Text>
              <XStack
                backgroundColor={ROLE_COLORS[item.role] ?? ROLE_COLORS.user}
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
              >
                <Text color="white" fontSize="$1" fontWeight="600">
                  {item.role.toUpperCase()}
                </Text>
              </XStack>
            </XStack>
            <Text color="$mutedText" fontSize="$2" numberOfLines={1}>{item.email}</Text>
            {item.features.length > 0 && (
              <Text color="$accent" fontSize="$1" numberOfLines={1}>
                {item.features.length} feature{item.features.length !== 1 ? 's' : ''}
              </Text>
            )}
          </YStack>
          <Ionicons name="chevron-forward" size={18} color={theme.mutedText.val} />
        </XStack>
      </AppCard>
    </ScalePress>
  )

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack padding="$4" paddingTop={Platform.OS === 'web' ? '$4' : 16} gap="$3">
        {/* Tab Switcher */}
        <XStack gap="$2">
          {analyticsEnabled && (
            <ScalePress onPress={() => setActiveTab('analytics')}>
              <XStack
                backgroundColor={activeTab === 'analytics' ? '$accent' : '$subtleBackground'}
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$3"
              >
                <Text color={activeTab === 'analytics' ? 'white' : '$color'} fontWeight="600" fontSize="$3">
                  {t('admin.analytics')}
                </Text>
              </XStack>
            </ScalePress>
          )}
          <ScalePress onPress={() => setActiveTab('users')}>
            <XStack
              backgroundColor={activeTab === 'users' ? '$accent' : '$subtleBackground'}
              paddingHorizontal="$3"
              paddingVertical="$2"
              borderRadius="$3"
            >
              <Text color={activeTab === 'users' ? 'white' : '$color'} fontWeight="600" fontSize="$3">
                {t('admin.users')}
              </Text>
            </XStack>
          </ScalePress>
          {Platform.OS === 'web' && isTemplateConfigEnabled && (
            <ScalePress onPress={() => useTemplateConfigStore.getState().setSidebarOpen(true)}>
              <XStack
                backgroundColor="$subtleBackground"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$3"
                gap="$1.5"
                alignItems="center"
              >
                <Ionicons name="construct-outline" size={16} color={theme.accent.val} />
                <Text color="$color" fontWeight="600" fontSize="$3">
                  {t('templateConfig.title')}
                </Text>
              </XStack>
            </ScalePress>
          )}
        </XStack>

        {/* Users Tab — Stats + Search */}
        {activeTab === 'users' && (
          <>
            {stats && (
              <FadeIn>
                <XStack gap="$3">
                  <AppCard flex={1} animated={false}>
                    <YStack alignItems="center" gap="$1">
                      <Text fontSize="$7" fontWeight="bold" color="$accent">{stats.totalUsers}</Text>
                      <Text fontSize="$1" color="$mutedText">{t('admin.totalUsers')}</Text>
                    </YStack>
                  </AppCard>
                  <AppCard flex={1} animated={false}>
                    <YStack alignItems="center" gap="$1">
                      <Text fontSize="$7" fontWeight="bold" color="$accent">{stats.newThisWeek}</Text>
                      <Text fontSize="$1" color="$mutedText">{t('admin.newThisWeek')}</Text>
                    </YStack>
                  </AppCard>
                </XStack>
              </FadeIn>
            )}

            <SlideIn from="bottom" delay={100}>
              <XStack gap="$2" alignItems="center">
                <Input
                  flex={1}
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={handleSearch}
                  placeholder={t('common.search')}
                  placeholderTextColor={theme.mutedText.val as any}
                  backgroundColor="$subtleBackground"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$3"
                  paddingHorizontal="$3"
                  height={42}
                  fontSize="$3"
                  color="$color"
                  returnKeyType="search"
                />
                <ScalePress onPress={handleSearch}>
                  <YStack
                    backgroundColor="$accent"
                    width={42}
                    height={42}
                    borderRadius="$3"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Ionicons name="search" size={20} color="white" />
                  </YStack>
                </ScalePress>
              </XStack>
            </SlideIn>
          </>
        )}
      </YStack>

      {/* Analytics Tab */}
      {analyticsEnabled && activeTab === 'analytics' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
          {analyticsData ? (
            <FadeIn>
              <YStack gap="$3">
                {/* DAU / WAU / MAU */}
                <XStack gap="$2">
                  <AppCard flex={1} animated={false}>
                    <YStack alignItems="center" gap="$1">
                      <Text fontSize="$6" fontWeight="bold" color="$accent">
                        {analyticsData.activeUsers.dau}
                      </Text>
                      <Text fontSize="$1" color="$mutedText">DAU</Text>
                    </YStack>
                  </AppCard>
                  <AppCard flex={1} animated={false}>
                    <YStack alignItems="center" gap="$1">
                      <Text fontSize="$6" fontWeight="bold" color="$accent">
                        {analyticsData.activeUsers.wau}
                      </Text>
                      <Text fontSize="$1" color="$mutedText">WAU</Text>
                    </YStack>
                  </AppCard>
                  <AppCard flex={1} animated={false}>
                    <YStack alignItems="center" gap="$1">
                      <Text fontSize="$6" fontWeight="bold" color="$accent">
                        {analyticsData.activeUsers.mau}
                      </Text>
                      <Text fontSize="$1" color="$mutedText">MAU</Text>
                    </YStack>
                  </AppCard>
                </XStack>

                {/* Avg Session */}
                <AppCard animated={false}>
                  <YStack alignItems="center" gap="$1">
                    <Text fontSize="$6" fontWeight="bold" color="$accent">
                      {formatDuration(analyticsData.avgSessionTime)}
                    </Text>
                    <Text fontSize="$1" color="$mutedText">{t('admin.avgSession')}</Text>
                  </YStack>
                </AppCard>

                {/* Activity Chart */}
                <AppCard animated={false}>
                  <Text fontWeight="600" color="$color" fontSize="$3" marginBottom="$2">
                    {t('admin.dailyActivity')}
                  </Text>
                  <SimpleBarChart data={analyticsData.dailyActivity} />
                </AppCard>

                {/* Popular Screens */}
                {analyticsData.popularScreens.length > 0 && (
                  <AppCard animated={false}>
                    <Text fontWeight="600" color="$color" fontSize="$3" marginBottom="$2">
                      {t('admin.popularScreens')}
                    </Text>
                    <ScreensBarChart data={analyticsData.popularScreens} />
                  </AppCard>
                )}
              </YStack>
            </FadeIn>
          ) : (
            <YStack alignItems="center" padding="$6">
              <Text color="$mutedText">{loading ? t('common.loading') : t('admin.noData')}</Text>
            </YStack>
          )}
        </ScrollView>
      )}

      {/* Users List */}
      {activeTab === 'users' && (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !loading ? (
              <YStack alignItems="center" padding="$6">
                <Text color="$mutedText">{t('admin.noUsers')}</Text>
              </YStack>
            ) : null
          }
        />
      )}

      {/* Edit User Modal */}
      <Modal
        visible={!!selectedUser}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedUser(null)}
      >
        <YStack
          flex={1}
          backgroundColor="$background"
          padding="$4"
          paddingTop={Platform.OS === 'ios' ? 60 : '$4'}
        >
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
            <H4 color="$color">{selectedUser?.name}</H4>
            <ScalePress onPress={() => setSelectedUser(null)}>
              <Ionicons name="close" size={24} color={theme.color.val} />
            </ScalePress>
          </XStack>

          <Text color="$mutedText" fontSize="$3" marginBottom="$4">{selectedUser?.email}</Text>

          {/* Role Selection */}
          <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$2">
            {t('admin.role')}
          </Text>
          <XStack gap="$2" marginBottom="$5" flexWrap="wrap">
            {(config?.roles ?? ['user', 'admin', 'moderator']).map((role) => (
              <ScalePress key={role} onPress={() => setEditRole(role)}>
                <XStack
                  backgroundColor={editRole === role ? '$accent' : '$subtleBackground'}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$3"
                  borderWidth={1}
                  borderColor={editRole === role ? '$accent' : '$borderColor'}
                >
                  <Text
                    color={editRole === role ? 'white' : '$color'}
                    fontWeight="600"
                    fontSize="$3"
                  >
                    {t(`admin.role${role.charAt(0).toUpperCase() + role.slice(1)}`)}
                  </Text>
                </XStack>
              </ScalePress>
            ))}
          </XStack>

          {/* Features */}
          <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$2">
            {t('admin.features')}
          </Text>
          <YStack gap="$2" marginBottom="$5">
            {(config?.features ?? Object.keys(FEATURE_LABELS)).map((feature) => (
              <XStack
                key={feature}
                alignItems="center"
                justifyContent="space-between"
                backgroundColor="$subtleBackground"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$3"
              >
                <Text color="$color" fontSize="$3">
                  {FEATURE_LABELS[feature] ?? feature}
                </Text>
                <AppSwitch
                  checked={editFeatures.includes(feature)}
                  onCheckedChange={() => toggleFeature(feature)}
                />
              </XStack>
            ))}
          </YStack>

          <AppButton onPress={handleSaveUser} disabled={saving}>
            {saving ? t('common.loading') : t('admin.saveChanges')}
          </AppButton>
        </YStack>
      </Modal>
    </YStack>
  )
}
