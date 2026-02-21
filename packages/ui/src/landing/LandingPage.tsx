import { Platform, ScrollView } from 'react-native'
import { YStack } from 'tamagui'
import { router } from 'expo-router'
import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { LandingFeatures } from './LandingFeatures'
import { LandingTerminal } from './LandingTerminal'
import { LandingShowcase } from './LandingShowcase'
import { LandingCTA } from './LandingCTA'
import { LandingFooter } from './LandingFooter'
import { CookieBanner } from '../components/CookieBanner'

export function LandingPage() {
  if (Platform.OS !== 'web') return null

  const navigate = (href: string) => {
    router.push(href as any)
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <LandingNav onNavigate={navigate} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <LandingHero onNavigate={navigate} />
        <LandingFeatures />
        <LandingTerminal />
        <LandingShowcase />
        <LandingCTA onNavigate={navigate} />
        <LandingFooter onNavigate={navigate} />
      </ScrollView>
      <CookieBanner />
    </YStack>
  )
}
