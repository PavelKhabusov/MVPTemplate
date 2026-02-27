import { ScrollViewStyleReset } from 'expo-router/html'

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Primary Meta Tags */}
        <title>MVPTemplate</title>
        <meta name="title" content="MVPTemplate" />
        <meta name="description" content="Universal MVP template powered by Expo + Tamagui" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="MVPTemplate" />
        <meta property="og:description" content="Universal MVP template powered by Expo + Tamagui" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MVPTemplate" />
        <meta name="twitter:description" content="Universal MVP template powered by Expo + Tamagui" />

        {/* Favicon */}
        <link rel="icon" type="image/png" href="/favicon.png?v=2" />

        <ScrollViewStyleReset />

        {/* Thin scrollbars for web */}
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(150,150,150,0.3) transparent;
          }
          *::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          *::-webkit-scrollbar-track {
            background: transparent;
          }
          *::-webkit-scrollbar-thumb {
            background: rgba(150,150,150,0.3);
            border-radius: 3px;
          }
          *::-webkit-scrollbar-thumb:hover {
            background: rgba(150,150,150,0.5);
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
