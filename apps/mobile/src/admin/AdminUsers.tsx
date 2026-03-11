import React from 'react'
import { FlatList, Alert } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppAvatar, AppButton, AppCard, AppSwitch, AppModal, ScalePress } from '@mvp/ui'
import { ChevronRight } from 'lucide-react-native'
import { type AdminUser, type AdminConfig, FEATURE_LABELS, ROLE_COLORS } from './types'
import { api } from '../services/api'

interface AdminUsersTabProps {
  users: AdminUser[]
  loading: boolean
  config: AdminConfig | null
  onLoadMore: () => void
  onUserUpdated: (userId: string, role: string, features: string[]) => void
}

export function AdminUsersTab({ users, loading, config, onLoadMore, onUserUpdated }: AdminUsersTabProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null)
  const [editRole, setEditRole] = React.useState('')
  const [editFeatures, setEditFeatures] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)

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
      onUserUpdated(selectedUser.id, editRole, editFeatures)
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
          <ChevronRight size={18} color={theme.mutedText.val} />
        </XStack>
      </AppCard>
    </ScalePress>
  )

  return (
    <>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
        onEndReached={onLoadMore}
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
      <AppModal
        visible={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name ?? ''}
        maxWidth={480}
      >
        <YStack gap="$4">
          <Text color="$mutedText" fontSize="$3" fontFamily="$body">{selectedUser?.email}</Text>

          {/* Role Selection */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$color" fontSize="$4" fontFamily="$body">
              {t('admin.role')}
            </Text>
            <XStack gap="$2" flexWrap="wrap">
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
                      fontFamily="$body"
                    >
                      {t(`admin.role${role.charAt(0).toUpperCase() + role.slice(1)}`)}
                    </Text>
                  </XStack>
                </ScalePress>
              ))}
            </XStack>
          </YStack>

          {/* Features */}
          <YStack gap="$2">
            <Text fontWeight="600" color="$color" fontSize="$4" fontFamily="$body">
              {t('admin.features')}
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              {(config?.features ?? Object.keys(FEATURE_LABELS)).map((feature) => (
                <XStack
                  key={feature}
                  alignItems="center"
                  justifyContent="space-between"
                  backgroundColor="$subtleBackground"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$3"
                  minWidth={200}
                  flexBasis="48%"
                  flexGrow={1}
                >
                  <Text color="$color" fontSize="$3" fontFamily="$body">
                    {FEATURE_LABELS[feature] ?? feature}
                  </Text>
                  <AppSwitch
                    checked={editFeatures.includes(feature)}
                    onCheckedChange={() => toggleFeature(feature)}
                  />
                </XStack>
              ))}
            </XStack>
          </YStack>

          {/* Action buttons */}
          <XStack gap="$3" marginTop="$2" justifyContent="flex-end">
            <AppButton variant="outline" onPress={() => setSelectedUser(null)} size="md">
              {t('admin.proxyCancel')}
            </AppButton>
            <AppButton onPress={handleSaveUser} disabled={saving} size="md">
              {saving ? t('common.loading') : t('admin.saveChanges')}
            </AppButton>
          </XStack>
        </YStack>
      </AppModal>
    </>
  )
}
