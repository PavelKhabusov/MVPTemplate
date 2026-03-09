/**
 * APP_BRAND — единственный файл, который меняется при форке шаблона под новый продукт.
 *
 * Все runtime-файлы импортируют название отсюда.
 * Статические файлы (manifest.ts, app.config.ts, +html.tsx, backend/app.ts, seeds)
 * не могут импортировать пакеты на этапе сборки — они помечены комментарием
 * "// BRAND: change when forking" для ручной замены.
 *
 * Что менять при форке:
 *   1. Всё в этом файле
 *   2. apps/mobile/app.config.ts  — name, slug, scheme, bundleIdentifier, package
 *   3. apps/extension/src/manifest.ts  — name, description, default_title
 *   4. apps/extension/src/sidebar/index.html + popup/index.html  — <title>
 *   5. apps/mobile/app/+html.tsx  — <title>, og:title, og:description
 *   6. apps/backend/src/database/schema/company-info.ts  — default('...')
 *   7. apps/backend/src/modules/config/config.routes.ts  — appName: '...'
 *   8. apps/backend/src/app.ts  — Swagger title/description
 *   9. app.json  — android.package, ios.bundleIdentifier
 */
export const APP_BRAND = {
  /** Short product name — used in UI headers, footer, onboarding, settings */
  name: 'MVPTemplate',

  /** URL-safe slug — used in routes, package IDs, OAuth schemes */
  slug: 'mvptemplate',

  /** One-line value proposition — used in meta descriptions and landing subtitle */
  tagline: 'Production-ready cross-platform MVP starter',

  /** Copyright holder name */
  copyright: 'MVPTemplate',

  /** Primary CTA link on landing (Chrome Web Store, App Store, GitHub, etc.) */
  ctaUrl: 'https://github.com/PavelKhabusov/MVPTemplate',

  /** Default font for the browser extension (must match a key in FONT_FAMILY_CONFIG) */
  defaultFontFamily: 'monospace',

  /** Default color scheme for the browser extension (must match a key in COLOR_SCHEMES) */
  defaultColorScheme: 'slate',
} as const
