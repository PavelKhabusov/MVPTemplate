import { useState, useEffect, useCallback } from 'react'
import { XStack, YStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore } from '@mvp/store'
import { ScalePress } from '@mvp/ui'

interface DocFeedbackHttp {
  get<T = any>(url: string): Promise<{ data: T }>
  post<T = any>(url: string, data?: any): Promise<{ data: T }>
}

interface DocFeedbackProps {
  pageId: string
  http: DocFeedbackHttp
}

export function DocFeedback({ pageId, http }: DocFeedbackProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [userVote, setUserVote] = useState<boolean | null>(null)
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const fetchFeedback = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await http.get(`/doc-feedback/${pageId}`)
      const data = (res.data as any).data
      setUserVote(data.userVote)
      setLikes(data.likes)
      setDislikes(data.dislikes)
    } catch {}
  }, [pageId, isAuthenticated, http])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const submit = async (helpful: boolean) => {
    if (submitting || !isAuthenticated) return
    setSubmitting(true)
    try {
      await http.post('/doc-feedback', { pageId, helpful })
      // Optimistic update
      if (userVote === helpful) return // Already voted same
      if (userVote === true) setLikes((l) => l - 1)
      if (userVote === false) setDislikes((d) => d - 1)
      if (helpful) setLikes((l) => l + 1)
      else setDislikes((d) => d + 1)
      setUserVote(helpful)
    } catch {}
    setSubmitting(false)
  }

  if (!isAuthenticated) return null

  return (
    <YStack
      paddingVertical="$4"
      paddingHorizontal="$4"
      marginTop="$4"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      alignItems="center"
      gap="$3"
    >
      <Text color="$mutedText" fontSize="$3">
        {t('docs.wasHelpful')}
      </Text>
      <XStack gap="$4" alignItems="center">
        <ScalePress onPress={() => submit(true)}>
          <XStack
            alignItems="center"
            gap="$2"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
            borderWidth={1}
            borderColor={userVote === true ? '$accent' : '$borderColor'}
            backgroundColor={userVote === true ? `${theme.accent.val}15` : 'transparent'}
          >
            <Ionicons
              name={userVote === true ? 'thumbs-up' : 'thumbs-up-outline'}
              size={18}
              color={userVote === true ? theme.accent.val : theme.mutedText.val}
            />
            {likes > 0 && (
              <Text
                fontSize="$2"
                color={userVote === true ? '$accent' : '$mutedText'}
                fontWeight="600"
              >
                {likes}
              </Text>
            )}
          </XStack>
        </ScalePress>

        <ScalePress onPress={() => submit(false)}>
          <XStack
            alignItems="center"
            gap="$2"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
            borderWidth={1}
            borderColor={userVote === false ? '#EF4444' : '$borderColor'}
            backgroundColor={userVote === false ? '#EF444415' : 'transparent'}
          >
            <Ionicons
              name={userVote === false ? 'thumbs-down' : 'thumbs-down-outline'}
              size={18}
              color={userVote === false ? '#EF4444' : theme.mutedText.val}
            />
            {dislikes > 0 && (
              <Text
                fontSize="$2"
                color={userVote === false ? '#EF4444' : '$mutedText'}
                fontWeight="600"
              >
                {dislikes}
              </Text>
            )}
          </XStack>
        </ScalePress>
      </XStack>
    </YStack>
  )
}
