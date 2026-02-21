import { Platform, ScrollView } from 'react-native'
import { YStack } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { router } from 'expo-router'
import { SEO } from '../SEO'
import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { LandingFeatures } from './LandingFeatures'
import { LandingShowcase } from './LandingShowcase'
import { LandingCTA } from './LandingCTA'
import { LandingFooter } from './LandingFooter'

export function LandingPage() {
  const { t } = useTranslation()

  if (Platform.OS !== 'web') return null

  const navigate = (href: string) => {
    router.push(href as any)
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <SEO
        title={t('landing.heroTitle')}
        description={t('landing.heroSubtitle')}
      />
      <LandingNav onNavigate={navigate} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <LandingHero onNavigate={navigate} />
        <LandingFeatures />
        <LandingShowcase />
        <LandingCTA onNavigate={navigate} />
        <LandingFooter onNavigate={navigate} />
      </ScrollView>
    </YStack>
  )
}
