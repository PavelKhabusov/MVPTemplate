import { useState, useEffect, useCallback } from 'react'
import { FlatList, Platform, Modal, Alert } from 'react-native'
import { YStack, XStack, Text, H2, H4, Input, useTheme, Switch } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppAvatar, AppButton, AppCard, FadeIn, SlideIn, ScalePress } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../src/services/api'

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

export default function AdminScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [config, setConfig] = useState<AdminConfig | null>(null)
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
      const [usersRes, statsRes, configRes] = await Promise.all([
        api.get('/admin/users', { params }),
        api.get('/admin/stats'),
        api.get('/admin/config'),
      ])
      setUsers(usersRes.data.data)
      setTotalPages(usersRes.data.pagination?.totalPages ?? 1)
      setStats(statsRes.data.data)
      setConfig(configRes.data.data)
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
    } finally {
      setLoading(false)
    }
  }, [t])

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
      <YStack padding="$4" paddingTop={Platform.OS === 'web' ? '$4' : 16} gap="$4">
        {/* Stats */}
        {stats && (
          <FadeIn>
            <XStack gap="$3">
              <AppCard flex={1}>
                <YStack alignItems="center" gap="$1">
                  <Text fontSize="$7" fontWeight="bold" color="$accent">{stats.totalUsers}</Text>
                  <Text fontSize="$1" color="$mutedText">{t('admin.totalUsers')}</Text>
                </YStack>
              </AppCard>
              <AppCard flex={1}>
                <YStack alignItems="center" gap="$1">
                  <Text fontSize="$7" fontWeight="bold" color="$accent">{stats.newThisWeek}</Text>
                  <Text fontSize="$1" color="$mutedText">{t('admin.newThisWeek')}</Text>
                </YStack>
              </AppCard>
            </XStack>
          </FadeIn>
        )}

        {/* Search */}
        <SlideIn from="bottom" delay={100}>
          <XStack gap="$2" alignItems="center">
            <Input
              flex={1}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              placeholder={t('common.search')}
              placeholderTextColor={theme.mutedText.val}
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
      </YStack>

      {/* Users List */}
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
                <Switch
                  size="$3"
                  checked={editFeatures.includes(feature)}
                  onCheckedChange={() => toggleFeature(feature)}
                  backgroundColor={editFeatures.includes(feature) ? '$accent' : '$borderColor'}
                >
                  <Switch.Thumb animation="quick" />
                </Switch>
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
