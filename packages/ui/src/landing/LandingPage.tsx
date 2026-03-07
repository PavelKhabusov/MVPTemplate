import { useEffect } from 'react'
import { Platform, ScrollView } from 'react-native'
import { YStack } from 'tamagui'
import { router } from 'expo-router'
import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { LandingFeatures } from './LandingFeatures'
import { LandingTerminal } from './LandingTerminal'
import { LandingShowcase } from './LandingShowcase'
import { LandingPricing } from './LandingPricing'
import { LandingCTA } from './LandingCTA'
import { LandingFooter } from './LandingFooter'
import { CookieBanner } from '../components/CookieBanner'

interface LandingPlan {
  id: string
  name: string
  description?: string
  priceAmount: number
  currency: string
  interval: string
  features: string[]
  sortOrder: number
}

interface LandingPageProps {
  logo?: any
  paymentsEnabled?: boolean
  plans?: LandingPlan[]
}

export function LandingPage({ logo, paymentsEnabled = false, plans = [] }: LandingPageProps) {
  if (Platform.OS !== 'web') return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Load Instrument Serif for editorial headlines
    if (!document.querySelector('[data-font-instrument-serif]')) {
      const preconnect = document.createElement('link')
      preconnect.rel = 'preconnect'
      preconnect.href = 'https://fonts.googleapis.com'
      document.head.appendChild(preconnect)

      const preconnectGstatic = document.createElement('link')
      preconnectGstatic.rel = 'preconnect'
      preconnectGstatic.href = 'https://fonts.gstatic.com'
      ;(preconnectGstatic as any).crossOrigin = 'anonymous'
      document.head.appendChild(preconnectGstatic)

      const fontLink = document.createElement('link')
      fontLink.rel = 'stylesheet'
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap'
      fontLink.setAttribute('data-font-instrument-serif', '')
      document.head.appendChild(fontLink)
    }

    const style = document.createElement('style')
    style.textContent = `
      body { scroll-behavior: smooth; }
      .landing-page-root {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(128,128,128,0.04)'/%3E%3C/svg%3E");
        background-size: 60px 60px;
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const navigate = (href: string) => {
    router.push(href as any)
  }

  return (
    <YStack flex={1} backgroundColor="$background" className="landing-page-root">
      <LandingNav onNavigate={navigate} logo={logo} paymentsEnabled={paymentsEnabled} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <LandingHero onNavigate={navigate} />
        <LandingFeatures />
        <LandingTerminal />
        <LandingShowcase />
        {paymentsEnabled && (
          <LandingPricing onNavigate={navigate} plans={plans} />
        )}
        <LandingCTA onNavigate={navigate} />
        <LandingFooter onNavigate={navigate} logo={logo} />
      </ScrollView>
      <CookieBanner />
    </YStack>
  )
}
