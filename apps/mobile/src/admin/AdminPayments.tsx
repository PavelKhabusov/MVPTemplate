import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView, Platform, Alert, useWindowDimensions } from 'react-native'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppCard, AppSwitch, AppModal, FadeIn, ScalePress } from '@mvp/ui'
import { Receipt, Tag, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react-native'
import { type AdminPlan, PROVIDER_CFG, PAYMENT_STATUS_COLOR } from './types'
import { api } from '../services/api'

const AdminModal = AppModal

export function PaymentsAdminTab() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const isWide = screenWidth > 768
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

  // Unified plan modal state (create + edit)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null)
  const [planName, setPlanName] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [planPrice, setPlanPrice] = useState('')
  const [planCurrency, setPlanCurrency] = useState('usd')
  const [planInterval, setPlanInterval] = useState<'month' | 'year' | 'one_time'>('month')
  const [planProvider, setPlanProvider] = useState<'stripe' | 'yookassa' | 'robokassa' | 'paypal'>('stripe')
  const [planProviderPriceId, setPlanProviderPriceId] = useState('')
  const [planFeatures, setPlanFeatures] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)

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

  const openCreateModal = () => {
    setEditingPlan(null)
    setPlanName(''); setPlanDescription(''); setPlanPrice('')
    setPlanCurrency('usd'); setPlanInterval('month')
    setPlanProvider('stripe'); setPlanProviderPriceId(''); setPlanFeatures('')
    setShowPlanModal(true)
  }

  const openEditModal = (plan: AdminPlan) => {
    setEditingPlan(plan)
    setPlanName(plan.name)
    setPlanDescription(plan.description ?? '')
    setPlanPrice(String(plan.priceAmount / 100))
    setPlanCurrency(plan.currency)
    setPlanInterval(plan.interval as 'month' | 'year' | 'one_time')
    setPlanProvider(plan.provider as 'stripe' | 'yookassa' | 'robokassa' | 'paypal')
    setPlanProviderPriceId(plan.providerPriceId ?? '')
    setPlanFeatures(plan.features.join('\n'))
    setShowPlanModal(true)
  }

  const closePlanModal = () => { setShowPlanModal(false); setEditingPlan(null) }

  const handleSavePlan = async () => {
    if (!planName.trim()) return
    setSavingPlan(true)
    const priceAmount = Math.round(parseFloat(planPrice || '0') * 100)
    const features = planFeatures.split('\n').map((f) => f.trim()).filter(Boolean)
    try {
      if (editingPlan) {
        await api.patch(`/payments/admin/plans/${editingPlan.id}`, {
          name: planName.trim(),
          description: planDescription.trim() || undefined,
          priceAmount,
          currency: planCurrency.trim().toLowerCase() || 'usd',
          interval: planInterval,
          provider: planProvider,
          providerPriceId: planProviderPriceId.trim() || undefined,
          features,
        })
      } else {
        await api.post('/payments/admin/plans', {
          name: planName.trim(),
          description: planDescription.trim() || undefined,
          priceAmount,
          currency: planCurrency.trim().toLowerCase() || 'usd',
          interval: planInterval,
          provider: planProvider,
          providerPriceId: planProviderPriceId.trim() || undefined,
          features,
        })
      }
      closePlanModal()
      fetchData()
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
    } finally {
      setSavingPlan(false)
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
      if (window.confirm(t('admin.deletePlanConfirm'))) performDeletePlan(plan)
    } else {
      Alert.alert(t('admin.deletePlan'), t('admin.deletePlanConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => performDeletePlan(plan) },
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
            <Text color="$mutedText" textAlign="center" paddingVertical="$6">{t('common.loading')}</Text>
          ) : stats ? (
            <>
              {/* Revenue stats */}
              <XStack gap="$3">
                <AppCard flex={1} animated={false}>
                  <YStack alignItems="center" gap="$1">
                    <Text fontSize="$6" fontWeight="800" color="$accent">
                      {stats.totalRevenue.length > 0
                        ? stats.totalRevenue.map((r) => formatPrice(r.total, r.currency)).join(' / ')
                        : formatPrice(0, 'usd')}
                    </Text>
                    <Text fontSize="$1" color="$mutedText">{t('admin.revenue')}</Text>
                  </YStack>
                </AppCard>
                <AppCard flex={1} animated={false}>
                  <YStack alignItems="center" gap="$1">
                    <Text fontSize="$6" fontWeight="800" color="$accent">{stats.activeSubscriptions}</Text>
                    <Text fontSize="$1" color="$mutedText">{t('admin.activeSubscriptions')}</Text>
                  </YStack>
                </AppCard>
              </XStack>



              {/* Recent Payments */}
              <AppCard animated={false}>
                <XStack alignItems="center" gap="$2" marginBottom="$3">
                  <Receipt size={18} color={theme.accent.val} />
                  <Text fontWeight="700" color="$color" fontSize="$4">{t('admin.recentPayments')}</Text>
                </XStack>
                {stats.recentPayments.length === 0 ? (
                  <YStack alignItems="center" paddingVertical="$3" gap="$1">
                    <Receipt size={28} color={theme.mutedText.val} />
                    <Text color="$mutedText" fontSize="$2">{t('payments.noHistory')}</Text>
                  </YStack>
                ) : (
                  <YStack>
                    {stats.recentPayments.map((payment, idx) => {
                      const statusColor = PAYMENT_STATUS_COLOR[payment.status] ?? '#6B7280'
                      return (
                        <XStack
                          key={payment.id}
                          paddingVertical="$2.5"
                          borderBottomWidth={idx < stats.recentPayments.length - 1 ? 1 : 0}
                          borderBottomColor="$borderColor"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <YStack flex={1} gap="$0.5" marginRight="$3">
                            <Text fontWeight="600" color="$color" fontSize="$3" numberOfLines={1}>
                              {payment.description ?? payment.type}
                            </Text>
                            <XStack gap="$2" alignItems="center">
                              <Text color="$mutedText" fontSize="$1">{payment.provider}</Text>
                              <XStack
                                paddingHorizontal="$1.5" paddingVertical={2} borderRadius="$1"
                                style={{ backgroundColor: statusColor + '20' } as any}
                              >
                                <Text fontSize={10} fontWeight="600" style={{ color: statusColor } as any}>
                                  {payment.status}
                                </Text>
                              </XStack>
                            </XStack>
                          </YStack>
                          <YStack alignItems="flex-end" gap="$0.5">
                            <Text fontWeight="700" fontSize="$3" color="$color">
                              {formatPrice(payment.amount, payment.currency)}
                            </Text>
                            <Text color="$mutedText" fontSize="$1">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </Text>
                          </YStack>
                        </XStack>
                      )
                    })}
                  </YStack>
                )}
              </AppCard>

              {/* Plans header */}
              <XStack justifyContent="space-between" alignItems="center">
                <XStack alignItems="center" gap="$2">
                  <Tag size={20} color={theme.accent.val} />
                  <Text fontWeight="700" fontSize="$5" color="$color">{t('admin.existingPlans')}</Text>
                  {adminPlans.length > 0 && (
                    <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$0.5" borderRadius="$2">
                      <Text fontSize="$1" color="$mutedText" fontWeight="600">{adminPlans.length}</Text>
                    </XStack>
                  )}
                </XStack>
                <ScalePress onPress={openCreateModal}>
                  <XStack backgroundColor="$accent" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3" alignItems="center" gap="$1.5">
                    <Plus size={16} color="white" />
                    <Text color="white" fontWeight="600" fontSize="$2">{t('admin.createPlan')}</Text>
                  </XStack>
                </ScalePress>
              </XStack>

              {/* Plan cards */}
              {adminPlans.length === 0 ? (
                <AppCard animated={false}>
                  <YStack alignItems="center" paddingVertical="$5" gap="$3">
                    <Tag size={36} color={theme.mutedText.val} />
                    <Text color="$mutedText" fontSize="$2">{t('payments.noPlans')}</Text>
                    <ScalePress onPress={openCreateModal}>
                      <XStack backgroundColor="$accent" paddingHorizontal="$4" paddingVertical="$2.5" borderRadius="$3" alignItems="center" gap="$1.5">
                        <Plus size={16} color="white" />
                        <Text color="white" fontWeight="600" fontSize="$3">{t('admin.createPlan')}</Text>
                      </XStack>
                    </ScalePress>
                  </YStack>
                </AppCard>
              ) : (() => {
                const planCards = adminPlans.map((plan) => {
                  const pCfg = PROVIDER_CFG[plan.provider] ?? { label: plan.provider, color: '#6B7280' }
                  const intervalLabel = plan.interval === 'month' ? t('payments.perMonth')
                    : plan.interval === 'year' ? t('payments.perYear')
                    : t('payments.one_time')
                  return (
                    <YStack
                      key={plan.id}
                      borderRadius="$4"
                      borderWidth={1}
                      borderColor="$borderColor"
                      overflow="hidden"
                      opacity={plan.isActive ? 1 : 0.6}
                    >
                      {/* Top accent strip */}
                      <YStack height={3} backgroundColor={plan.isActive ? '$accent' : '$borderColor'} />

                      <YStack padding="$4" gap="$3" backgroundColor="$background">
                        {/* Name + action buttons */}
                        <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
                          <YStack flex={1} gap="$0.5">
                            <Text fontWeight="700" fontSize="$5" color="$color" numberOfLines={2}>{plan.name}</Text>
                            {plan.description ? (
                              <Text fontSize="$2" color="$mutedText" numberOfLines={2}>{plan.description}</Text>
                            ) : null}
                          </YStack>
                          <XStack gap="$1.5" alignItems="center">
                            <ScalePress onPress={() => openEditModal(plan)}>
                              <YStack width={34} height={34} borderRadius={17} backgroundColor="$subtleBackground" alignItems="center" justifyContent="center">
                                <Pencil size={16} color={theme.accent.val} />
                              </YStack>
                            </ScalePress>
                            <ScalePress onPress={() => handleDeletePlan(plan)}>
                              <YStack width={34} height={34} borderRadius={17} backgroundColor="$subtleBackground" alignItems="center" justifyContent="center">
                                <Trash2 size={16} color="#EF4444" />
                              </YStack>
                            </ScalePress>
                          </XStack>
                        </XStack>

                        {/* Price */}
                        <XStack alignItems="baseline" gap="$1">
                          <Text fontSize={28} fontWeight="800" color="$accent" lineHeight={32}>
                            {formatPrice(plan.priceAmount, plan.currency)}
                          </Text>
                          {plan.interval !== 'one_time' ? (
                            <Text fontSize="$3" color="$mutedText">/{plan.interval}</Text>
                          ) : null}
                        </XStack>

                        {/* Provider + interval badges + active toggle */}
                        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
                          <XStack gap="$2" flexWrap="wrap" flex={1}>
                            <XStack
                              paddingHorizontal="$2.5" paddingVertical="$1" borderRadius="$2"
                              style={{ backgroundColor: pCfg.color + '18', borderWidth: 1, borderColor: pCfg.color + '55' } as any}
                            >
                              <Text fontSize="$1" fontWeight="700" style={{ color: pCfg.color } as any}>{pCfg.label}</Text>
                            </XStack>
                            <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2.5" paddingVertical="$1" borderRadius="$2" borderWidth={1} borderColor="$borderColor">
                              <Text fontSize="$1" color="$mutedText" fontWeight="500">{intervalLabel}</Text>
                            </XStack>
                            {plan.providerPriceId ? (
                              <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2.5" paddingVertical="$1" borderRadius="$2">
                                <Text fontSize="$1" color="$mutedText" numberOfLines={1}>{plan.providerPriceId}</Text>
                              </XStack>
                            ) : null}
                          </XStack>
                          <AppSwitch checked={plan.isActive} onCheckedChange={() => handleToggleActive(plan)} />
                        </XStack>

                        {/* Features */}
                        {plan.features.length > 0 && (
                          <>
                            <YStack height={1} backgroundColor="$borderColor" />
                            <YStack gap="$1.5">
                              {plan.features.map((f) => (
                                <XStack key={f} gap="$2" alignItems="center">
                                  <CheckCircle2 size={14} color={theme.accent.val} />
                                  <Text fontSize="$2" color="$color" flex={1}>{f}</Text>
                                </XStack>
                              ))}
                            </YStack>
                          </>
                        )}
                      </YStack>
                    </YStack>
                  )
                })

                if (isWide) {
                  const col1: React.ReactNode[] = []
                  const col2: React.ReactNode[] = []
                  planCards.forEach((card, i) => { if (i % 2 === 0) col1.push(card); else col2.push(card) })
                  return (
                    <XStack gap="$3" alignItems="flex-start">
                      <YStack flex={1} gap="$3">{col1}</YStack>
                      <YStack flex={1} gap="$3">{col2}</YStack>
                    </XStack>
                  )
                }

                return <YStack gap="$3">{planCards}</YStack>
              })()}
            </>
          ) : (
            <Text color="$mutedText" textAlign="center" paddingVertical="$6">{t('common.error')}</Text>
          )}
        </YStack>
      </FadeIn>

      {/* Plan Create / Edit Modal */}
      <AdminModal
        visible={showPlanModal}
        onClose={closePlanModal}
        title={editingPlan ? t('admin.editPlan') : t('admin.createPlan')}
      >
        <YStack gap="$3">
          <YStack gap="$1.5">
            <Text fontSize="$2" color="$mutedText" fontWeight="600">{t('admin.planName')}</Text>
            <Input value={planName} onChangeText={setPlanName} placeholder="Pro Plan" placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={44} fontSize="$3" color="$color" />
          </YStack>

          <YStack gap="$1.5">
            <Text fontSize="$2" color="$mutedText" fontWeight="600">{t('admin.planDescription')}</Text>
            <Input value={planDescription} onChangeText={setPlanDescription} placeholder={t('admin.planDescription')} placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={44} fontSize="$3" color="$color" />
          </YStack>

          <XStack gap="$2">
            <YStack flex={1} gap="$1.5">
              <Text fontSize="$2" color="$mutedText" fontWeight="600">{t('admin.planPrice')}</Text>
              <Input value={planPrice} onChangeText={setPlanPrice} placeholder="19.99" keyboardType="decimal-pad" placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={44} fontSize="$3" color="$color" />
            </YStack>
            <YStack width={88} gap="$1.5">
              <Text fontSize="$2" color="$mutedText" fontWeight="600">Currency</Text>
              <Input value={planCurrency} onChangeText={setPlanCurrency} placeholder="usd" autoCapitalize="none" placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={44} fontSize="$3" color="$color" />
            </YStack>
          </XStack>

          <YStack gap="$1.5">
            <Text fontSize="$2" color="$mutedText" fontWeight="600">{t('admin.planInterval')}</Text>
            <XStack gap="$2" flexWrap="wrap">
              {INTERVALS.map((opt) => (
                <ScalePress key={opt.value} onPress={() => setPlanInterval(opt.value)}>
                  <XStack
                    backgroundColor={planInterval === opt.value ? '$accent' : '$subtleBackground'}
                    paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3"
                    borderWidth={1} borderColor={planInterval === opt.value ? '$accent' : '$borderColor'}
                  >
                    <Text color={planInterval === opt.value ? 'white' : '$color'} fontWeight="600" fontSize="$2">
                      {opt.label}
                    </Text>
                  </XStack>
                </ScalePress>
              ))}
            </XStack>
          </YStack>

          <YStack gap="$1.5">
            <Text fontSize="$2" color="$mutedText" fontWeight="600">{t('admin.planProvider')}</Text>
            <XStack gap="$2" flexWrap="wrap">
              {(['stripe', 'yookassa', 'robokassa', 'paypal'] as const).map((p) => {
                const cfg = PROVIDER_CFG[p]
                const sel = planProvider === p
                return (
                  <ScalePress key={p} onPress={() => setPlanProvider(p)}>
                    <XStack
                      paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3"
                      backgroundColor={sel ? undefined : '$subtleBackground'}
                      style={sel
                        ? { backgroundColor: cfg.color + '20', borderWidth: 1, borderColor: cfg.color } as any
                        : { borderWidth: 1, borderColor: theme.borderColor.val } as any}
                    >
                      <Text fontWeight="600" fontSize="$2" style={{ color: sel ? cfg.color : theme.mutedText.val } as any}>
                        {cfg.label}
                      </Text>
                    </XStack>
                  </ScalePress>
                )
              })}
            </XStack>
          </YStack>

          <YStack gap="$1.5">
            <Text fontSize="$2" color="$mutedText" fontWeight="600">{t('admin.planProviderPriceId')}</Text>
            <Input value={planProviderPriceId} onChangeText={setPlanProviderPriceId} placeholder="price_xxx (optional)" placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" height={44} fontSize="$3" color="$color" />
          </YStack>

          <YStack gap="$1.5">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$2" color="$mutedText" fontWeight="600">{t('admin.planFeaturesPlaceholder')}</Text>
              <Text fontSize="$1" color="$mutedText">One per line</Text>
            </XStack>
            <Input value={planFeatures} onChangeText={setPlanFeatures} placeholder={t('admin.planFeaturesPlaceholder')} multiline height={90} textAlignVertical="top" placeholderTextColor={theme.mutedText.val as any} backgroundColor="$subtleBackground" borderWidth={1} borderColor="$borderColor" borderRadius="$3" paddingHorizontal="$3" paddingVertical="$2" fontSize="$3" color="$color" />
          </YStack>

          <AppButton
            onPress={handleSavePlan}
            disabled={savingPlan || !planName.trim()}
            marginTop="$1"
          >
            {savingPlan ? t('common.loading') : editingPlan ? t('admin.saveChanges') : t('admin.createPlan')}
          </AppButton>
        </YStack>
      </AdminModal>
    </ScrollView>
  )
}
