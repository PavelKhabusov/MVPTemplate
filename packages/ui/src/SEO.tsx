import { Platform } from 'react-native'
import Head from 'expo-router/head'

interface SEOProps {
  title: string
  description?: string
  ogImage?: string
}

export function SEO({ title, description, ogImage }: SEOProps) {
  if (Platform.OS !== 'web') return null

  return (
    <Head>
      <title>{title} | MVPTemplate</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Head>
  )
}
