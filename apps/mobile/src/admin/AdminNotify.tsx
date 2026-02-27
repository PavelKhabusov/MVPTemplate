import React, { useState, useCallback } from 'react'
import { ScrollView } from 'react-native'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppCard, FadeIn, ScalePress } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../services/api'

interface NotifyHistoryItem {
  title: string
  body: string | null
  createdAt: string
  recipientCount: number
}

interface AdminNotifyTabProps {
  pushEnabled: boolean
  emailEnabled: boolean
  notifyHistory: NotifyHistoryItem[]
  historyLoading: boolean
  onFetchHistory: () => void
}

export function AdminNotifyTab({ pushEnabled, emailEnabled, notifyHistory, historyLoading, onFetchHistory }: AdminNotifyTabProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const [notifyTitle, setNotifyTitle] = useState('')
  const [notifyBody, setNotifyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  const [emailTemplate, setEmailTemplate] = useState<'welcome' | 'announcement'>('announcement')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailTitle, setEmailTitle] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailButtonText, setEmailButtonText] = useState('')
  const [emailButtonUrl, setEmailButtonUrl] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState<string | null>(null)

  const handleSendPush = async () => {
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
      onFetchHistory()
    } catch (err: any) {
      setSendResult(err.response?.data?.message ?? t('common.error'))
    } finally {
      setSending(false)
    }
  }

  const handleSendEmail = async () => {
    if (emailTemplate === 'announcement' && (!emailSubject.trim() || !emailTitle.trim() || !emailBody.trim())) return
    setEmailSending(true)
    setEmailResult(null)
    try {
      const payload: Record<string, string> = { template: emailTemplate }
      if (emailTemplate === 'announcement') {
        payload.subject = emailSubject.trim()
        payload.title = emailTitle.trim()
        payload.body = emailBody.trim()
        if (emailButtonText.trim()) payload.buttonText = emailButtonText.trim()
        if (emailButtonUrl.trim()) payload.buttonUrl = emailButtonUrl.trim()
      }
      const res = await api.post('/email/broadcast', payload)
      const d = res.data.data
      setEmailResult(t('admin.emailSent', { sent: d.sent, failed: d.failed, total: d.total }))
      if (emailTemplate === 'announcement') {
        setEmailSubject(''); setEmailTitle(''); setEmailBody('')
        setEmailButtonText(''); setEmailButtonUrl('')
      }
    } catch (err: any) {
      setEmailResult(err.response?.data?.message ?? t('common.error'))
    } finally {
      setEmailSending(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 12 }}>
      <FadeIn>
        <YStack gap="$3">
          {pushEnabled && (
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
                  onPress={handleSendPush}
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
          )}

          {/* Send History */}
          {pushEnabled && (
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
          )}

          {/* Email Broadcast */}
          {emailEnabled && (
            <AppCard animated={false}>
              <YStack gap="$3">
                <XStack alignItems="center" gap="$2">
                  <Ionicons name="mail-outline" size={20} color={theme.accent.val} />
                  <Text fontWeight="600" color="$color" fontSize="$4">{t('admin.emailBroadcast')}</Text>
                </XStack>

                {/* Template selector */}
                <XStack gap="$2">
                  {(['announcement', 'welcome'] as const).map((tpl) => (
                    <ScalePress key={tpl} onPress={() => setEmailTemplate(tpl)}>
                      <XStack
                        backgroundColor={emailTemplate === tpl ? '$accent' : '$subtleBackground'}
                        paddingHorizontal="$3" paddingVertical="$2" borderRadius="$3"
                        borderWidth={1} borderColor={emailTemplate === tpl ? '$accent' : '$borderColor'}
                      >
                        <Text color={emailTemplate === tpl ? 'white' : '$color'} fontWeight="600" fontSize="$2">
                          {t(tpl === 'announcement' ? 'admin.emailTemplateAnnouncement' : 'admin.emailTemplateWelcome')}
                        </Text>
                      </XStack>
                    </ScalePress>
                  ))}
                </XStack>

                {emailTemplate === 'announcement' ? (
                  <>
                    <Input
                      value={emailSubject}
                      onChangeText={setEmailSubject}
                      placeholder={t('admin.emailSubject')}
                      placeholderTextColor={theme.mutedText.val as any}
                      backgroundColor="$subtleBackground"
                      borderWidth={1} borderColor="$borderColor" borderRadius="$3"
                      paddingHorizontal="$3" height={42} fontSize="$3" color="$color"
                    />
                    <Input
                      value={emailTitle}
                      onChangeText={setEmailTitle}
                      placeholder={t('admin.emailTitle')}
                      placeholderTextColor={theme.mutedText.val as any}
                      backgroundColor="$subtleBackground"
                      borderWidth={1} borderColor="$borderColor" borderRadius="$3"
                      paddingHorizontal="$3" height={42} fontSize="$3" color="$color"
                    />
                    <Input
                      value={emailBody}
                      onChangeText={setEmailBody}
                      placeholder={t('admin.emailBody')}
                      placeholderTextColor={theme.mutedText.val as any}
                      backgroundColor="$subtleBackground"
                      borderWidth={1} borderColor="$borderColor" borderRadius="$3"
                      paddingHorizontal="$3" paddingVertical="$2"
                      fontSize="$3" color="$color"
                      multiline numberOfLines={4}
                      style={{ minHeight: 80 } as any}
                    />
                    <Input
                      value={emailButtonText}
                      onChangeText={setEmailButtonText}
                      placeholder={t('admin.emailButtonText')}
                      placeholderTextColor={theme.mutedText.val as any}
                      backgroundColor="$subtleBackground"
                      borderWidth={1} borderColor="$borderColor" borderRadius="$3"
                      paddingHorizontal="$3" height={42} fontSize="$3" color="$color"
                    />
                    {emailButtonText.trim() !== '' && (
                      <Input
                        value={emailButtonUrl}
                        onChangeText={setEmailButtonUrl}
                        placeholder={t('admin.emailButtonUrl')}
                        placeholderTextColor={theme.mutedText.val as any}
                        backgroundColor="$subtleBackground"
                        borderWidth={1} borderColor="$borderColor" borderRadius="$3"
                        paddingHorizontal="$3" height={42} fontSize="$3" color="$color"
                        autoCapitalize="none" keyboardType="url"
                      />
                    )}
                  </>
                ) : (
                  <Text color="$mutedText" fontSize="$2" lineHeight={18}>
                    {t('admin.emailTemplateWelcomeDesc')}
                  </Text>
                )}

                <AppButton
                  onPress={handleSendEmail}
                  disabled={emailSending || (emailTemplate === 'announcement' && (!emailSubject.trim() || !emailTitle.trim() || !emailBody.trim()))}
                >
                  {emailSending ? t('common.loading') : t('admin.emailSend')}
                </AppButton>

                {emailResult && (
                  <Text color="$mutedText" fontSize="$2" textAlign="center">{emailResult}</Text>
                )}
              </YStack>
            </AppCard>
          )}
        </YStack>
      </FadeIn>
    </ScrollView>
  )
}
