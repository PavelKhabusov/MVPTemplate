import { Platform } from 'react-native'
import Head from 'expo-router/head'
import { useCompanyStore } from '@mvp/store'
import { APP_BRAND } from '@mvp/template-config/src/brand'

interface SEOProps {
  title: string
  description?: string
  ogImage?: string
}

export function SEO({ title, description, ogImage }: SEOProps) {
  if (Platform.OS !== 'web') return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const appName = useCompanyStore((s) => s.info.appName) || APP_BRAND.name
  const fullTitle = `${title} | ${appName}`

  return (
    <Head>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Head>
  )
}
