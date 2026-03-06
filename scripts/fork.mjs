#!/usr/bin/env node
/**
 * fork.mjs — Rename MVPTemplate to your product
 *
 * Usage:
 *   node scripts/fork.mjs --name "MyApp" --slug "myapp" --bundle "com.company.myapp"
 *
 * Options:
 *   --name     Product display name, e.g. "CallSheet"  (required)
 *   --slug     URL-safe slug, e.g. "callsheet"          (required)
 *   --bundle   iOS/Android bundle ID, e.g. "com.company.callsheet" (optional, auto-generated from slug)
 *   --tagline  Short description                        (optional)
 *   --cta-url  CTA / store URL                         (optional)
 *
 * What this script updates:
 *   1. packages/template-config/src/brand.ts
 *   2. apps/mobile/app.config.ts
 *   3. apps/extension/src/manifest.ts
 *   4. apps/extension/src/sidebar/index.html
 *   5. apps/extension/src/popup/index.html
 *   6. apps/mobile/app/+html.tsx
 *   7. apps/backend/src/database/schema/company-info.ts
 *   8. apps/backend/src/modules/config/config.routes.ts
 *   9. apps/backend/src/app.ts
 *  10. app.json
 *  11. apps/backend/docker/docker-compose.dev.yml
 *  12. scripts/setup.ps1
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── Parse CLI args ──────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const result = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      result[key] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true
    }
  }
  return result
}

const opts = parseArgs()

if (!opts.name || !opts.slug) {
  console.error('Usage: node scripts/fork.mjs --name "MyApp" --slug "myapp" [--bundle "com.company.myapp"] [--tagline "..."] [--cta-url "..."]')
  process.exit(1)
}

const NAME = opts.name                                // e.g. "CallSheet"
const SLUG = opts.slug.toLowerCase()                  // e.g. "callsheet"
const SLUG_KEBAB = SLUG.replace(/[^a-z0-9]/g, '-')   // e.g. "call-sheet"
const BUNDLE = opts.bundle || `com.${SLUG}.app`       // e.g. "com.callsheet.app"
const TAGLINE = opts.tagline || `${NAME} — built on MVPTemplate`
const CTA_URL = opts['cta-url'] || ''

// ── Helpers ─────────────────────────────────────────────────────────────────

function read(rel) {
  const p = path.resolve(ROOT, rel)
  if (!fs.existsSync(p)) { console.warn(`  skip (not found): ${rel}`); return null }
  return fs.readFileSync(p, 'utf-8')
}

function write(rel, content) {
  fs.writeFileSync(path.resolve(ROOT, rel), content, 'utf-8')
  console.log(`  ✓ ${rel}`)
}

function replace(content, ...pairs) {
  let result = content
  for (const [from, to] of pairs) {
    result = result.split(from).join(to)
  }
  return result
}

// ── 1. brand.ts ──────────────────────────────────────────────────────────────

let brand = read('packages/template-config/src/brand.ts')
if (brand) {
  brand = brand
    .replace(/name: '[^']+'(?=,\s*$)/m, `name: '${NAME}'`)
    .replace(/slug: '[^']+'(?=,\s*$)/m, `slug: '${SLUG}'`)
    .replace(/tagline: '[^']+'(?=,\s*$)/m, `tagline: '${TAGLINE}'`)
    .replace(/copyright: '[^']+'(?=,\s*$)/m, `copyright: '${NAME}'`)
    .replace(/ctaUrl: '[^']+'(?=,\s*$)/m, `ctaUrl: '${CTA_URL || `https://github.com/your-org/${SLUG}`}'`)
  write('packages/template-config/src/brand.ts', brand)
}

// ── 2. app.config.ts ─────────────────────────────────────────────────────────

let appConfig = read('apps/mobile/app.config.ts')
if (appConfig) {
  appConfig = appConfig
    .replace(/name: '[^']+', \/\/ BRAND: change when forking/, `name: '${NAME}', // BRAND: change when forking`)
    .replace(/slug: '[^']+', \/\/ BRAND: change when forking/, `slug: '${SLUG_KEBAB}', // BRAND: change when forking`)
    .replace(/scheme: '[^']+'/, `scheme: '${SLUG}'`)
    .replace(/bundleIdentifier: '[^']+'/, `bundleIdentifier: '${BUNDLE}'`)
    .replace(/package: '[^']+'/, `package: '${BUNDLE}'`)
  write('apps/mobile/app.config.ts', appConfig)
}

// ── 3. manifest.ts ───────────────────────────────────────────────────────────

let manifest = read('apps/extension/src/manifest.ts')
if (manifest) {
  // Replace both original template values and any previously-forked values
  manifest = manifest
    .replace(/name: '[^']+', \/\/ BRAND: change when forking/, `name: '${NAME}', // BRAND: change when forking`)
    .replace(/description: '[^']+', \/\/ BRAND: change when forking/, `description: '${TAGLINE}', // BRAND: change when forking`)
    .replace(/default_title: '[^']+'/, `default_title: '${NAME}'`)
  write('apps/extension/src/manifest.ts', manifest)
}

// ── 4+5. extension HTML files ────────────────────────────────────────────────

for (const htmlPath of ['apps/extension/src/sidebar/index.html', 'apps/extension/src/popup/index.html']) {
  let html = read(htmlPath)
  if (html) {
    html = replace(html, ['<title>MVP Extension</title>', `<title>${NAME}</title>`])
    write(htmlPath, html)
  }
}

// ── 6. +html.tsx ─────────────────────────────────────────────────────────────

let htmlTsx = read('apps/mobile/app/+html.tsx')
if (htmlTsx) {
  htmlTsx = htmlTsx
    .replace(/<title>[^<]+<\/title>/, `<title>${NAME}</title>`)
    .replace(/content="[^"]+"/g, (m) => {
      // Only replace meta content that looks like a product name (title/og:title etc.), not URLs/types
      if (m.includes('http') || m.includes('/') || m.includes('@') || m.includes('website') || m.includes('summary')) return m
      return `content="${NAME}"`
    })
  write('apps/mobile/app/+html.tsx', htmlTsx)
}

// ── 7. company-info schema ───────────────────────────────────────────────────

let schema = read('apps/backend/src/database/schema/company-info.ts')
if (schema) {
  schema = schema.replace(/\.default\('[^']+'\)/, `.default('${NAME}')`)
  write('apps/backend/src/database/schema/company-info.ts', schema)
}

// ── 8. config.routes.ts ──────────────────────────────────────────────────────

let configRoutes = read('apps/backend/src/modules/config/config.routes.ts')
if (configRoutes) {
  configRoutes = configRoutes.replace(/appName: '[^']+'/, `appName: '${NAME}'`)
  write('apps/backend/src/modules/config/config.routes.ts', configRoutes)
}

// ── 9. app.ts (Swagger) ──────────────────────────────────────────────────────

let appTs = read('apps/backend/src/app.ts')
if (appTs) {
  appTs = appTs
    .replace(/title: '[^']+ API'/, `title: '${NAME} API'`)
    .replace(/description: 'API documentation for [^']+'/, `description: 'API documentation for ${NAME}'`)
  write('apps/backend/src/app.ts', appTs)
}

// ── 10. app.json ─────────────────────────────────────────────────────────────

let appJson = read('app.json')
if (appJson) {
  appJson = appJson.replace(/"com\.[^"]+"/g, `"${BUNDLE}"`)
  write('app.json', appJson)
}

// ── 11. docker-compose.dev.yml ───────────────────────────────────────────────

let compose = read('apps/backend/docker/docker-compose.dev.yml')
if (compose) {
  compose = compose.replace(/POSTGRES_DB: \S+/, `POSTGRES_DB: ${SLUG.replace(/-/g, '_')}`)
  write('apps/backend/docker/docker-compose.dev.yml', compose)
}

// ── 12. setup.ps1 ────────────────────────────────────────────────────────────

let setupPs1 = read('scripts/setup.ps1')
if (setupPs1) {
  setupPs1 = setupPs1
    .replace(/^# .+ — Full Setup Script/m, `# ${NAME} — Full Setup Script`)
    .replace(/=== .+ Setup ===/g, `=== ${NAME} Setup ===`)
  write('scripts/setup.ps1', setupPs1)
}

// ── Done ─────────────────────────────────────────────────────────────────────

console.log(`
Done! "${NAME}" (${SLUG}) is configured.

Next steps:
  1. Update apps/backend/.env — DATABASE_URL, JWT_SECRET, etc.
  2. Update apps/extension/.env.extension — VITE_EXTENSION_MODE
  3. Update apps/mobile/src/brand/ landing content and i18n strings
  4. Run: npm install && npm run dev
`)
