import React, { useState, useEffect, useCallback, type ReactNode } from 'react'
import { FlatList, Platform, Modal, Alert, ScrollView, useWindowDimensions, Linking, Pressable } from 'react-native'
import { YStack, XStack, Text, H2, H4, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppAvatar, AppButton, AppCard, AppSwitch, FadeIn, SlideIn, ScalePress, useToast } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg'
import {
  useTemplateConfigStore,
  useTemplateFlag,
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
import { useRouter } from 'expo-router'
import { useAuthStore } from '@mvp/store'
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

interface DocFeedbackStat {
  pageId: string
  likes: number
  dislikes: number
  total: number
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

/* ─── Reusable Admin Modal ─────────────────────────────────────────── */
function AdminModal({
  visible,
  onClose,
  title,
  maxWidth = 520,
  children,
}: {
  visible: boolean
  onClose: () => void
  title: string
  maxWidth?: number
  children: ReactNode
}) {
  const theme = useTheme()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const isWide = screenWidth > 600

  if (Platform.OS !== 'web') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <YStack
          flex={1}
          backgroundColor="$background"
          padding="$4"
          paddingTop={Platform.OS === 'ios' ? 60 : '$4'}
        >
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
            <H4 color="$color" fontFamily="$body">{title}</H4>
            <ScalePress onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.color.val} />
            </ScalePress>
          </XStack>
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </YStack>
      </Modal>
    )
  }

  if (!visible) return null

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={10000}
      alignItems="center"
      justifyContent="center"
    >
      {/* Backdrop */}
      <Pressable
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
      />
      {/* Content */}
      <YStack
        backgroundColor="$background"
        borderRadius="$4"
        width={isWide ? Math.min(maxWidth, screenWidth - 48) : screenWidth - 32}
        maxHeight={screenHeight - insets.top - insets.bottom - 48}
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={0.15}
        shadowRadius={24}
        elevation={8}
        overflow="hidden"
      >
        <XStack
          alignItems="center"
          justifyContent="space-between"
          padding="$4"
          paddingBottom="$3"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <H4 color="$color" fontFamily="$body">{title}</H4>
          <ScalePress onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.color.val} />
          </ScalePress>
        </XStack>
        <ScrollView style={{ maxHeight: screenHeight - insets.top - insets.bottom - 140 }} showsVerticalScrollIndicator={false}>
          <YStack padding="$4">
            {children}
          </YStack>
        </ScrollView>
      </YStack>
    </YStack>
  )
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

interface AdminPlan {
  id: string
  name: string
  description: string | null
  priceAmount: number
  currency: string
  interval: string
  features: string[]
  provider: string
  providerPriceId: string | null
  isActive: boolean
  sortOrder: number
}

function PaymentsAdminTab() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [stats, setStats] = useState<{
    totalRevenue: Array<{ total: number; currency: string }>
    activeSubscriptions: number
    recentPayments: Array<{
      id: string
      userId: string
      amount: number
      currency: string
      status: string
      type: string
      provider: string
      description: string | null
      createdAt: string
    }>
  } | null>(null)
  const [adminPlans, setAdminPlans] = useState<AdminPlan[]>([])
  const [loading, setLoading] = useState(true)

  // Create plan form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [planName, setPlanName] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [planPrice, setPlanPrice] = useState('')
  const [planCurrency, setPlanCurrency] = useState('usd')
  const [planInterval, setPlanInterval] = useState<'month' | 'year' | 'one_time'>('month')
  const [planProvider, setPlanProvider] = useState<'stripe' | 'yookassa' | 'robokassa' | 'paypal'>('stripe')
  const [planProviderPriceId, setPlanProviderPriceId] = useState('')
  const [planFeatures, setPlanFeatures] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit plan state
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editFeatures, setEditFeatures] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, plansRes] = await Promise.all([
        api.get('/payments/admin/stats'),
        api.get('/payments/admin/plans'),
      ])
      setStats(statsRes.data.data)
      setAdminPlans(plansRes.data.data ?? [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreatePlan = async () => {
    if (!planName.trim()) return
    setCreating(true)
    try {
      const priceAmount = Math.round(parseFloat(planPrice || '0') * 100)
      await api.post('/payments/admin/plans', {
        name: planName.trim(),
        description: planDescription.trim() || undefined,
        priceAmount,
        currency: planCurrency.trim().toLowerCase() || 'usd',
        interval: planInterval,
        provider: planProvider,
        providerPriceId: planProviderPriceId.trim() || undefined,
        features: planFeatures
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
      })
      setPlanName('')
      setPlanDescription('')
      setPlanPrice('')
      setPlanProviderPriceId('')
      setPlanFeatures('')
      setShowCreateForm(false)
      fetchData()
      Alert.alert(t('admin.planCreated'))
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
    } finally {
      setCreating(false)
    }
  }

  const openEditPlan = (plan: AdminPlan) => {
    setEditingPlan(plan)
    setEditName(plan.name)
    setEditDescription(plan.description ?? '')
    setEditPrice(String(plan.priceAmount / 100))
    setEditFeatures(plan.features.join('\n'))
  }

  const handleSaveEdit = async () => {
    if (!editingPlan) return
    setSavingEdit(true)
    try {
      await api.patch(`/payments/admin/plans/${editingPlan.id}`, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        priceAmount: Math.round(parseFloat(editPrice || '0') * 100),
        features: editFeatures.split('\n').map((f) => f.trim()).filter(Boolean),
      })
      setEditingPlan(null)
      fetchData()
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
    } finally {
      setSavingEdit(false)
    }
  }

  const handleToggleActive = async (plan: AdminPlan) => {
    try {
      await api.patch(`/payments/admin/plans/${plan.id}`, { isActive: !plan.isActive })
      fetchData()
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
    }
  }

  const performDeletePlan = async (plan: AdminPlan) => {
    try {
      await api.delete(`/payments/admin/plans/${plan.id}`)
      setAdminPlans((prev) => prev.filter((p) => p.id !== plan.id))
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
    }
  }

  const handleDeletePlan = (plan: AdminPlan) => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('admin.deletePlanConfirm'))) {
        performDeletePlan(plan)
      }
    } else {
      Alert.alert(t('admin.deletePlan'), t('admin.deletePlanConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => performDeletePlan(plan),
        },
      ])
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    const value = amount / 100
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
      }).format(value)
    } catch {
      return `${value} ${currency.toUpperCase()}`
    }
  }

  const INTERVALS: Array<{ value: 'month' | 'year' | 'one_time'; label: string }> = [
    { value: 'month', label: t('payments.perMonth') },
    { value: 'year', label: t('payments.perYear') },
    { value: 'one_time', label: t('payments.one_time') },
  ]

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
      <FadeIn>
        <YStack gap="$3">
          {loading ? (
            <Text color="$mutedText" textAlign="center" paddingVertical="$6">
              {t('common.loading')}
            </Text>
          ) : stats ? (
            <>
              <XStack gap="$3">
                <AppCard flex={1} animated={false}>
                  <YStack alignItems="center" gap="$1">
                    <Text fontSize="$6" fontWeight="bold" color="$accent">
                      {stats.totalRevenue.length > 0
                        ? stats.totalRevenue.map((r) => formatPrice(r.total, r.currency)).join(' / ')
                        : formatPrice(0, 'usd')}
                    </Text>
                    <Text fontSize="$1" color="$mutedText">{t('admin.revenue')}</Text>
                  </YStack>
                </AppCard>
                <AppCard flex={1} animated={false}>
                  <YStack alignItems="center" gap="$1">
                    <Text fontSize="$6" fontWeight="bold" color="$accent">
                      {stats.activeSubscriptions}
                    </Text>
                    <Text fontSize="$1" color="$mutedText">{t('admin.activeSubscriptions')}</Text>
                  </YStack>
                </AppCard>
              </XStack>

              {/* Existing Plans */}
              <AppCard animated={false}>
                <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$3">
                  {t('admin.existingPlans')}
                </Text>
                {adminPlans.length === 0 ? (
                  <Text color="$mutedText" fontSize="$2">{t('payments.noPlans')}</Text>
                ) : (
                  <YStack gap="$3">
                    {adminPlans.map((plan) => (
                      <YStack
                        key={plan.id}
                        borderWidth={1}
                        borderColor={plan.isActive ? '$borderColor' : '$borderColor'}
                        borderRadius="$3"
                        padding="$3"
                        gap="$2"
                        opacity={plan.isActive ? 1 : 0.5}
                      >
                        <XStack justifyContent="space-between" alignItems="center">
                          <YStack flex={1} gap="$1">
                            <XStack alignItems="center" gap="$2">
                              <Text fontWeight="700" color="$color" fontSize="$4">{plan.name}</Text>
                              {!plan.isActive && (
                                <XStack backgroundColor="$subtleBackground" paddingHorizontal="$1.5" paddingVertical={2} borderRadius="$1">
                                  <Text fontSize={10} color="$mutedText" fontWeight="600">{t('admin.inactive')}</Text>
                                </XStack>
                              )}
                            </XStack>
                            <Text color="$accent" fontWeight="700" fontSize="$3">
                              {formatPrice(plan.priceAmount, plan.currency)}
                              <Text color="$mutedText" fontWeight="400" fontSize="$2">
                                {' '}{plan.interval !== 'one_time' ? `/${plan.interval}` : ''}
                              </Text>
                            </Text>
                            <Text color="$mutedText" fontSize="$1">
                              {plan.provider} {plan.providerPriceId ? `· ${plan.providerPriceId}` : ''}
                            </Text>
                          </YStack>
                          <XStack gap="$2" alignItems="center">
                            <AppSwitch checked={plan.isActive} onCheckedChange={() => handleToggleActive(plan)} />
                          </XStack>
                        </XStack>
                        {plan.features.length > 0 && (
                          <XStack flexWrap="wrap" gap="$1">
                            {plan.features.map((f) => (
                              <XStack key={f} backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                                <Text fontSize="$1" color="$mutedText">{f}</Text>
                              </XStack>
                            ))}
                          </XStack>
                        )}
                        <XStack gap="$2">
                          <ScalePress onPress={() => openEditPlan(plan)}>
                            <XStack alignItems="center" gap="$1">
                              <Ionicons name="create-outline" size={14} color={theme.accent.val} />
                              <Text fontSize="$2" color="$accent">{t('admin.editPlan')}</Text>
                            </XStack>
                          </ScalePress>
                          <ScalePress onPress={() => handleDeletePlan(plan)}>
                            <XStack alignItems="center" gap="$1">
                              <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              <Text fontSize="$2" color="#EF4444">{t('admin.deletePlan')}</Text>
                            </XStack>
                          </ScalePress>
                        </XStack>

                        {/* Inline edit form */}
                        {editingPlan?.id === plan.id && (
                          <YStack gap="$2" marginTop="$2" borderTopWidth={1} borderTopColor="$borderColor" paddingTop="$2">
                            <Input value={editName} onChangeText={setEditName} placeholder={t('admin.planName')} placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={38} fontSize="$2" color="$color" />
                            <Input value={editDescription} onChangeText={setEditDescription} placeholder={t('admin.planDescription')} placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={38} fontSize="$2" color="$color" />
                            <Input value={editPrice} onChangeText={setEditPrice} placeholder={t('admin.planPrice')} placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={38} fontSize="$2" color="$color" keyboardType="decimal-pad" />
                            <Input value={editFeatures} onChangeText={setEditFeatures} placeholder={t('admin.planFeaturesPlaceholder')} placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={60} fontSize="$2" color="$color" multiline />
                            <XStack gap="$2">
                              <AppButton size="sm" onPress={handleSaveEdit} disabled={savingEdit} flex={1}>
                                {savingEdit ? t('common.loading') : t('admin.saveChanges')}
                              </AppButton>
                              <AppButton size="sm" variant="outline" onPress={() => setEditingPlan(null)} flex={1}>
                                {t('common.cancel')}
                              </AppButton>
                            </XStack>
                          </YStack>
                        )}
                      </YStack>
                    ))}
                  </YStack>
                )}
              </AppCard>

              {/* Create Plan */}
              <AppCard animated={false}>
                <ScalePress onPress={() => setShowCreateForm((v) => !v)}>
                  <XStack alignItems="center" justifyContent="space-between">
                    <Text fontWeight="600" color="$color" fontSize="$4">
                      {t('admin.createPlan')}
                    </Text>
                    <Ionicons
                      name={showCreateForm ? 'chevron-up' : 'add-circle-outline'}
                      size={22}
                      color={theme.accent.val}
                    />
                  </XStack>
                </ScalePress>

                {showCreateForm && (
                  <YStack gap="$3" marginTop="$3">
                    <Input value={planName} onChangeText={setPlanName} placeholder={t('admin.planName')} placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={42} fontSize="$3" color="$color" />
                    <Input value={planDescription} onChangeText={setPlanDescription} placeholder={t('admin.planDescription')} placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={42} fontSize="$3" color="$color" />
                    <XStack gap="$2">
                      <Input flex={1} value={planPrice} onChangeText={setPlanPrice} placeholder={t('admin.planPrice')} placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={42} fontSize="$3" color="$color" keyboardType="decimal-pad" />
                      <Input width={80} value={planCurrency} onChangeText={setPlanCurrency} placeholder="usd" placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={42} fontSize="$3" color="$color" />
                    </XStack>
                    <YStack gap="$1.5">
                      <Text fontSize="$2" color="$mutedText">{t('admin.planInterval')}</Text>
                      <XStack gap="$2" flexWrap="wrap">
                        {INTERVALS.map((opt) => (
                          <ScalePress key={opt.value} onPress={() => setPlanInterval(opt.value)}>
                            <XStack backgroundColor={planInterval === opt.value ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" borderWidth={1} borderColor={planInterval === opt.value ? '$accent' : '$borderColor'}>
                              <Text color={planInterval === opt.value ? 'white' : '$color'} fontWeight="600" fontSize="$2">{opt.label}</Text>
                            </XStack>
                          </ScalePress>
                        ))}
                      </XStack>
                    </YStack>
                    <YStack gap="$1.5">
                      <Text fontSize="$2" color="$mutedText">{t('admin.planProvider')}</Text>
                      <XStack gap="$2">
                        {(['stripe', 'yookassa', 'robokassa', 'paypal'] as const).map((p) => (
                          <ScalePress key={p} onPress={() => setPlanProvider(p)}>
                            <XStack backgroundColor={planProvider === p ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" borderWidth={1} borderColor={planProvider === p ? '$accent' : '$borderColor'}>
                              <Text color={planProvider === p ? 'white' : '$color'} fontWeight="600" fontSize="$2">{{ stripe: 'Stripe', yookassa: 'YooKassa', robokassa: 'Robokassa', paypal: 'PayPal' }[p]}</Text>
                            </XStack>
                          </ScalePress>
                        ))}
                      </XStack>
                    </YStack>
                    <Input value={planProviderPriceId} onChangeText={setPlanProviderPriceId} placeholder={t('admin.planProviderPriceId')} placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={42} fontSize="$3" color="$color" />
                    <Input value={planFeatures} onChangeText={setPlanFeatures} placeholder={t('admin.planFeaturesPlaceholder')} placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={80} fontSize="$3" color="$color" multiline />
                    <AppButton onPress={handleCreatePlan} disabled={creating || !planName.trim()}>
                      {creating ? t('common.loading') : t('admin.createPlan')}
                    </AppButton>
                  </YStack>
                )}
              </AppCard>

              <AppCard animated={false}>
                <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$2">
                  {t('admin.recentPayments')}
                </Text>
                {stats.recentPayments.length === 0 ? (
                  <Text color="$mutedText" fontSize="$2">{t('payments.noHistory')}</Text>
                ) : (
                  <YStack gap="$2">
                    {stats.recentPayments.map((payment) => (
                      <YStack
                        key={payment.id}
                        borderBottomWidth={1}
                        borderBottomColor="$borderColor"
                        paddingBottom="$2"
                      >
                        <XStack justifyContent="space-between" alignItems="center">
                          <YStack flex={1}>
                            <Text fontWeight="600" color="$color" fontSize="$3" numberOfLines={1}>
                              {payment.description ?? payment.type}
                            </Text>
                            <Text color="$mutedText" fontSize="$1">
                              {payment.provider} · {payment.status}
                            </Text>
                          </YStack>
                          <YStack alignItems="flex-end">
                            <Text fontWeight="700" fontSize="$3" color="$color">
                              {formatPrice(payment.amount, payment.currency)}
                            </Text>
                            <Text color="$mutedText" fontSize="$1">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </Text>
                          </YStack>
                        </XStack>
                      </YStack>
                    ))}
                  </YStack>
                )}
              </AppCard>
            </>
          ) : (
            <Text color="$mutedText" textAlign="center" paddingVertical="$6">
              {t('common.error')}
            </Text>
          )}
        </YStack>
      </FadeIn>
    </ScrollView>
  )
}

interface EnvEntry { value: string | null; type: string }
type EnvData = Record<string, Record<string, EnvEntry>>

const ENV_GROUP_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; labelKey: string; mainToggle?: string; hintKey?: string; hintUrl?: string }> = {
  analytics: { icon: 'bar-chart-outline', labelKey: 'admin.apiAnalytics', mainToggle: 'ANALYTICS_ENABLED', hintKey: 'admin.hintPosthog', hintUrl: 'https://app.posthog.com/project/settings' },
  email: { icon: 'mail-outline', labelKey: 'admin.apiEmail', mainToggle: 'EMAIL_ENABLED' },
  auth: { icon: 'logo-google', labelKey: 'admin.apiAuth', mainToggle: 'GOOGLE_CLIENT_ID', hintKey: 'admin.hintGoogle', hintUrl: 'https://console.cloud.google.com/apis/credentials' },
  sms: { icon: 'chatbubble-ellipses-outline', labelKey: 'admin.apiSMS', mainToggle: 'SMS_ENABLED' },
  pushNotifications: { icon: 'notifications-outline', labelKey: 'admin.apiPush', mainToggle: 'EXPO_ACCESS_TOKEN', hintKey: 'admin.hintExpo', hintUrl: 'https://expo.dev/settings/access-tokens' },
  payments: { icon: 'card-outline', labelKey: 'admin.apiPayments', mainToggle: 'PAYMENTS_ENABLED' },
  ai: { icon: 'sparkles-outline', labelKey: 'admin.apiAI', mainToggle: 'GEMINI_API_KEY' },
}

const PAYMENT_PROVIDERS = [
  { key: 'stripe',    label: 'Stripe',    color: '#635BFF', enabledKey: 'STRIPE_ENABLED',    keys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],                                 hintKey: 'admin.hintStripe',    hintUrl: 'https://dashboard.stripe.com/apikeys' },
  { key: 'paypal',   label: 'PayPal',    color: '#003087', enabledKey: 'PAYPAL_ENABLED',     keys: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID'],               hintKey: 'admin.hintPaypal',    hintUrl: 'https://developer.paypal.com/dashboard/' },
  { key: 'yookassa', label: 'YooKassa',  color: '#0077FF', enabledKey: 'YOOKASSA_ENABLED',   keys: ['YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET_KEY', 'YOOKASSA_WEBHOOK_SECRET'],          hintKey: 'admin.hintYookassa',  hintUrl: 'https://yookassa.ru/my/merchant/integration' },
  { key: 'robokassa', label: 'Robokassa', color: '#E5392B', enabledKey: 'ROBOKASSA_ENABLED',  keys: ['ROBOKASSA_MERCHANT_LOGIN', 'ROBOKASSA_PASSWORD1', 'ROBOKASSA_PASSWORD2'],      hintKey: 'admin.hintRobokassa', hintUrl: 'https://partner.robokassa.ru/' },
] as const

function PaymentsEnvCard({ keys, isGroupOn, onToggle, onUpdate }: {
  keys: Record<string, EnvEntry>
  isGroupOn: boolean
  onToggle: (checked: boolean) => void
  onUpdate: (key: string, value: string | boolean | null) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [activeProvider, setActiveProvider] = useState<typeof PAYMENT_PROVIDERS[number]['key']>('stripe')

  const testModeEntry = keys['ROBOKASSA_TEST_MODE']
  const paypalModeEntry = keys['PAYPAL_MODE']
  const activeProviderData = PAYMENT_PROVIDERS.find((p) => p.key === activeProvider)!
  const enabledEntry = keys[activeProviderData.enabledKey]
  const isProviderEnabled = enabledEntry ? enabledEntry.value === 'true' : true
  const providerKeys = activeProviderData.keys
    .filter((k) => k in keys)
    .map((k) => [k, keys[k]] as [string, EnvEntry])

  return (
    <AppCard animated={false}>
      <XStack alignItems="center" justifyContent="space-between" marginBottom={isGroupOn ? '$3' : 0}>
        <XStack alignItems="center" gap="$2" flex={1}>
          <Ionicons name="card-outline" size={20} color={isGroupOn ? theme.accent.val : theme.mutedText.val} />
          <Text fontWeight="600" color="$color" fontSize="$4">
            {t('admin.apiPayments')}
          </Text>
        </XStack>
        <AppSwitch checked={isGroupOn} onCheckedChange={onToggle} />
      </XStack>

      {isGroupOn && (
        <YStack gap="$3">
          {/* Provider tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              {PAYMENT_PROVIDERS.map((provider) => {
                const isActive = activeProvider === provider.key
                const providerEnabledEntry = keys[provider.enabledKey]
                const isEnabled = providerEnabledEntry ? providerEnabledEntry.value === 'true' : true
                return (
                  <ScalePress key={provider.key} onPress={() => setActiveProvider(provider.key)}>
                    <XStack
                      backgroundColor={isActive ? provider.color : '$subtleBackground'}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={isActive ? provider.color : '$borderColor'}
                      gap="$2"
                      alignItems="center"
                    >
                      <Text
                        color={isActive ? 'white' : '$color'}
                        fontWeight="700"
                        fontSize="$2"
                      >
                        {provider.label}
                      </Text>
                      {providerEnabledEntry && (
                        <AppSwitch
                          checked={isEnabled}
                          onCheckedChange={(checked) => onUpdate(provider.enabledKey, String(checked))}
                          size="sm"
                        />
                      )}
                    </XStack>
                  </ScalePress>
                )
              })}
            </XStack>
          </ScrollView>

          {/* Provider env fields */}
          {providerKeys.map(([key, entry]) => (
            <EnvStringField
              key={key}
              envKey={key}
              label={t(`admin.envLabel_${key}`, { defaultValue: key })}
              value={entry.value}
              isSecret={entry.type === 'secret'}
              onSave={onUpdate}
            />
          ))}

          {/* Provider dashboard link */}
          <ScalePress onPress={() => Linking.openURL(activeProviderData.hintUrl)}>
            <Text fontSize="$2" color="$accent">
              {t(activeProviderData.hintKey)}
            </Text>
          </ScalePress>

          {/* Robokassa test mode toggle */}
          {activeProvider === 'robokassa' && testModeEntry && (
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize="$3" color="$color" flex={1} numberOfLines={1}>
                {t('admin.envLabel_ROBOKASSA_TEST_MODE')}
              </Text>
              <AppSwitch
                checked={testModeEntry.value === 'true'}
                onCheckedChange={(checked) => onUpdate('ROBOKASSA_TEST_MODE', String(checked))}
              />
            </XStack>
          )}

          {/* PayPal sandbox/live mode toggle */}
          {activeProvider === 'paypal' && paypalModeEntry && (
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize="$3" color="$color" flex={1} numberOfLines={1}>
                {t('admin.paypalSandbox')}
              </Text>
              <AppSwitch
                checked={paypalModeEntry.value !== 'live'}
                onCheckedChange={(checked) => onUpdate('PAYPAL_MODE', checked ? 'sandbox' : 'live')}
              />
            </XStack>
          )}
        </YStack>
      )}
    </AppCard>
  )
}

const SMS_PROVIDERS = [
  { key: 'twilio' as const, label: 'Twilio', color: '#F22F46', keys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'], hintKey: 'admin.hintTwilio', hintUrl: 'https://console.twilio.com/' },
  { key: 'smsc' as const, label: 'SMSC.ru', color: '#0078D4', keys: ['SMSC_LOGIN', 'SMSC_PASSWORD', 'SMSC_SENDER'], hintKey: 'admin.hintSmsc', hintUrl: 'https://smsc.ru/api/' },
] as const

function SMSEnvCard({ keys, isGroupOn, onToggle, onUpdate }: {
  keys: Record<string, EnvEntry>
  isGroupOn: boolean
  onToggle: (checked: boolean) => void
  onUpdate: (key: string, value: string | boolean | null) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [activeProvider, setActiveProvider] = useState<'twilio' | 'smsc'>('twilio')

  const providerData = SMS_PROVIDERS.find((p) => p.key === activeProvider)!
  const currentProviderKey = keys['SMS_PROVIDER']?.value ?? 'twilio'
  const providerKeys = providerData.keys
    .filter((k) => k in keys)
    .map((k) => [k, keys[k]] as [string, EnvEntry])

  return (
    <AppCard animated={false}>
      <XStack alignItems="center" justifyContent="space-between" marginBottom={isGroupOn ? '$3' : 0}>
        <XStack alignItems="center" gap="$2" flex={1}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={isGroupOn ? theme.accent.val : theme.mutedText.val} />
          <Text fontWeight="600" color="$color" fontSize="$4">
            {t('admin.apiSMS')}
          </Text>
        </XStack>
        <AppSwitch checked={isGroupOn} onCheckedChange={onToggle} />
      </XStack>

      {isGroupOn && (
        <YStack gap="$3">
          {/* SMS verification required toggle */}
          <XStack alignItems="center" justifyContent="space-between" backgroundColor="$subtleBackground" paddingHorizontal="$3" paddingVertical="$2.5" borderRadius="$3">
            <YStack flex={1}>
              <Text fontSize="$3" color="$color">{t('admin.smsVerificationRequired')}</Text>
              <Text fontSize="$1" color="$mutedText">{t('admin.smsVerificationRequiredDesc')}</Text>
            </YStack>
            <AppSwitch
              checked={keys['SMS_VERIFICATION_REQUIRED']?.value === 'true'}
              onCheckedChange={(checked) => onUpdate('SMS_VERIFICATION_REQUIRED', String(checked))}
            />
          </XStack>

          {/* Provider tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              {SMS_PROVIDERS.map((provider) => {
                const isActive = activeProvider === provider.key
                const isSelected = currentProviderKey === provider.key
                return (
                  <ScalePress key={provider.key} onPress={() => setActiveProvider(provider.key)}>
                    <XStack
                      backgroundColor={isActive ? provider.color : '$subtleBackground'}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={isActive ? provider.color : '$borderColor'}
                      gap="$2"
                      alignItems="center"
                    >
                      <Text color={isActive ? 'white' : '$color'} fontWeight="700" fontSize="$2">
                        {provider.label}
                      </Text>
                      {isSelected && (
                        <XStack backgroundColor={isActive ? 'rgba(255,255,255,0.25)' : provider.color} paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$1">
                          <Text fontSize="$1" color="white" fontWeight="600">{t('admin.smsActive')}</Text>
                        </XStack>
                      )}
                    </XStack>
                  </ScalePress>
                )
              })}
            </XStack>
          </ScrollView>

          {/* Set as active provider button */}
          {currentProviderKey !== activeProvider && (
            <ScalePress onPress={() => onUpdate('SMS_PROVIDER', activeProvider)}>
              <XStack backgroundColor="$accentBackground" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" borderWidth={1} borderColor="$accent" justifyContent="center">
                <Text fontSize="$2" color="$accent" fontWeight="600">
                  {t('admin.smsSetActive', { provider: providerData.label })}
                </Text>
              </XStack>
            </ScalePress>
          )}

          {/* Provider credentials */}
          {providerKeys.map(([key, entry]) => (
            <EnvStringField
              key={key}
              envKey={key}
              label={t(`admin.envLabel_${key}`, { defaultValue: key })}
              value={entry.value}
              isSecret={entry.type === 'secret'}
              onSave={onUpdate}
            />
          ))}

          {/* Provider link */}
          <ScalePress onPress={() => Linking.openURL(providerData.hintUrl)}>
            <Text fontSize="$2" color="$accent">
              {t(providerData.hintKey)}
            </Text>
          </ScalePress>
        </YStack>
      )}
    </AppCard>
  )
}

const AI_PROVIDERS_UI = [
  { key: 'gemini' as const, label: 'Google Gemini', color: '#4285F4', apiKeyEnv: 'GEMINI_API_KEY', modelEnv: 'GEMINI_MODEL', limitEnv: 'GEMINI_CONCURRENT_LIMIT', limitLabel: 'admin.geminiConcurrentLimit', limitDesc: 'admin.geminiConcurrentLimitDesc', limitDefault: '3', limitMax: 10, hintKey: 'admin.hintGemini', hintUrl: 'https://aistudio.google.com/apikey', models: [
    { value: 'gemini-2.5-flash', labelKey: 'admin.geminiModelFlash' },
    { value: 'gemini-2.5-pro', labelKey: 'admin.geminiModelPro' },
    { value: 'gemini-3-pro-image-preview', labelKey: 'admin.geminiModel3ProImage' },
    { value: 'gemini-2.0-flash', labelKey: 'admin.geminiModelLegacy' },
  ]},
  { key: 'openai' as const, label: 'OpenAI', color: '#10A37F', apiKeyEnv: 'OPENAI_API_KEY', modelEnv: 'OPENAI_MODEL', limitEnv: 'OPENAI_MAX_TOKENS', limitLabel: 'admin.openaiMaxTokens', limitDesc: 'admin.openaiMaxTokensDesc', limitDefault: '4096', limitMax: 128000, hintKey: 'admin.hintOpenai', hintUrl: 'https://platform.openai.com/api-keys', models: [
    { value: 'gpt-4o', labelKey: 'admin.openaiModel4o' },
    { value: 'gpt-4o-mini', labelKey: 'admin.openaiModel4oMini' },
    { value: 'o3-mini', labelKey: 'admin.openaiModelO3Mini' },
  ]},
] as const

function AIEnvCard({ keys, isGroupOn, onToggle, onUpdate }: {
  keys: Record<string, EnvEntry>
  isGroupOn: boolean
  onToggle: (checked: boolean) => void
  onUpdate: (key: string, value: string | boolean | null) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'openai'>('gemini')

  const provider = AI_PROVIDERS_UI.find((p) => p.key === activeProvider)!
  const currentModel = keys[provider.modelEnv]?.value || provider.models[0].value
  const currentLimit = keys[provider.limitEnv]?.value || provider.limitDefault
  const [limitValue, setLimitValue] = useState(currentLimit)
  const [limitDirty, setLimitDirty] = useState(false)

  const handleLimitChange = (text: string) => {
    const num = text.replace(/[^0-9]/g, '')
    setLimitValue(num)
    setLimitDirty(num !== currentLimit)
  }

  const handleLimitSave = () => {
    const num = Math.max(1, Math.min(provider.limitMax, parseInt(limitValue) || parseInt(provider.limitDefault)))
    onUpdate(provider.limitEnv, String(num))
    setLimitValue(String(num))
    setLimitDirty(false)
  }

  // Reset limit input when switching providers
  const handleProviderSwitch = (key: 'gemini' | 'openai') => {
    setActiveProvider(key)
    const p = AI_PROVIDERS_UI.find((pp) => pp.key === key)!
    setLimitValue(keys[p.limitEnv]?.value || p.limitDefault)
    setLimitDirty(false)
  }

  return (
    <AppCard animated={false}>
      <XStack alignItems="center" justifyContent="space-between" marginBottom={isGroupOn ? '$3' : 0}>
        <XStack alignItems="center" gap="$2" flex={1}>
          <Ionicons name="sparkles-outline" size={20} color={isGroupOn ? theme.accent.val : theme.mutedText.val} />
          <Text fontWeight="600" color="$color" fontSize="$4">
            {t('admin.apiAI')}
          </Text>
        </XStack>
        <AppSwitch checked={isGroupOn} onCheckedChange={onToggle} />
      </XStack>

      {isGroupOn && (
        <YStack gap="$3">
          {/* Provider tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              {AI_PROVIDERS_UI.map((p) => {
                const isActive = activeProvider === p.key
                return (
                  <ScalePress key={p.key} onPress={() => handleProviderSwitch(p.key)}>
                    <XStack
                      backgroundColor={isActive ? p.color : '$subtleBackground'}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={isActive ? p.color : '$borderColor'}
                      gap="$1.5"
                      alignItems="center"
                    >
                      <YStack width={8} height={8} borderRadius={4} backgroundColor={isActive ? 'white' : p.color} />
                      <Text color={isActive ? 'white' : '$color'} fontWeight="700" fontSize="$2">
                        {p.label}
                      </Text>
                    </XStack>
                  </ScalePress>
                )
              })}
            </XStack>
          </ScrollView>

          {/* Proxy toggle for AI requests */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            backgroundColor="$subtleBackground"
            paddingHorizontal="$3"
            paddingVertical="$2.5"
            borderRadius="$3"
          >
            <XStack alignItems="center" gap="$2" flex={1}>
              <Ionicons name="globe-outline" size={18} color={theme.mutedText.val} />
              <YStack flex={1}>
                <Text fontSize="$3" color="$color">{t('admin.aiProxyEnabled')}</Text>
                <Text fontSize="$1" color="$mutedText">{t('admin.aiProxyEnabledDesc')}</Text>
              </YStack>
            </XStack>
            <AppSwitch
              checked={keys['AI_PROXY_ENABLED']?.value === 'true'}
              onCheckedChange={(checked) => onUpdate('AI_PROXY_ENABLED', String(checked))}
            />
          </XStack>

          {/* API key */}
          <EnvStringField
            envKey={provider.apiKeyEnv}
            label={t(`admin.envLabel_${provider.apiKeyEnv}`, { defaultValue: `${provider.label} API Key` })}
            value={keys[provider.apiKeyEnv]?.value ?? null}
            isSecret
            onSave={onUpdate}
          />

          <ScalePress onPress={() => Linking.openURL(provider.hintUrl)}>
            <Text fontSize="$2" color="$accent">
              {t(provider.hintKey)}
            </Text>
          </ScalePress>

          {/* Model selection */}
          <YStack gap="$2">
            <Text fontSize="$2" color="$mutedText" fontWeight="600">
              {t('admin.geminiModel')}
            </Text>
            {provider.models.map((model) => {
              const isActive = currentModel === model.value
              return (
                <ScalePress key={model.value} onPress={() => onUpdate(provider.modelEnv, model.value)}>
                  <XStack
                    padding="$2.5"
                    borderRadius="$3"
                    borderWidth={1.5}
                    borderColor={isActive ? '$accent' : '$borderColor'}
                    backgroundColor={isActive ? '$accentBackground' : '$subtleBackground'}
                    alignItems="center"
                    gap="$2"
                  >
                    <YStack width={18} height={18} borderRadius={9} borderWidth={2} borderColor={isActive ? '$accent' : '$mutedText'} alignItems="center" justifyContent="center">
                      {isActive && <YStack width={10} height={10} borderRadius={5} backgroundColor="$accent" />}
                    </YStack>
                    <YStack flex={1}>
                      <Text fontSize="$3" color="$color" fontWeight={isActive ? '600' : '400'}>{t(model.labelKey)}</Text>
                      <Text fontSize="$1" color="$mutedText">{model.value}</Text>
                    </YStack>
                  </XStack>
                </ScalePress>
              )
            })}
          </YStack>

          {/* Limit input */}
          <YStack gap="$1.5">
            <Text fontSize="$2" color="$mutedText" fontWeight="600">{t(provider.limitLabel)}</Text>
            <Text fontSize="$1" color="$mutedText">{t(provider.limitDesc)}</Text>
            <XStack gap="$2" alignItems="center">
              <Input flex={1} size="$3" value={limitValue} onChangeText={handleLimitChange} keyboardType="number-pad" placeholder={provider.limitDefault} backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" />
              {limitDirty && (
                <ScalePress onPress={handleLimitSave}>
                  <XStack backgroundColor="$accent" paddingHorizontal="$2.5" paddingVertical="$1.5" borderRadius="$2">
                    <Ionicons name="checkmark" size={18} color="white" />
                  </XStack>
                </ScalePress>
              )}
            </XStack>
          </YStack>
        </YStack>
      )}
    </AppCard>
  )
}

// Map env var names → template flag keys for syncing API Settings ↔ Template Config
const ENV_TO_FLAG: Record<string, string> = {}
for (const flag of TEMPLATE_FLAGS) {
  if (flag.envVar) ENV_TO_FLAG[flag.envVar] = flag.key
}

function ApiSettingsTab() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const { width: screenWidth } = useWindowDimensions()
  const isWide = screenWidth > 768
  const setFlag = useTemplateConfigStore((s) => s.setFlag)
  const setColorScheme = useTemplateConfigStore((s) => s.setColorScheme)
  const setCustomColor = useTemplateConfigStore((s) => s.setCustomColor)
  const [envData, setEnvData] = useState<EnvData | null>(null)
  const [loading, setLoading] = useState(true)

  const syncFlagsFromEnv = useCallback((data: EnvData) => {
    for (const [, keys] of Object.entries(data)) {
      for (const [envKey, entry] of Object.entries(keys)) {
        // Sync color scheme
        if (envKey === 'EXPO_PUBLIC_COLOR_SCHEME' && entry.value) {
          setColorScheme(entry.value)
          applyColorScheme(entry.value)
          continue
        }
        // Sync custom color
        if (envKey === 'EXPO_PUBLIC_CUSTOM_COLOR' && entry.value) {
          setCustomColor(entry.value)
          applyCustomColor(entry.value)
          continue
        }
        const flagKey = ENV_TO_FLAG[envKey]
        if (!flagKey) continue
        const flag = TEMPLATE_FLAGS.find((f) => f.key === flagKey)
        if (!flag) continue
        const isOn = flag.envType === 'boolean'
          ? entry.value === 'true'
          : entry.value !== null && entry.value !== ''
        setFlag(flagKey, isOn)
      }
    }
  }, [setFlag, setColorScheme, setCustomColor])

  const fetchEnv = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/env')
      const data = res.data.data
      setEnvData(data)
      syncFlagsFromEnv(data)
    } catch {
      // silent — initial load error
    } finally {
      setLoading(false)
    }
  }, [syncFlagsFromEnv])

  useEffect(() => {
    fetchEnv()
  }, [fetchEnv])

  const handleUpdate = useCallback(async (key: string, value: string | boolean | null) => {
    try {
      const res = await api.patch('/admin/env', { [key]: value })
      setEnvData(res.data.data)
      toast.success(t('admin.envSaved'))

      // Sync with Template Config store
      if (key === 'EXPO_PUBLIC_COLOR_SCHEME') {
        if (typeof value === 'string' && value) {
          setColorScheme(value)
          applyColorScheme(value)
        }
      } else if (key === 'EXPO_PUBLIC_CUSTOM_COLOR') {
        if (typeof value === 'string' && value) {
          setCustomColor(value)
          applyCustomColor(value)
        }
      } else {
        const flagKey = ENV_TO_FLAG[key]
        if (flagKey) {
          const flag = TEMPLATE_FLAGS.find((f) => f.key === flagKey)
          if (flag) {
            const isOn = flag.envType === 'boolean'
              ? value === 'true' || value === true
              : value !== null && value !== '' && value !== false
            setFlag(flagKey, isOn)
          }
        }
      }
    } catch {
      toast.error(t('admin.envSaveError'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, setFlag, setColorScheme, setCustomColor])

  const handleBatchUpdate = useCallback(async (patch: Record<string, string | null>) => {
    try {
      const res = await api.patch('/admin/env', patch)
      setEnvData(res.data.data)
      toast.success(t('admin.envSaved'))
    } catch {
      toast.error(t('admin.envSaveError'))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  if (loading || !envData) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text color="$mutedText">{t('common.loading')}</Text>
      </YStack>
    )
  }

  const renderEnvCard = (group: string, keys: Record<string, { value: string | null; type: string }>) => {
    const meta = ENV_GROUP_META[group]
    if (!meta) return null

    const mainKey = meta.mainToggle
    const mainEntry = mainKey ? keys[mainKey] : undefined
    const isGroupOn = mainEntry
      ? mainEntry.type === 'boolean'
        ? mainEntry.value === 'true'
        : mainEntry.value !== null && mainEntry.value !== ''
      : true

    const handleMainToggle = (checked: boolean) => {
      if (!mainKey || !mainEntry) return
      if (mainEntry.type === 'boolean') {
        handleUpdate(mainKey, String(checked))
      } else {
        handleUpdate(mainKey, checked ? '__TOGGLE_ON__' : null)
      }
    }

    if (group === 'sms') {
      return (
        <SMSEnvCard
          key={group}
          keys={keys}
          isGroupOn={isGroupOn}
          onToggle={handleMainToggle}
          onUpdate={handleUpdate}
        />
      )
    }

    if (group === 'payments') {
      return (
        <PaymentsEnvCard
          key={group}
          keys={keys}
          isGroupOn={isGroupOn}
          onToggle={handleMainToggle}
          onUpdate={handleUpdate}
        />
      )
    }

    if (group === 'ai') {
      return (
        <AIEnvCard
          key={group}
          keys={keys}
          isGroupOn={isGroupOn}
          onToggle={handleMainToggle}
          onUpdate={handleUpdate}
        />
      )
    }

    const subKeys = Object.entries(keys).filter(([key]) => key !== mainKey)

    return (
      <AppCard key={group} animated={false}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom={subKeys.length > 0 && isGroupOn ? '$3' : 0}>
          <XStack alignItems="center" gap="$2" flex={1}>
            <Ionicons name={meta.icon} size={20} color={isGroupOn ? theme.accent.val : theme.mutedText.val} />
            <Text fontWeight="600" color="$color" fontSize="$4">
              {t(meta.labelKey)}
            </Text>
          </XStack>
          {mainEntry && (
            <AppSwitch
              checked={isGroupOn}
              onCheckedChange={handleMainToggle}
            />
          )}
        </XStack>
        {isGroupOn && (
          <YStack gap="$3">
            {mainKey && mainEntry && mainEntry.type === 'secret' && (
              <EnvStringField
                envKey={mainKey}
                label={t(`admin.envLabel_${mainKey}`, { defaultValue: mainKey })}
                value={mainEntry.value}
                isSecret
                onSave={handleUpdate}
              />
            )}
            {meta.hintUrl && meta.hintKey && (
              <ScalePress onPress={() => Linking.openURL(meta.hintUrl!)}>
                <Text fontSize="$2" color="$accent">
                  {t(meta.hintKey)}
                </Text>
              </ScalePress>
            )}
            {subKeys.map(([key, entry]) => {
              const label = t(`admin.envLabel_${key}`, { defaultValue: key })
              if (entry.type === 'boolean') {
                const isOn = entry.value === 'true'
                return (
                  <XStack key={key} alignItems="center" justifyContent="space-between">
                    <Text fontSize="$3" color="$color" flex={1} numberOfLines={1}>
                      {label}
                    </Text>
                    <AppSwitch
                      checked={isOn}
                      onCheckedChange={(checked) => handleUpdate(key, String(checked))}
                    />
                  </XStack>
                )
              }
              return (
                <EnvStringField
                  key={key}
                  envKey={key}
                  label={label}
                  value={entry.value}
                  isSecret={entry.type === 'secret'}
                  onSave={handleUpdate}
                />
              )
            })}
          </YStack>
        )}
      </AppCard>
    )
  }

  const cards = envData ? Object.entries(envData).map(([group, keys]) => renderEnvCard(group, keys)).filter(Boolean) : []

  // Distribute cards into 2 columns for masonry layout
  const col1: React.ReactNode[] = []
  const col2: React.ReactNode[] = []
  cards.forEach((card, i) => {
    if (i % 2 === 0) col1.push(card)
    else col2.push(card)
  })

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
      <FadeIn>
        <YStack gap="$3">
          <Text color="$mutedText" fontSize="$2" lineHeight={18}>
            {t('admin.apiSettingsDesc')}
          </Text>

          {isWide ? (
            <XStack gap="$3" alignItems="flex-start">
              <YStack flex={1} gap="$3">{col1}</YStack>
              <YStack flex={1} gap="$3">{col2}</YStack>
            </XStack>
          ) : (
            <YStack gap="$3">{cards}</YStack>
          )}

          <Text color="$mutedText" fontSize="$1" textAlign="center" marginTop="$2">
            {t('admin.restartRequired')}
          </Text>
        </YStack>
      </FadeIn>
    </ScrollView>
  )
}

function EnvStringField({ envKey, label, value, isSecret, onSave }: {
  envKey: string
  label?: string
  value: string | null
  isSecret: boolean
  onSave: (key: string, value: string | null) => void
}) {
  const theme = useTheme()
  const [localValue, setLocalValue] = useState(value ?? '')
  const [dirty, setDirty] = useState(false)

  const handleChange = (text: string) => {
    setLocalValue(text)
    setDirty(text !== (value ?? ''))
  }

  const handleSave = () => {
    onSave(envKey, localValue || null)
    setDirty(false)
  }

  return (
    <YStack gap="$1.5">
      <Text fontSize="$2" color="$mutedText">{label ?? envKey}</Text>
      <XStack gap="$2" alignItems="center">
        <Input
          flex={1}
          size="$3"
          value={localValue}
          onChangeText={handleChange}
          placeholder={isSecret ? '••••••••' : ''}
          secureTextEntry={isSecret && !localValue}
          backgroundColor="$subtleBackground"
          borderColor="$borderColor"
          color="$color"
        />
        {dirty && (
          <ScalePress onPress={handleSave}>
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
  )
}

interface StorageStats {
  storageType: string
  s3Configured: boolean
  local: { fileCount: number; totalSizeMB: string; bySubdir: Record<string, { count: number; size: number }> }
  s3: { fileCount: number; totalSizeMB: string }
}

interface StorageConfig {
  storageType: string
  s3Configured: boolean
  s3Endpoint: string
  s3Bucket: string
  s3AccessKey: string
  s3SecretKey: string
  s3Region: string
  s3PublicUrl: string
}

interface ProxyItemUI {
  id: string
  name: string
  host: string
  protocol: string
  httpPort: number | null
  socks5Port: number | null
  username: string | null
  password: string | null
  isActive: boolean
  priority: number
  lastCheckedAt: string | null
  lastCheckStatus: string | null
  lastCheckMessage: string | null
}

function ProxyAdminTab() {
  const { t } = useTranslation()
  const theme = useTheme()
  const toast = useToast()
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const isWide = screenWidth > 768

  const [proxies, setProxies] = useState<ProxyItemUI[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProxy, setEditingProxy] = useState<ProxyItemUI | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formHost, setFormHost] = useState('')
  const [formProtocol, setFormProtocol] = useState<'http' | 'socks5'>('http')
  const [formHttpPort, setFormHttpPort] = useState('')
  const [formSocks5Port, setFormSocks5Port] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formPriority, setFormPriority] = useState('0')
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchProxies = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/proxies')
      setProxies(res.data.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProxies() }, [fetchProxies])

  const openCreate = () => {
    setEditingProxy(null)
    setFormName('')
    setFormHost('')
    setFormProtocol('http')
    setFormHttpPort('')
    setFormSocks5Port('')
    setFormUsername('')
    setFormPassword('')
    setFormPriority('0')
    setFormActive(true)
    setShowPassword(false)
    setModalVisible(true)
  }

  const openEdit = (proxy: ProxyItemUI) => {
    setEditingProxy(proxy)
    setFormName(proxy.name)
    setFormHost(proxy.host)
    setFormProtocol(proxy.protocol as 'http' | 'socks5')
    setFormHttpPort(proxy.httpPort?.toString() || '')
    setFormSocks5Port(proxy.socks5Port?.toString() || '')
    setFormUsername(proxy.username || '')
    setFormPassword('')
    setFormPriority(proxy.priority.toString())
    setFormActive(proxy.isActive)
    setShowPassword(false)
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formHost.trim()) {
      toast.error(t('admin.proxyName') + ' & ' + t('admin.proxyHost') + ' required')
      return
    }
    setSaving(true)
    try {
      const data: any = {
        name: formName,
        host: formHost,
        protocol: formProtocol,
        httpPort: formHttpPort ? parseInt(formHttpPort) : undefined,
        socks5Port: formSocks5Port ? parseInt(formSocks5Port) : undefined,
        username: formUsername || undefined,
        password: formPassword || undefined,
        isActive: formActive,
        priority: parseInt(formPriority) || 0,
      }
      if (editingProxy && !formPassword) delete data.password
      if (editingProxy) {
        await api.put(`/admin/proxies/${editingProxy.id}`, data)
        toast.success(t('admin.proxyUpdated'))
      } else {
        await api.post('/admin/proxies', data)
        toast.success(t('admin.proxyCreated'))
      }
      setModalVisible(false)
      fetchProxies()
    } catch {
      toast.error(t('admin.envSaveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'web') {
      if (!confirm(t('admin.deleteProxyConfirm'))) return
    }
    try {
      await api.delete(`/admin/proxies/${id}`)
      toast.success(t('admin.proxyDeleted'))
      fetchProxies()
    } catch {
      toast.error(t('admin.envSaveError'))
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/proxies/${id}/toggle`, { isActive })
      toast.success(t('admin.proxyToggled'))
      fetchProxies()
    } catch {
      toast.error(t('admin.envSaveError'))
    }
  }

  const handleTest = async (id: string, type: 'test' | 'test-tcp' | 'diagnose') => {
    setTestingId(id)
    try {
      const endpoint = type === 'diagnose' ? 'diagnose' : type
      const method = type === 'diagnose' ? 'get' : 'post'
      const res = await api[method](`/admin/proxies/${id}/${endpoint}`)
      const result = res.data.data
      if (type === 'diagnose') {
        const d = result.diagnostics
        let msg = ''
        if (d.containerInfo) msg += d.containerInfo + '\n'
        if (d.dnsResolution) msg += d.dnsResolution + '\n'
        if (d.tcpConnect) msg += d.tcpConnect
        toast.success(msg || 'Diagnostics complete')
      } else if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
      fetchProxies()
    } catch {
      toast.error(t('admin.envSaveError'))
    } finally {
      setTestingId(null)
    }
  }

  const getStatusColor = (status: string | null) => {
    if (status === 'success') return '#22c55e'
    if (status === 'failed') return '#ef4444'
    return '#eab308'
  }

  const activeCount = proxies.filter((p) => p.isActive).length
  const workingCount = proxies.filter((p) => p.isActive && p.lastCheckStatus === 'success').length

  if (loading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text color="$mutedText">{t('common.loading')}</Text>
      </YStack>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
      <FadeIn>
        <YStack gap="$3">
          <Text color="$mutedText" fontSize="$2" lineHeight={18}>
            {t('admin.proxyDesc')}
          </Text>

          {/* Stats */}
          <XStack gap="$2">
            <AppCard flex={1} animated={false}>
              <YStack alignItems="center" gap="$1">
                <Text fontSize="$6" fontWeight="bold" color="$accent">{proxies.length}</Text>
                <Text fontSize="$1" color="$mutedText">{t('admin.proxyTotal')}</Text>
              </YStack>
            </AppCard>
            <AppCard flex={1} animated={false}>
              <YStack alignItems="center" gap="$1">
                <Text fontSize="$6" fontWeight="bold" color="$accent">{activeCount}</Text>
                <Text fontSize="$1" color="$mutedText">{t('admin.proxyActive')}</Text>
              </YStack>
            </AppCard>
            <AppCard flex={1} animated={false}>
              <YStack alignItems="center" gap="$1">
                <Text fontSize="$6" fontWeight="bold" color="$accent">{workingCount}</Text>
                <Text fontSize="$1" color="$mutedText">{t('admin.proxyWorking')}</Text>
              </YStack>
            </AppCard>
          </XStack>

          {/* Add button */}
          <AppButton onPress={openCreate}>
            {t('admin.addProxy')}
          </AppButton>

          <Text fontSize="$1" color="$mutedText">{t('admin.proxyHttpOnly')}</Text>

          {/* Proxy list */}
          {proxies.length === 0 ? (
            <AppCard animated={false}>
              <YStack alignItems="center" padding="$4" gap="$2">
                <Ionicons name="globe-outline" size={40} color={theme.mutedText.val} />
                <Text color="$mutedText">{t('admin.proxyEmpty')}</Text>
              </YStack>
            </AppCard>
          ) : (
            proxies.map((proxy) => (
              <AppCard key={proxy.id} animated={false}>
                <YStack gap="$2">
                  {/* Header: name + status + toggle */}
                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap="$2" flex={1}>
                      <YStack width={10} height={10} borderRadius={5} backgroundColor={getStatusColor(proxy.lastCheckStatus)} />
                      <Text fontWeight="600" color="$color" fontSize="$3" numberOfLines={1} flex={1}>
                        {proxy.name}
                      </Text>
                    </XStack>
                    <AppSwitch
                      checked={proxy.isActive}
                      onCheckedChange={(checked) => handleToggle(proxy.id, checked)}
                    />
                  </XStack>

                  {/* Host + protocol */}
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize="$2" color="$mutedText" fontFamily="$mono">
                      {proxy.host}:{proxy.protocol === 'socks5' ? (proxy.socks5Port || 1080) : (proxy.httpPort || 8080)}
                    </Text>
                    <Text
                      fontSize="$1"
                      fontWeight="700"
                      color={proxy.protocol === 'socks5' ? '#eab308' : '#22c55e'}
                    >
                      {proxy.protocol.toUpperCase()}
                    </Text>
                    {proxy.username && (
                      <Text fontSize="$1" color="$mutedText">@{proxy.username}</Text>
                    )}
                    <Text fontSize="$1" color="$mutedText">P:{proxy.priority}</Text>
                  </XStack>

                  {/* Status message */}
                  {proxy.lastCheckMessage && (
                    <Text fontSize="$1" color={proxy.lastCheckStatus === 'success' ? '#22c55e' : proxy.lastCheckStatus === 'failed' ? '#ef4444' : '$mutedText'} numberOfLines={2}>
                      {proxy.lastCheckMessage}
                    </Text>
                  )}

                  {/* Actions */}
                  <XStack gap="$2" flexWrap="wrap">
                    <ScalePress onPress={() => handleTest(proxy.id, 'test')} disabled={testingId === proxy.id}>
                      <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1.5" borderRadius="$2" gap="$1" alignItems="center" opacity={testingId === proxy.id ? 0.5 : 1}>
                        <Ionicons name="flask-outline" size={14} color={theme.accent.val} />
                        <Text fontSize="$1" color="$color">{t('admin.proxyTestFull')}</Text>
                      </XStack>
                    </ScalePress>
                    <ScalePress onPress={() => handleTest(proxy.id, 'test-tcp')} disabled={testingId === proxy.id}>
                      <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1.5" borderRadius="$2" gap="$1" alignItems="center" opacity={testingId === proxy.id ? 0.5 : 1}>
                        <Ionicons name="flash-outline" size={14} color={theme.accent.val} />
                        <Text fontSize="$1" color="$color">{t('admin.proxyTestTcp')}</Text>
                      </XStack>
                    </ScalePress>
                    <ScalePress onPress={() => handleTest(proxy.id, 'diagnose')} disabled={testingId === proxy.id}>
                      <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1.5" borderRadius="$2" gap="$1" alignItems="center" opacity={testingId === proxy.id ? 0.5 : 1}>
                        <Ionicons name="pulse-outline" size={14} color={theme.accent.val} />
                        <Text fontSize="$1" color="$color">{t('admin.proxyDiagnose')}</Text>
                      </XStack>
                    </ScalePress>
                    <ScalePress onPress={() => openEdit(proxy)}>
                      <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1.5" borderRadius="$2" gap="$1" alignItems="center">
                        <Ionicons name="pencil-outline" size={14} color={theme.accent.val} />
                        <Text fontSize="$1" color="$color">{t('admin.editProxy')}</Text>
                      </XStack>
                    </ScalePress>
                    <ScalePress onPress={() => handleDelete(proxy.id)}>
                      <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1.5" borderRadius="$2" gap="$1" alignItems="center">
                        <Ionicons name="trash-outline" size={14} color="#ef4444" />
                        <Text fontSize="$1" color="#ef4444">{t('admin.deleteProxy')}</Text>
                      </XStack>
                    </ScalePress>
                  </XStack>
                </YStack>
              </AppCard>
            ))
          )}
        </YStack>
      </FadeIn>

      {/* Create/Edit Modal */}
      <AdminModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingProxy ? t('admin.editProxy') : t('admin.addProxy')}
        maxWidth={560}
      >
        <YStack gap="$3">
          {/* Row 1: Name + Host (2 columns on wide) */}
          <XStack gap="$3" flexWrap="wrap">
            <YStack gap="$1.5" flex={1} minWidth={200}>
              <Text fontSize="$2" fontFamily="$body" color="$mutedText">{t('admin.proxyName')}</Text>
              <Input size="$3" value={formName} onChangeText={setFormName} placeholder="My Proxy" backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" fontFamily="$body" />
            </YStack>
            <YStack gap="$1.5" flex={1} minWidth={200}>
              <Text fontSize="$2" fontFamily="$body" color="$mutedText">{t('admin.proxyHost')}</Text>
              <Input size="$3" value={formHost} onChangeText={setFormHost} placeholder="102.129.221.156" backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" fontFamily="$body" />
            </YStack>
          </XStack>

          {/* Row 2: Protocol + Port (2 columns on wide) */}
          <XStack gap="$3" flexWrap="wrap" alignItems="flex-end">
            <YStack gap="$1.5" flex={1} minWidth={160}>
              <Text fontSize="$2" fontFamily="$body" color="$mutedText">{t('admin.proxyProtocol')}</Text>
              <XStack gap="$2">
                {(['http', 'socks5'] as const).map((proto) => (
                  <ScalePress key={proto} onPress={() => setFormProtocol(proto)}>
                    <XStack
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$3"
                      borderWidth={1.5}
                      borderColor={formProtocol === proto ? '$accent' : '$borderColor'}
                      backgroundColor={formProtocol === proto ? '$accentBackground' : '$subtleBackground'}
                    >
                      <Text color={formProtocol === proto ? '$accent' : '$color'} fontWeight="600" fontSize="$2" fontFamily="$body">
                        {proto.toUpperCase()}
                      </Text>
                    </XStack>
                  </ScalePress>
                ))}
              </XStack>
            </YStack>
            <YStack gap="$1.5" flex={1} minWidth={160}>
              <Text fontSize="$2" fontFamily="$body" color="$mutedText">
                {formProtocol === 'http' ? t('admin.proxyHttpPort') : t('admin.proxySocks5Port')}
              </Text>
              <Input
                size="$3"
                value={formProtocol === 'http' ? formHttpPort : formSocks5Port}
                onChangeText={formProtocol === 'http' ? setFormHttpPort : setFormSocks5Port}
                placeholder={formProtocol === 'http' ? '8080' : '1080'}
                keyboardType="number-pad"
                backgroundColor="$subtleBackground"
                borderColor="$borderColor"
                color="$color"
                fontFamily="$body"
              />
            </YStack>
          </XStack>

          {/* Row 3: Username + Password (2 columns on wide) */}
          <XStack gap="$3" flexWrap="wrap">
            <YStack gap="$1.5" flex={1} minWidth={200}>
              <Text fontSize="$2" fontFamily="$body" color="$mutedText">{t('admin.proxyUsername')}</Text>
              <Input size="$3" value={formUsername} onChangeText={setFormUsername} placeholder={t('admin.proxyUsername')} backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" fontFamily="$body" />
            </YStack>
            <YStack gap="$1.5" flex={1} minWidth={200}>
              <Text fontSize="$2" fontFamily="$body" color="$mutedText">{t('admin.proxyPassword')}</Text>
              <XStack gap="$2" alignItems="center">
                <Input flex={1} size="$3" value={formPassword} onChangeText={setFormPassword} placeholder={editingProxy ? '(leave empty to keep)' : ''} secureTextEntry={!showPassword} backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" fontFamily="$body" />
                <ScalePress onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.mutedText.val} />
                </ScalePress>
              </XStack>
            </YStack>
          </XStack>

          {/* Row 4: Priority + Active toggle (2 columns on wide) */}
          <XStack gap="$3" flexWrap="wrap" alignItems="flex-end">
            <YStack gap="$1.5" flex={1} minWidth={160}>
              <Text fontSize="$2" fontFamily="$body" color="$mutedText">{t('admin.proxyPriority')}</Text>
              <Input size="$3" value={formPriority} onChangeText={setFormPriority} placeholder="0" keyboardType="number-pad" backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" fontFamily="$body" />
              <Text fontSize="$1" fontFamily="$body" color="$mutedText">{t('admin.proxyPriorityDesc')}</Text>
            </YStack>
            <YStack flex={1} minWidth={160} justifyContent="center">
              <XStack alignItems="center" justifyContent="space-between" paddingVertical="$2">
                <YStack flex={1}>
                  <Text fontSize="$3" fontFamily="$body" color="$color">{t('admin.proxyIsActive')}</Text>
                  <Text fontSize="$1" fontFamily="$body" color="$mutedText">{t('admin.proxyIsActiveDesc')}</Text>
                </YStack>
                <AppSwitch checked={formActive} onCheckedChange={setFormActive} />
              </XStack>
            </YStack>
          </XStack>

          {/* Action buttons */}
          <XStack gap="$3" marginTop="$3" justifyContent="flex-end">
            <AppButton variant="outline" onPress={() => setModalVisible(false)} size="md">
              {t('admin.proxyCancel')}
            </AppButton>
            <AppButton onPress={handleSave} disabled={saving} size="md">
              {saving ? t('common.loading') : t('admin.proxySave')}
            </AppButton>
          </XStack>
        </YStack>
      </AdminModal>
    </ScrollView>
  )
}

function StorageAdminTab() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const { width: screenWidth } = useWindowDimensions()
  const isWide = screenWidth > 768

  const [stats, setStats] = useState<StorageStats | null>(null)
  const [config, setConfig] = useState<StorageConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // S3 form fields
  const [s3Endpoint, setS3Endpoint] = useState('')
  const [s3Bucket, setS3Bucket] = useState('')
  const [s3AccessKey, setS3AccessKey] = useState('')
  const [s3SecretKey, setS3SecretKey] = useState('')
  const [s3Region, setS3Region] = useState('')
  const [s3PublicUrl, setS3PublicUrl] = useState('')

  // Migration
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState({ total: 0, migrated: 0, skipped: 0, failed: 0, currentFile: '' })
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingS3, setIsDownloadingS3] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [s3ConfigOpen, setS3ConfigOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsRes, configRes] = await Promise.all([
        api.get('/admin/storage/stats'),
        api.get('/admin/storage/config'),
      ])
      setStats(statsRes.data.data)
      const cfg = configRes.data.data
      setConfig(cfg)
      setS3Endpoint(cfg.s3Endpoint || '')
      setS3Bucket(cfg.s3Bucket || '')
      setS3AccessKey(cfg.s3AccessKey || '')
      setS3SecretKey(cfg.s3SecretKey || '')
      setS3Region(cfg.s3Region || '')
      setS3PublicUrl(cfg.s3PublicUrl || '')
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Poll migration status
  useEffect(() => {
    if (!isMigrating) return
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/admin/storage/migrate/status')
        const data = res.data.data
        setMigrationProgress(data)
        if (!data.isMigrating) {
          setIsMigrating(false)
          clearInterval(interval)
          toast.success(t('admin.migrationComplete', { migrated: data.migrated, skipped: data.skipped, failed: data.failed }))
          fetchData()
        }
      } catch {
        // silent
      }
    }, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMigrating])

  const handleToggleStorageType = async () => {
    if (!config) return
    const newType = config.storageType === 's3' ? 'local' : 's3'
    if (newType === 's3' && !config.s3Configured) {
      toast.error(t('admin.s3NotConfigured'))
      return
    }
    try {
      const res = await api.put('/admin/storage/config', { storageType: newType })
      setConfig(res.data.data)
      toast.success(t('admin.s3ConfigSaved'))
      fetchData()
    } catch {
      toast.error(t('admin.s3ConfigError'))
    }
  }

  const handleSaveS3Config = async () => {
    setSavingConfig(true)
    try {
      const res = await api.put('/admin/storage/config', {
        s3Endpoint, s3Bucket, s3AccessKey, s3SecretKey, s3Region, s3PublicUrl,
      })
      setConfig(res.data.data)
      toast.success(t('admin.s3ConfigSaved'))
      fetchData()
    } catch {
      toast.error(t('admin.s3ConfigError'))
    } finally {
      setSavingConfig(false)
    }
  }

  const handleMigrateToS3 = async () => {
    if (Platform.OS === 'web' && !window.confirm(t('admin.migrateToS3') + '?')) return
    setIsMigrating(true)
    try {
      await api.post('/admin/storage/migrate', {}, { timeout: 600000 })
    } catch {
      toast.error(t('admin.s3ConfigError'))
      setIsMigrating(false)
    }
  }

  const handleDownloadAll = async () => {
    if (Platform.OS !== 'web') return
    setIsDownloading(true)
    try {
      const res = await api.get('/admin/storage/download-all', { responseType: 'blob', timeout: 600000 })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `uploads-backup-${new Date().toISOString().slice(0, 10)}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(t('admin.downloadAll'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadAllS3 = async () => {
    if (Platform.OS !== 'web') return
    setIsDownloadingS3(true)
    try {
      const res = await api.get('/admin/storage/download-all-s3', { responseType: 'blob', timeout: 600000 })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `s3-backup-${new Date().toISOString().slice(0, 10)}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(t('admin.downloadAllS3'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setIsDownloadingS3(false)
    }
  }

  if (loading || !stats || !config) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text color="$mutedText">{t('common.loading')}</Text>
      </YStack>
    )
  }

  const isS3 = config.storageType === 's3'
  const progressPercent = migrationProgress.total > 0
    ? Math.round(((migrationProgress.migrated + migrationProgress.skipped + migrationProgress.failed) / migrationProgress.total) * 100)
    : 0

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
      <FadeIn>
        <YStack gap="$3">
          <Text color="$mutedText" fontSize="$2" lineHeight={18}>
            {t('admin.storageDesc')}
          </Text>

          {/* Stats */}
          <AppCard animated={false}>
            <XStack alignItems="center" gap="$2" marginBottom="$3">
              <Ionicons name="cloud-outline" size={20} color={theme.accent.val} />
              <Text fontWeight="600" color="$color" fontSize="$4">
                {t('admin.storage')}
              </Text>
            </XStack>
            <XStack gap="$3">
              <YStack flex={1} backgroundColor="$subtleBackground" borderRadius="$3" padding="$3" alignItems="center" gap="$1">
                <Ionicons name="server-outline" size={20} color={!isS3 ? theme.accent.val : theme.mutedText.val} />
                <Text fontSize="$5" fontWeight="700" color={!isS3 ? '$accent' : '$color'}>{stats.local.fileCount}</Text>
                <Text fontSize="$1" color="$mutedText">{t('admin.localFiles')}</Text>
                <Text fontSize={10} color="$mutedText">{stats.local.totalSizeMB} MB</Text>
              </YStack>
              <YStack flex={1} backgroundColor="$subtleBackground" borderRadius="$3" padding="$3" alignItems="center" gap="$1">
                <Ionicons name="cloud-outline" size={20} color={isS3 ? theme.accent.val : theme.mutedText.val} />
                <Text fontSize="$5" fontWeight="700" color={isS3 ? '$accent' : '$color'}>{stats.s3.fileCount}</Text>
                <Text fontSize="$1" color="$mutedText">{t('admin.s3Files')}</Text>
                <Text fontSize={10} color="$mutedText">{stats.s3.totalSizeMB} MB</Text>
              </YStack>
            </XStack>

            {/* By subdir */}
            {Object.keys(stats.local.bySubdir).length > 0 && (
              <YStack marginTop="$2">
                <Text fontSize="$1" color="$mutedText" marginBottom="$1">{t('admin.storageByDir')}:</Text>
                <XStack flexWrap="wrap" gap="$1.5">
                  {Object.entries(stats.local.bySubdir).map(([dir, info]) => (
                    <XStack key={dir} backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                      <Text fontSize={11} color="$mutedText">
                        {dir}: {info.count} ({(info.size / 1024 / 1024).toFixed(1)} MB)
                      </Text>
                    </XStack>
                  ))}
                </XStack>
              </YStack>
            )}
          </AppCard>

          {/* Storage Mode */}
          <AppCard animated={false}>
            <XStack alignItems="center" justifyContent="space-between">
              <YStack flex={1} gap="$1">
                <Text fontWeight="600" color="$color" fontSize="$4">
                  {t('admin.storageMode')}
                </Text>
                <Text fontSize="$1" color="$mutedText">
                  {isS3 ? t('admin.storageS3Desc') : t('admin.storageLocalDesc')}
                </Text>
              </YStack>
              <XStack alignItems="center" gap="$2">
                <Text fontSize="$2" color={!isS3 ? '$accent' : '$mutedText'} fontWeight="600">
                  {t('admin.storageLocal')}
                </Text>
                <AppSwitch
                  checked={isS3}
                  onCheckedChange={handleToggleStorageType}
                />
                <Text fontSize="$2" color={isS3 ? '$accent' : '$mutedText'} fontWeight="600">
                  S3
                </Text>
              </XStack>
            </XStack>
          </AppCard>

          {/* S3 Configuration */}
          <AppCard animated={false}>
            <ScalePress onPress={() => setS3ConfigOpen(!s3ConfigOpen)}>
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2">
                  <Ionicons name="settings-outline" size={18} color={theme.accent.val} />
                  <Text fontWeight="600" color="$color" fontSize="$4">
                    {t('admin.s3Config')}
                  </Text>
                </XStack>
                <Ionicons name={s3ConfigOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.mutedText.val} />
              </XStack>
            </ScalePress>

            {s3ConfigOpen && (
              <YStack gap="$3" marginTop="$3">
                <YStack gap="$1.5">
                  <Text fontSize="$2" color="$mutedText">{t('admin.s3Endpoint')}</Text>
                  <Input size="$3" value={s3Endpoint} onChangeText={setS3Endpoint} placeholder="https://s3.amazonaws.com" backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" />
                </YStack>
                <YStack gap="$1.5">
                  <Text fontSize="$2" color="$mutedText">{t('admin.s3Bucket')}</Text>
                  <Input size="$3" value={s3Bucket} onChangeText={setS3Bucket} placeholder="my-bucket" backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" />
                </YStack>
                <YStack gap="$1.5">
                  <Text fontSize="$2" color="$mutedText">{t('admin.s3AccessKey')}</Text>
                  <Input size="$3" value={s3AccessKey} onChangeText={setS3AccessKey} placeholder="AKIAIOSFODNN7EXAMPLE" backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" />
                </YStack>
                <YStack gap="$1.5">
                  <Text fontSize="$2" color="$mutedText">{t('admin.s3SecretKey')}</Text>
                  <Input size="$3" value={s3SecretKey} onChangeText={setS3SecretKey} placeholder="wJalrXUtnFEMI..." secureTextEntry backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" />
                </YStack>
                <YStack gap="$1.5">
                  <Text fontSize="$2" color="$mutedText">{t('admin.s3Region')}</Text>
                  <Input size="$3" value={s3Region} onChangeText={setS3Region} placeholder="us-east-1" backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" />
                </YStack>
                <YStack gap="$1.5">
                  <Text fontSize="$2" color="$mutedText">{t('admin.s3PublicUrl')}</Text>
                  <Input size="$3" value={s3PublicUrl} onChangeText={setS3PublicUrl} placeholder="https://bucket.s3.amazonaws.com" backgroundColor="$subtleBackground" borderColor="$borderColor" color="$color" />
                </YStack>
                <AppButton onPress={handleSaveS3Config} disabled={savingConfig}>
                  {savingConfig ? t('common.loading') : t('admin.saveS3Config')}
                </AppButton>
              </YStack>
            )}
          </AppCard>

          {/* Migration & Backup */}
          <AppCard animated={false}>
            <XStack alignItems="center" gap="$2" marginBottom="$3">
              <Ionicons name="swap-horizontal-outline" size={18} color={theme.accent.val} />
              <Text fontWeight="600" color="$color" fontSize="$4">
                {t('admin.migrationBackup')}
              </Text>
            </XStack>

            {/* Migration Progress */}
            {isMigrating && migrationProgress.total > 0 && (
              <YStack gap="$2" marginBottom="$3" backgroundColor="$subtleBackground" padding="$3" borderRadius="$3">
                <XStack justifyContent="space-between">
                  <Text fontSize="$2" color="$accent" fontWeight="600">{t('admin.migratingToS3')}</Text>
                  <Text fontSize="$2" color="$mutedText">
                    {migrationProgress.migrated + migrationProgress.skipped + migrationProgress.failed} / {migrationProgress.total}
                  </Text>
                </XStack>
                <YStack height={8} borderRadius={4} backgroundColor="$borderColor" overflow="hidden">
                  <YStack height={8} borderRadius={4} backgroundColor="$accent" width={`${progressPercent}%` as any} />
                </YStack>
                <XStack gap="$3">
                  <Text fontSize={11} color="$accent">{t('admin.migrationUploaded')}: {migrationProgress.migrated}</Text>
                  <Text fontSize={11} color="$mutedText">{t('admin.migrationSkipped')}: {migrationProgress.skipped}</Text>
                  {migrationProgress.failed > 0 && (
                    <Text fontSize={11} color="$red10">{t('admin.migrationFailed')}: {migrationProgress.failed}</Text>
                  )}
                </XStack>
                {migrationProgress.currentFile && (
                  <Text fontSize={10} color="$mutedText" numberOfLines={1}>{migrationProgress.currentFile}</Text>
                )}
              </YStack>
            )}

            <XStack gap="$2" flexWrap={isWide ? 'nowrap' : 'wrap'}>
              <YStack flex={1} flexBasis={isWide ? 0 : '45%'}>
                <AppButton
                  variant="outline"
                  onPress={handleDownloadAll}
                  disabled={isDownloading || stats.local.fileCount === 0}
                >
                  {isDownloading ? t('admin.downloading') : t('admin.downloadAll')}
                </AppButton>
              </YStack>
              <YStack flex={1} flexBasis={isWide ? 0 : '45%'}>
                <AppButton
                  variant="outline"
                  onPress={handleDownloadAllS3}
                  disabled={isDownloadingS3 || !config.s3Configured || stats.s3.fileCount === 0}
                >
                  {isDownloadingS3 ? t('admin.downloading') : t('admin.downloadAllS3')}
                </AppButton>
              </YStack>
              <YStack flex={1} flexBasis={isWide ? 0 : '100%'}>
                <AppButton
                  onPress={handleMigrateToS3}
                  disabled={isMigrating || !config.s3Configured}
                >
                  {isMigrating ? t('admin.migratingToS3') : t('admin.migrateToS3')}
                </AppButton>
              </YStack>
            </XStack>
          </AppCard>
        </YStack>
      </FadeIn>
    </ScrollView>
  )
}

function TemplateConfigTab() {
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

  const frontendFlags = TEMPLATE_FLAGS.filter((f) => f.scope === 'frontend')

  const getFlagValue = (key: string, defaultValue: boolean) =>
    overrides[key] !== undefined ? overrides[key] : defaultValue

  const hasOverrides =
    Object.keys(overrides).length > 0 ||
    colorScheme !== null ||
    customColor !== null ||
    radiusScale !== 'default' ||
    cardStyle !== 'elevated' ||
    fontScale !== 'default' ||
    fontFamily !== 'inter'

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

          {/* Font Scale */}
          <AppCard animated={false}>
            <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$3">
              {t('templateConfig.fontScale')}
            </Text>
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

          {/* Font Family */}
          <AppCard animated={false}>
            <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$3">
              {t('templateConfig.fontFamily')}
            </Text>
            <YStack gap="$2">
              {(Object.entries(FONT_FAMILY_CONFIG) as [FontFamily, { label: string }][]).map(([key, cfg]) => {
                const active = fontFamily === key
                return (
                  <ScalePress key={key} onPress={() => handleSetFontFamily(key)}>
                    <XStack
                      alignItems="center"
                      justifyContent="space-between"
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={active ? '$accent' : '$borderColor'}
                      backgroundColor="$subtleBackground"
                    >
                      <Text fontSize="$3" color={active ? '$accent' : '$color'} fontWeight={active ? '600' : '400'}>
                        {cfg.label}
                      </Text>
                      {active && <Ionicons name="checkmark" size={16} color={theme.accent.val} />}
                    </XStack>
                  </ScalePress>
                )
              })}
            </YStack>
          </AppCard>

          {/* Frontend Flags */}
          <AppCard animated={false}>
            <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$2">
              {t('templateConfig.frontend')}
            </Text>
            <YStack gap="$2">
              {frontendFlags.map((flag) => {
                const value = getFlagValue(flag.key, flag.defaultValue)
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

export default function AdminScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
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
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'feedback' | 'notify' | 'payments' | 'storage' | 'proxy' | 'api' | 'config'>(analyticsEnabled ? 'analytics' : 'users')

  useEffect(() => {
    if (!analyticsEnabled && activeTab === 'analytics') {
      setActiveTab('users')
    }
    if (!pushEnabled && activeTab === 'notify') {
      setActiveTab('users')
    }
  }, [analyticsEnabled, pushEnabled, activeTab])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDashboard | null>(null)
  const [feedbackStats, setFeedbackStats] = useState<DocFeedbackStat[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editFeatures, setEditFeatures] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [notifyTitle, setNotifyTitle] = useState('')
  const [notifyBody, setNotifyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)
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
      const [usersRes, statsRes, configRes, analyticsRes, feedbackRes] = await Promise.all([
        api.get('/admin/users', { params }),
        api.get('/admin/stats'),
        api.get('/admin/config'),
        api.get('/analytics/dashboard', { params: { days: 30 } }).catch(() => null),
        api.get('/doc-feedback/admin/stats').catch(() => null),
      ])
      setUsers(usersRes.data.data)
      setTotalPages(usersRes.data.pagination?.totalPages ?? 1)
      setStats(statsRes.data.data)
      setConfig(configRes.data.data)
      if (analyticsRes) setAnalyticsData(analyticsRes.data.data)
      if (feedbackRes) setFeedbackStats(feedbackRes.data.data)
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
            {docFeedbackEnabled && (
              <ScalePress onPress={() => setActiveTab('feedback')}>
                <XStack
                  backgroundColor={activeTab === 'feedback' ? '$accent' : '$subtleBackground'}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$3"
                >
                  <Text color={activeTab === 'feedback' ? 'white' : '$color'} fontWeight="600" fontSize="$3">
                    {t('admin.docFeedback')}
                  </Text>
                </XStack>
              </ScalePress>
            )}
            {pushEnabled && (
              <ScalePress onPress={() => setActiveTab('notify')}>
                <XStack
                  backgroundColor={activeTab === 'notify' ? '$accent' : '$subtleBackground'}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$3"
                >
                  <Text color={activeTab === 'notify' ? 'white' : '$color'} fontWeight="600" fontSize="$3">
                    {t('admin.sendNotification')}
                  </Text>
                </XStack>
              </ScalePress>
            )}
            {paymentsEnabled && (
              <ScalePress onPress={() => setActiveTab('payments')}>
                <XStack
                  backgroundColor={activeTab === 'payments' ? '$accent' : '$subtleBackground'}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$3"
                >
                  <Text color={activeTab === 'payments' ? 'white' : '$color'} fontWeight="600" fontSize="$3">
                    {t('admin.payments')}
                  </Text>
                </XStack>
              </ScalePress>
            )}
            <ScalePress onPress={() => setActiveTab('storage')}>
              <XStack
                backgroundColor={activeTab === 'storage' ? '$accent' : '$subtleBackground'}
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$3"
                gap="$1.5"
                alignItems="center"
              >
                <Ionicons name="cloud-outline" size={16} color={activeTab === 'storage' ? 'white' : theme.accent.val} />
                <Text color={activeTab === 'storage' ? 'white' : '$color'} fontWeight="600" fontSize="$3">
                  {t('admin.storage')}
                </Text>
              </XStack>
            </ScalePress>
            <ScalePress onPress={() => setActiveTab('proxy')}>
              <XStack
                backgroundColor={activeTab === 'proxy' ? '$accent' : '$subtleBackground'}
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$3"
                gap="$1.5"
                alignItems="center"
              >
                <Ionicons name="globe-outline" size={16} color={activeTab === 'proxy' ? 'white' : theme.accent.val} />
                <Text color={activeTab === 'proxy' ? 'white' : '$color'} fontWeight="600" fontSize="$3">
                  {t('admin.proxyTab')}
                </Text>
              </XStack>
            </ScalePress>
            <ScalePress onPress={() => setActiveTab('api')}>
              <XStack
                backgroundColor={activeTab === 'api' ? '$accent' : '$subtleBackground'}
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$3"
                gap="$1.5"
                alignItems="center"
              >
                <Ionicons name="settings-outline" size={16} color={activeTab === 'api' ? 'white' : theme.accent.val} />
                <Text color={activeTab === 'api' ? 'white' : '$color'} fontWeight="600" fontSize="$3">
                  {t('admin.apiSettings')}
                </Text>
              </XStack>
            </ScalePress>
            {isTemplateConfigEnabled && (
              <ScalePress onPress={() => {
                if (Platform.OS === 'web') {
                  const store = useTemplateConfigStore.getState()
                  store.setSidebarOpen(!store.sidebarOpen)
                } else {
                  setActiveTab('config')
                }
              }}>
                <XStack
                  backgroundColor={activeTab === 'config' ? '$accent' : '$subtleBackground'}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$3"
                  gap="$1.5"
                  alignItems="center"
                >
                  <Ionicons name="construct-outline" size={16} color={activeTab === 'config' ? 'white' : theme.accent.val} />
                  <Text color={activeTab === 'config' ? 'white' : '$color'} fontWeight="600" fontSize="$3">
                    {t('templateConfig.title')}
                  </Text>
                </XStack>
              </ScalePress>
            )}
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

      {/* Doc Feedback Tab */}
      {docFeedbackEnabled && activeTab === 'feedback' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
          {feedbackStats && feedbackStats.length > 0 ? (
            <FadeIn>
              <YStack gap="$3">
                {feedbackStats.map((item) => {
                  const total = item.likes + item.dislikes
                  const pct = total > 0 ? Math.round((item.likes / total) * 100) : 0
                  return (
                    <AppCard key={item.pageId} animated={false}>
                      <XStack alignItems="center" justifyContent="space-between">
                        <YStack flex={1} gap="$1">
                          <Text fontWeight="600" color="$color" fontSize="$3">
                            {item.pageId}
                          </Text>
                          <XStack gap="$3" alignItems="center">
                            <XStack alignItems="center" gap="$1">
                              <Ionicons name="thumbs-up" size={14} color={theme.accent.val} />
                              <Text fontSize="$2" color="$accent">{item.likes}</Text>
                            </XStack>
                            <XStack alignItems="center" gap="$1">
                              <Ionicons name="thumbs-down" size={14} color="#EF4444" />
                              <Text fontSize="$2" color="#EF4444">{item.dislikes}</Text>
                            </XStack>
                          </XStack>
                        </YStack>
                        <YStack alignItems="center">
                          <Text fontSize="$6" fontWeight="bold" color={pct >= 50 ? '$accent' : '#EF4444'}>
                            {pct}%
                          </Text>
                          <Text fontSize="$1" color="$mutedText">{t('admin.helpful')}</Text>
                        </YStack>
                      </XStack>
                    </AppCard>
                  )
                })}
              </YStack>
            </FadeIn>
          ) : (
            <YStack alignItems="center" padding="$6">
              <Text color="$mutedText">{loading ? t('common.loading') : t('admin.noFeedback')}</Text>
            </YStack>
          )}
        </ScrollView>
      )}

      {/* Notify Tab */}
      {pushEnabled && activeTab === 'notify' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
          <FadeIn>
            <YStack gap="$3">
              <AppCard animated={false}>
                <YStack gap="$3">
                  <Text fontWeight="600" color="$color" fontSize="$4">
                    {t('admin.sendNotification')}
                  </Text>
                  <Input
                    value={notifyTitle}
                    onChangeText={setNotifyTitle}
                    placeholder={t('admin.notifyTitle')}
                    placeholderTextColor={theme.mutedText.val as any}
                    backgroundColor="$subtleBackground"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$3"
                    paddingHorizontal="$3"
                    height={42}
                    fontSize="$3"
                    color="$color"
                  />
                  <Input
                    value={notifyBody}
                    onChangeText={setNotifyBody}
                    placeholder={t('admin.notifyBody')}
                    placeholderTextColor={theme.mutedText.val as any}
                    backgroundColor="$subtleBackground"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$3"
                    paddingHorizontal="$3"
                    height={42}
                    fontSize="$3"
                    color="$color"
                  />
                  <AppButton
                    onPress={async () => {
                      if (!notifyTitle.trim()) return
                      setSending(true)
                      setSendResult(null)
                      try {
                        const res = await api.post('/push/send', {
                          title: notifyTitle.trim(),
                          body: notifyBody.trim() || undefined,
                        })
                        const data = res.data.data
                        setSendResult(t('admin.notifySent', { sent: data.sent, total: data.total }))
                        setNotifyTitle('')
                        setNotifyBody('')
                        fetchHistory()
                      } catch (err: any) {
                        setSendResult(err.response?.data?.message ?? t('common.error'))
                      } finally {
                        setSending(false)
                      }
                    }}
                    disabled={sending || !notifyTitle.trim()}
                  >
                    {sending ? t('common.loading') : t('admin.sendToAll')}
                  </AppButton>
                  {sendResult && (
                    <Text color="$mutedText" fontSize="$2" textAlign="center">
                      {sendResult}
                    </Text>
                  )}
                </YStack>
              </AppCard>

              {/* Send History */}
              <AppCard animated={false}>
                <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$2">
                  {t('admin.notifyHistory')}
                </Text>
                {historyLoading ? (
                  <Text color="$mutedText" fontSize="$2">{t('common.loading')}</Text>
                ) : notifyHistory.length === 0 ? (
                  <Text color="$mutedText" fontSize="$2">{t('admin.noNotifications')}</Text>
                ) : (
                  <YStack gap="$2">
                    {notifyHistory.map((item, i) => (
                      <YStack
                        key={`${item.title}-${item.createdAt}-${i}`}
                        borderBottomWidth={i < notifyHistory.length - 1 ? 1 : 0}
                        borderBottomColor="$borderColor"
                        paddingBottom="$2"
                      >
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text fontWeight="600" color="$color" fontSize="$3" flex={1} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <XStack alignItems="center" gap="$1" marginLeft="$2">
                            <Ionicons name="people-outline" size={14} color={theme.mutedText.val} />
                            <Text color="$mutedText" fontSize="$2">{item.recipientCount}</Text>
                          </XStack>
                        </XStack>
                        {item.body && (
                          <Text color="$mutedText" fontSize="$2" numberOfLines={2}>
                            {item.body}
                          </Text>
                        )}
                        <Text color="$mutedText" fontSize="$1" marginTop="$1">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                        </Text>
                      </YStack>
                    ))}
                  </YStack>
                )}
              </AppCard>
            </YStack>
          </FadeIn>
        </ScrollView>
      )}

      {/* Payments Tab */}
      {paymentsEnabled && activeTab === 'payments' && (
        <PaymentsAdminTab />
      )}

      {/* Storage Tab */}
      {activeTab === 'storage' && (
        <StorageAdminTab />
      )}

      {activeTab === 'proxy' && (
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

      {/* Edit User Modal */}
      <AdminModal
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

          {/* Features — 2 columns on wide screens */}
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
      </AdminModal>
    </YStack>
  )
}
