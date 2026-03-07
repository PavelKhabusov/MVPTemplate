#!/usr/bin/env node
/**
 * Quick screenshot tool for visual QA.
 *
 * Usage:
 *   node scripts/screenshot.mjs                     # all pages
 *   node scripts/screenshot.mjs landing             # just landing
 *   node scripts/screenshot.mjs landing settings    # landing + settings
 *   node scripts/screenshot.mjs --mobile            # mobile viewport
 *   node scripts/screenshot.mjs --scroll landing    # landing with scroll positions
 *
 * Screenshots are saved to: /tmp/screenshots/
 * The Expo dev server must be running on port 8081.
 */

import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const OUT_DIR = '/tmp/screenshots'
const BASE_URL = 'http://localhost:8081'
const DESKTOP = { width: 1280, height: 800 }
const MOBILE = { width: 390, height: 844 }

const PAGES = {
  landing:  { url: '/landing',        wait: 'Ship your MVP' },
  home:     { url: '/',               wait: 'Welcome' },
  settings: { url: '/(tabs)/settings', wait: 'Theme' },
  signin:   { url: '/sign-in',        wait: 'Sign In' },
  pricing:  { url: '/pricing',        wait: 'Basic' },
}

const args = process.argv.slice(2)
const isMobile = args.includes('--mobile')
const doScroll = args.includes('--scroll')
const pageNames = args.filter(a => !a.startsWith('--'))
const selected = pageNames.length > 0
  ? pageNames.filter(n => PAGES[n])
  : Object.keys(PAGES)

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const viewport = isMobile ? MOBILE : DESKTOP
const suffix = isMobile ? 'mobile' : 'desktop'

async function dismissOverlays(page) {
  await page.addInitScript(() => {
    localStorage.setItem('app-storage', JSON.stringify({
      state: { hasCompletedOnboarding: true, lastRoute: null },
      version: 0,
    }))
    localStorage.setItem('cookie-consent', JSON.stringify({
      state: { consent: 'accepted' },
      version: 0,
    }))
    localStorage.setItem('language-storage', JSON.stringify({
      state: { language: null },
      version: 0,
    }))
  })
}

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  await dismissOverlays(page)

  const results = []

  for (const name of selected) {
    const { url, wait } = PAGES[name]
    try {
      await page.goto(BASE_URL + url, { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Wait for key content
      try {
        await page.getByText(wait).first().waitFor({ state: 'visible', timeout: 15000 })
      } catch { /* proceed anyway */ }

      // Let animations settle
      await page.waitForTimeout(1500)

      // Viewport screenshot
      const file = join(OUT_DIR, `${name}-${suffix}.png`)
      await page.screenshot({ path: file, fullPage: false })
      results.push(file)
      console.log(`  ${name}-${suffix}.png`)

      // Full page screenshot
      const fileFull = join(OUT_DIR, `${name}-${suffix}-full.png`)
      await page.screenshot({ path: fileFull, fullPage: true })
      results.push(fileFull)
      console.log(`  ${name}-${suffix}-full.png`)

      // Scroll screenshots (header behavior, etc.)
      if (doScroll) {
        for (const scrollY of [300, 600, 1200]) {
          await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY)
          await page.waitForTimeout(400)
          const scrollFile = join(OUT_DIR, `${name}-${suffix}-scroll${scrollY}.png`)
          await page.screenshot({ path: scrollFile, fullPage: false })
          results.push(scrollFile)
          console.log(`  ${name}-${suffix}-scroll${scrollY}.png`)
        }
        // Reset scroll
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      }
    } catch (err) {
      console.error(`  FAILED ${name}: ${err.message}`)
    }
  }

  await browser.close()
  console.log(`\nDone! ${results.length} screenshots in ${OUT_DIR}`)
}

run().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
