import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView, Platform, useWindowDimensions } from 'react-native'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppCard, AppSwitch, AppModal, FadeIn, ScalePress, useToast } from '@mvp/ui'
import { Globe, FlaskConical, Zap, Activity, Pencil, Trash2, Eye, EyeOff } from 'lucide-react-native'
import { api } from '../services/api'

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

const AdminModal = AppModal

export function ProxyAdminTab() {
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
                <Globe size={40} color={theme.mutedText.val} />
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
                        <FlaskConical size={14} color={theme.accent.val} />
                        <Text fontSize="$1" color="$color">{t('admin.proxyTestFull')}</Text>
                      </XStack>
                    </ScalePress>
                    <ScalePress onPress={() => handleTest(proxy.id, 'test-tcp')} disabled={testingId === proxy.id}>
                      <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1.5" borderRadius="$2" gap="$1" alignItems="center" opacity={testingId === proxy.id ? 0.5 : 1}>
                        <Zap size={14} color={theme.accent.val} />
                        <Text fontSize="$1" color="$color">{t('admin.proxyTestTcp')}</Text>
                      </XStack>
                    </ScalePress>
                    <ScalePress onPress={() => handleTest(proxy.id, 'diagnose')} disabled={testingId === proxy.id}>
                      <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1.5" borderRadius="$2" gap="$1" alignItems="center" opacity={testingId === proxy.id ? 0.5 : 1}>
                        <Activity size={14} color={theme.accent.val} />
                        <Text fontSize="$1" color="$color">{t('admin.proxyDiagnose')}</Text>
                      </XStack>
                    </ScalePress>
                    <ScalePress onPress={() => openEdit(proxy)}>
                      <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1.5" borderRadius="$2" gap="$1" alignItems="center">
                        <Pencil size={14} color={theme.accent.val} />
                        <Text fontSize="$1" color="$color">{t('admin.editProxy')}</Text>
                      </XStack>
                    </ScalePress>
                    <ScalePress onPress={() => handleDelete(proxy.id)}>
                      <XStack backgroundColor="$subtleBackground" paddingHorizontal="$2" paddingVertical="$1.5" borderRadius="$2" gap="$1" alignItems="center">
                        <Trash2 size={14} color="#ef4444" />
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
                  {showPassword ? <EyeOff size={20} color={theme.mutedText.val} /> : <Eye size={20} color={theme.mutedText.val} />}
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
