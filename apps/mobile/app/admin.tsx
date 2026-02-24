import React, { useState, useEffect, useCallback } from 'react'
import { FlatList, Platform, Modal, Alert, ScrollView, useWindowDimensions } from 'react-native'
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
  const [planProvider, setPlanProvider] = useState<'stripe' | 'yookassa' | 'robokassa'>('stripe')
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
                        {(['stripe', 'yookassa', 'robokassa'] as const).map((p) => (
                          <ScalePress key={p} onPress={() => setPlanProvider(p)}>
                            <XStack backgroundColor={planProvider === p ? '$accent' : '$subtleBackground'} paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" borderWidth={1} borderColor={planProvider === p ? '$accent' : '$borderColor'}>
                              <Text color={planProvider === p ? 'white' : '$color'} fontWeight="600" fontSize="$2">{{ stripe: 'Stripe', yookassa: 'YooKassa', robokassa: 'Robokassa' }[p]}</Text>
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

const ENV_GROUP_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; labelKey: string; mainToggle?: string }> = {
  analytics: { icon: 'bar-chart-outline', labelKey: 'admin.apiAnalytics', mainToggle: 'ANALYTICS_ENABLED' },
  email: { icon: 'mail-outline', labelKey: 'admin.apiEmail', mainToggle: 'EMAIL_ENABLED' },
  auth: { icon: 'logo-google', labelKey: 'admin.apiAuth', mainToggle: 'GOOGLE_CLIENT_ID' },
  pushNotifications: { icon: 'notifications-outline', labelKey: 'admin.apiPush', mainToggle: 'EXPO_ACCESS_TOKEN' },
  payments: { icon: 'card-outline', labelKey: 'admin.apiPayments', mainToggle: 'PAYMENTS_ENABLED' },
}

const PAYMENT_PROVIDERS = [
  { key: 'stripe', label: 'Stripe', color: '#635BFF', keys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] },
  { key: 'yookassa', label: 'YooKassa', color: '#0077FF', keys: ['YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET_KEY', 'YOOKASSA_WEBHOOK_SECRET'] },
  { key: 'robokassa', label: 'Robokassa', color: '#E5392B', keys: ['ROBOKASSA_MERCHANT_LOGIN', 'ROBOKASSA_PASSWORD1', 'ROBOKASSA_PASSWORD2'] },
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
  const activeProviderData = PAYMENT_PROVIDERS.find((p) => p.key === activeProvider)!
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
                return (
                  <ScalePress key={provider.key} onPress={() => setActiveProvider(provider.key)}>
                    <XStack
                      backgroundColor={isActive ? provider.color : '$subtleBackground'}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={isActive ? provider.color : '$borderColor'}
                      gap="$1.5"
                      alignItems="center"
                    >
                      <YStack
                        width={8}
                        height={8}
                        borderRadius={4}
                        backgroundColor={isActive ? 'white' : provider.color}
                      />
                      <Text
                        color={isActive ? 'white' : '$color'}
                        fontWeight="700"
                        fontSize="$2"
                      >
                        {provider.label}
                      </Text>
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

          {/* Robokassa test mode toggle — show when robokassa is active */}
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
  const setFlag = useTemplateConfigStore((s) => s.setFlag)
  const [envData, setEnvData] = useState<EnvData | null>(null)
  const [loading, setLoading] = useState(true)

  const syncFlagsFromEnv = useCallback((data: EnvData) => {
    for (const [, keys] of Object.entries(data)) {
      for (const [envKey, entry] of Object.entries(keys)) {
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
  }, [setFlag])

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
    } catch {
      toast.error(t('admin.envSaveError'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, setFlag])

  if (loading || !envData) {
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
            {t('admin.apiSettingsDesc')}
          </Text>

          {Object.entries(envData).map(([group, keys]) => {
            const meta = ENV_GROUP_META[group]
            if (!meta) return null

            const mainKey = meta.mainToggle
            const mainEntry = mainKey ? keys[mainKey] : undefined
            // Main toggle: boolean → true/false, secret → non-null means enabled
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
                // Secret: toggling off comments it out, toggling on uncomments
                handleUpdate(mainKey, checked ? '__TOGGLE_ON__' : null)
              }
            }

            // Payments: use dedicated card with provider tabs
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

            // Sub-keys: everything except the main toggle
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
                    {/* Show input for secret-type main toggle (e.g. Google Client ID, Expo Token) */}
                    {mainKey && mainEntry && mainEntry.type === 'secret' && (
                      <EnvStringField
                        envKey={mainKey}
                        label={t(`admin.envLabel_${mainKey}`, { defaultValue: mainKey })}
                        value={mainEntry.value}
                        isSecret
                        onSave={handleUpdate}
                      />
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

                      // String or secret
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
          })}

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

function TemplateConfigTab() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const overrides = useTemplateConfigStore((s) => s.overrides)
  const setFlag = useTemplateConfigStore((s) => s.setFlag)
  const colorScheme = useTemplateConfigStore((s) => s.colorScheme)
  const customColor = useTemplateConfigStore((s) => s.customColor)
  const setColorScheme = useTemplateConfigStore((s) => s.setColorScheme)
  const setCustomColor = useTemplateConfigStore((s) => s.setCustomColor)
  const resetAll = useTemplateConfigStore((s) => s.resetAll)

  const [hexInput, setHexInput] = useState(customColor ?? '')

  const frontendFlags = TEMPLATE_FLAGS.filter((f) => f.scope === 'frontend')

  const getFlagValue = (key: string, defaultValue: boolean) =>
    overrides[key] !== undefined ? overrides[key] : defaultValue

  const hasOverrides = Object.keys(overrides).length > 0 || colorScheme !== null || customColor !== null

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(hexInput)

  const handleApplyCustom = () => {
    if (!isValidHex) return
    setCustomColor(hexInput)
    applyCustomColor(hexInput)
  }

  const handleSelectPreset = (key: string) => {
    setColorScheme(key)
    applyColorScheme(key)
    setHexInput('')
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
                      onCheckedChange={() => setFlag(flag.key, !value)}
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
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'feedback' | 'notify' | 'payments' | 'api' | 'config'>(analyticsEnabled ? 'analytics' : 'users')

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
                  useTemplateConfigStore.getState().setSidebarOpen(true)
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

      {/* API Settings Tab */}
      {activeTab === 'api' && (
        <ApiSettingsTab />
      )}

      {/* Template Config Tab */}
      {isTemplateConfigEnabled && activeTab === 'config' && (
        <TemplateConfigTab />
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
