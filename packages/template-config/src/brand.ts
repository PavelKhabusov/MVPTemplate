/**
 * Central brand configuration — single source of truth for product name.
 *
 * When forking the template for a new product, change these values.
 * All runtime files import from here. Static files (manifest.ts, app.config.ts,
 * +html.tsx) cannot import packages — update them manually (marked with
 * "// BRAND: change when forking").
 */
export const APP_BRAND = {
  /** Short product name (used in UI, headers, footer) */
  name: 'CallSheet',

  /** URL slug / identifier (used in URLs, package names) */
  slug: 'callsheet',

  /** One-line tagline */
  tagline: 'Call clients directly from Google Sheets',

  /** Copyright holder */
  copyright: 'CallSheet',

  /** Chrome Web Store URL (set after publishing) */
  storeUrl: 'https://chromewebstore.google.com',

  /** Default font for the browser extension (must match a key in FONT_FAMILY_CONFIG) */
  defaultFontFamily: 'monospace',

  /** Default color scheme for the browser extension (must match a key in COLOR_SCHEMES) */
  defaultColorScheme: 'pink',
} as const