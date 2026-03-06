import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView, Platform, Alert } from 'react-native'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { AppCard, FadeIn, SlideIn, ScalePress } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { useTemplateConfigStore, useTemplateFlag } from '@mvp/template-config'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@mvp/store'
import { api } from '../src/services/api'

import { type AdminUser, type AdminStats, type AdminConfig, type AnalyticsDashboard } from '../src/admin/types'
import { AdminAnalyticsTab } from '../src/admin/AdminAnalytics'
import { AdminUsersTab } from '../src/admin/AdminUsers'
import { AdminNotifyTab } from '../src/admin/AdminNotify'
import { PaymentsAdminTab } from '../src/admin/AdminPayments'
import { ApiSettingsTab } from '../src/admin/AdminApiSettings'
import { ProxyAdminTab } from '../src/admin/AdminProxy'
import { StorageAdminTab } from '../src/admin/AdminStorage'
import { CompanyInfoTab } from '../src/admin/AdminCompany'
import { TemplateConfigTab } from '../src/admin/AdminTemplateConfig'

const isTemplateConfigEnabled = process.env.EXPO_PUBLIC_ENABLE_TEMPLATE_CONFIG === 'true'

export default function AdminScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const router = useRouter()
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.user?.role)

  // Guard: redirect non-admins and unauthenticated users (wait for auth hydration)
  useEffect(() => {
    if (!isInitialized) return
    if (!isAuthenticated || userRole !== 'admin') {
      router.replace('/(tabs)/settings')
    }
  }, [isInitialized, isAuthenticated, userRole, router])

  const analyticsEnabled = useTemplateFlag('analytics', true)
  const docFeedbackEnabled = useTemplateFlag('docFeedback', true)
  const pushEnabled = useTemplateFlag('pushNotifications', false)
  const paymentsEnabled = useTemplateFlag('payments', false)
  const emailEnabled = useTemplateFlag('email', false)
  const aiEnabled = useTemplateFlag('ai', true)
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'notify' | 'payments' | 'storage' | 'proxy' | 'api' | 'config' | 'company'>(analyticsEnabled ? 'analytics' : 'users')

  useEffect(() => {
    if (!analyticsEnabled && activeTab === 'analytics') {
      setActiveTab('users')
    }
    if (!pushEnabled && !emailEnabled && activeTab === 'notify') {
      setActiveTab('users')
    }
    if (!aiEnabled && activeTab === 'proxy') {
      setActiveTab('users')
    }
  }, [analyticsEnabled, pushEnabled, emailEnabled, aiEnabled, activeTab])

  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [notifyHistory, setNotifyHistory] = useState<Array<{ title: string; body: string | null; createdAt: string; recipientCount: number }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await api.get('/push/history', { params: { limit: 50 } })
      setNotifyHistory(res.data.data)
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const fetchData = useCallback(async (p = 1, q = '') => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = { page: p, limit: 20 }
      if (q) params.search = q
      const [usersRes, statsRes, configRes, analyticsRes] = await Promise.all([
        api.get('/admin/users', { params }),
        api.get('/admin/stats'),
        api.get('/admin/config'),
        api.get('/analytics/dashboard', { params: { days: 30 } }).catch(() => null),
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
  }, [t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (pushEnabled && activeTab === 'notify') {
      fetchHistory()
    }
  }, [pushEnabled, activeTab, fetchHistory])

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

  const handleUserUpdated = (userId: string, role: string, features: string[]) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role, features } : u
      )
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack padding="$4" paddingTop={Platform.OS === 'web' ? '$4' : 16} gap="$3">
        {/* Tab Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$2">
            {analyticsEnabled && (
              <ScalePress onPress={() => setActiveTab('analytics')}>
                <XStack backgroundColor={activeTab === 'analytics' ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" gap="$1.5" alignItems="center">
                  <Ionicons name="bar-chart-outline" size={16} color={activeTab === 'analytics' ? 'white' : theme.accent.val} />
                  <Text color={activeTab === 'analytics' ? 'white' : '$color'} fontWeight="600" fontSize="$3">{t('admin.analytics')}</Text>
                </XStack>
              </ScalePress>
            )}
            <ScalePress onPress={() => setActiveTab('users')}>
              <XStack backgroundColor={activeTab === 'users' ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" gap="$1.5" alignItems="center">
                <Ionicons name="people-outline" size={16} color={activeTab === 'users' ? 'white' : theme.accent.val} />
                <Text color={activeTab === 'users' ? 'white' : '$color'} fontWeight="600" fontSize="$3">{t('admin.users')}</Text>
              </XStack>
            </ScalePress>
            {paymentsEnabled && (
              <ScalePress onPress={() => setActiveTab('payments')}>
                <XStack backgroundColor={activeTab === 'payments' ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" gap="$1.5" alignItems="center">
                  <Ionicons name="card-outline" size={16} color={activeTab === 'payments' ? 'white' : theme.accent.val} />
                  <Text color={activeTab === 'payments' ? 'white' : '$color'} fontWeight="600" fontSize="$3">{t('admin.payments')}</Text>
                </XStack>
              </ScalePress>
            )}
            {(pushEnabled || emailEnabled) && (
              <ScalePress onPress={() => setActiveTab('notify')}>
                <XStack backgroundColor={activeTab === 'notify' ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" gap="$1.5" alignItems="center">
                  <Ionicons name="notifications-outline" size={16} color={activeTab === 'notify' ? 'white' : theme.accent.val} />
                  <Text color={activeTab === 'notify' ? 'white' : '$color'} fontWeight="600" fontSize="$3">{t('admin.sendNotification')}</Text>
                </XStack>
              </ScalePress>
            )}
            <ScalePress onPress={() => setActiveTab('api')}>
              <XStack backgroundColor={activeTab === 'api' ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" gap="$1.5" alignItems="center">
                <Ionicons name="key-outline" size={16} color={activeTab === 'api' ? 'white' : theme.accent.val} />
                <Text color={activeTab === 'api' ? 'white' : '$color'} fontWeight="600" fontSize="$3">{t('admin.apiSettings')}</Text>
              </XStack>
            </ScalePress>
            <ScalePress onPress={() => setActiveTab('storage')}>
              <XStack backgroundColor={activeTab === 'storage' ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" gap="$1.5" alignItems="center">
                <Ionicons name="cloud-outline" size={16} color={activeTab === 'storage' ? 'white' : theme.accent.val} />
                <Text color={activeTab === 'storage' ? 'white' : '$color'} fontWeight="600" fontSize="$3">{t('admin.storage')}</Text>
              </XStack>
            </ScalePress>
            {aiEnabled && (
              <ScalePress onPress={() => setActiveTab('proxy')}>
                <XStack backgroundColor={activeTab === 'proxy' ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" gap="$1.5" alignItems="center">
                  <Ionicons name="git-network-outline" size={16} color={activeTab === 'proxy' ? 'white' : theme.accent.val} />
                  <Text color={activeTab === 'proxy' ? 'white' : '$color'} fontWeight="600" fontSize="$3">{t('admin.proxyTab')}</Text>
                </XStack>
              </ScalePress>
            )}
            {isTemplateConfigEnabled && (
              <ScalePress onPress={() => {
                if (Platform.OS === 'web') {
                  const store = useTemplateConfigStore.getState()
                  store.setSidebarOpen(!store.sidebarOpen)
                } else {
                  setActiveTab('config')
                }
              }}>
                <XStack backgroundColor={activeTab === 'config' ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" gap="$1.5" alignItems="center">
                  <Ionicons name="color-palette-outline" size={16} color={activeTab === 'config' ? 'white' : theme.accent.val} />
                  <Text color={activeTab === 'config' ? 'white' : '$color'} fontWeight="600" fontSize="$3">{t('templateConfig.title')}</Text>
                </XStack>
              </ScalePress>
            )}
            <ScalePress onPress={() => setActiveTab('company')}>
              <XStack backgroundColor={activeTab === 'company' ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" gap="$1.5" alignItems="center">
                <Ionicons name="business-outline" size={16} color={activeTab === 'company' ? 'white' : theme.accent.val} />
                <Text color={activeTab === 'company' ? 'white' : '$color'} fontWeight="600" fontSize="$3">{t('admin.companyTab')}</Text>
              </XStack>
            </ScalePress>
          </XStack>
        </ScrollView>

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
        <AdminAnalyticsTab
          data={analyticsData}
          loading={loading}
          docFeedbackEnabled={docFeedbackEnabled}
        />
      )}

      {/* Users List */}
      {activeTab === 'users' && (
        <AdminUsersTab
          users={users}
          loading={loading}
          config={config}
          onLoadMore={handleLoadMore}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Notify Tab */}
      {(pushEnabled || emailEnabled) && activeTab === 'notify' && (
        <AdminNotifyTab
          pushEnabled={pushEnabled}
          emailEnabled={emailEnabled}
          notifyHistory={notifyHistory}
          historyLoading={historyLoading}
          onFetchHistory={fetchHistory}
        />
      )}

      {/* Payments Tab */}
      {paymentsEnabled && activeTab === 'payments' && (
        <PaymentsAdminTab />
      )}

      {/* Storage Tab */}
      {activeTab === 'storage' && (
        <StorageAdminTab />
      )}

      {/* Proxy Tab */}
      {aiEnabled && activeTab === 'proxy' && (
        <ProxyAdminTab />
      )}

      {/* API Settings Tab */}
      {activeTab === 'api' && (
        <ApiSettingsTab />
      )}

      {/* Template Config Tab */}
      {isTemplateConfigEnabled && activeTab === 'config' && (
        <TemplateConfigTab />
      )}

      {/* Company Info Tab */}
      {activeTab === 'company' && (
        <CompanyInfoTab />
      )}
    </YStack>
  )
}
