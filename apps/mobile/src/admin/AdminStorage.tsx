import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView, Platform, useWindowDimensions } from 'react-native'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppCard, AppSwitch, FadeIn, ScalePress, useToast } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../services/api'

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

export function StorageAdminTab() {
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
