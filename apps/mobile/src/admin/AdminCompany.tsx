import React, { useState, useEffect } from 'react'
import { ScrollView } from 'react-native'
import { YStack, Text, Input } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppCard, FadeIn, useToast } from '@mvp/ui'
import { api } from '../services/api'

interface CompanyInfoData {
  appName: string
  companyName: string
  tagline: string
  supportEmail: string
  website: string
  phone: string
  address: string
}

export function CompanyInfoTab() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CompanyInfoData>({
    appName: '',
    companyName: '',
    tagline: '',
    supportEmail: '',
    website: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    api.get('/admin/company-info')
      .then((res) => setForm(res.data.data))
      .catch(() => toast.error(t('admin.loadError')))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/company-info', form)
      toast.success(t('admin.companySaved'))
    } catch {
      toast.error(t('admin.companySaveError'))
    } finally {
      setSaving(false)
    }
  }

  const field = (labelKey: string, key: keyof CompanyInfoData, opts?: { placeholder?: string; multiline?: boolean }) => (
    <YStack gap="$1.5">
      <Text fontSize="$2" color="$mutedText" fontWeight="500">{t(labelKey)}</Text>
      <Input
        value={form[key]}
        onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
        placeholder={opts?.placeholder ?? ''}
        placeholderTextColor={'$placeholderColor' as any}
        backgroundColor="$subtleBackground"
        borderColor="$borderColor"
        color="$color"
        size="$3"
        multiline={opts?.multiline}
        numberOfLines={opts?.multiline ? 3 : 1}
        textAlignVertical={opts?.multiline ? 'top' : undefined}
      />
    </YStack>
  )

  if (loading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
        <Text color="$mutedText">{t('common.loading')}</Text>
      </YStack>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
      <FadeIn>
        <YStack gap="$3">
          <Text color="$mutedText" fontSize="$2" lineHeight={18}>
            {t('admin.companyDesc')}
          </Text>

          {/* App Info */}
          <AppCard animated={false}>
            <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$3">
              {t('admin.companyAppSection')}
            </Text>
            <YStack gap="$3">
              {field('admin.companyAppName', 'appName', { placeholder: 'MVPTemplate' })}
              {field('admin.companyTagline', 'tagline', { placeholder: t('admin.companyTaglinePlaceholder') })}
            </YStack>
          </AppCard>

          {/* Company Details */}
          <AppCard animated={false}>
            <Text fontWeight="600" color="$color" fontSize="$4" marginBottom="$3">
              {t('admin.companyDetailsSection')}
            </Text>
            <YStack gap="$3">
              {field('admin.companyName', 'companyName')}
              {field('admin.companyWebsite', 'website', { placeholder: 'https://' })}
              {field('admin.companySupportEmail', 'supportEmail', { placeholder: 'support@example.com' })}
              {field('admin.companyPhone', 'phone', { placeholder: '+1 234 567 8900' })}
              {field('admin.companyAddress', 'address', { multiline: true })}
            </YStack>
          </AppCard>

          <AppButton onPress={handleSave} disabled={saving}>
            {saving ? t('common.saving') : t('admin.companySave')}
          </AppButton>
        </YStack>
      </FadeIn>
    </ScrollView>
  )
}
