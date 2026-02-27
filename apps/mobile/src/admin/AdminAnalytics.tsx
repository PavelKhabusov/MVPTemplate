import React from 'react'
import { ScrollView, useWindowDimensions } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppCard, FadeIn } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg'
import { type AnalyticsDashboard, formatDuration, formatShortDate } from './types'

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

interface AdminAnalyticsTabProps {
  data: AnalyticsDashboard | null
  loading: boolean
  docFeedbackEnabled: boolean
}

export function AdminAnalyticsTab({ data: analyticsData, loading, docFeedbackEnabled }: AdminAnalyticsTabProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
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

            {/* Doc Feedback */}
            {docFeedbackEnabled && analyticsData.docFeedback && analyticsData.docFeedback.length > 0 && (
              <AppCard animated={false}>
                <Text fontWeight="600" color="$color" fontSize="$3" marginBottom="$2">
                  {t('admin.docFeedback')}
                </Text>
                <YStack gap="$2">
                  {analyticsData.docFeedback.map((item) => {
                    const pct = item.total > 0 ? Math.round((item.likes / item.total) * 100) : 0
                    return (
                      <XStack key={item.pageId} alignItems="center" justifyContent="space-between" paddingVertical="$1">
                        <YStack flex={1} gap="$0.5">
                          <Text fontWeight="500" color="$color" fontSize="$3">{item.pageId}</Text>
                          <XStack gap="$3" alignItems="center">
                            <XStack alignItems="center" gap="$1">
                              <Ionicons name="thumbs-up" size={13} color={theme.accent.val} />
                              <Text fontSize="$2" color="$accent">{item.likes}</Text>
                            </XStack>
                            <XStack alignItems="center" gap="$1">
                              <Ionicons name="thumbs-down" size={13} color="#EF4444" />
                              <Text fontSize="$2" color="#EF4444">{item.dislikes}</Text>
                            </XStack>
                          </XStack>
                        </YStack>
                        <Text fontSize="$4" fontWeight="bold" color={pct >= 50 ? '$accent' : '#EF4444'}>
                          {pct}%
                        </Text>
                      </XStack>
                    )
                  })}
                </YStack>
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
  )
}
