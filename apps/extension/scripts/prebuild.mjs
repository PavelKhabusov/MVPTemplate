#!/usr/bin/env node
/**
 * Pre-build script: reads extension settings from the backend .env file
 * and writes them to .env.extension for manifest.ts to consume.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BACKEND_ENV = path.resolve(ROOT, '..', 'backend', '.env')
const ENV_FILE = path.join(ROOT, '.env.extension')

const DEFAULTS = {
  VITE_EXTENSION_MODE: 'sidebar',
  VITE_EXTENSION_ID: '',
  VITE_EXTENSION_ENABLED: 'true',
}

function readBackendEnv() {
  if (!fs.existsSync(BACKEND_ENV)) {
    console.warn('\x1b[33m⚠ Backend .env not found. Using defaults.\x1b[0m')
    return {}
  }
  const content = fs.readFileSync(BACKEND_ENV, 'utf-8')
  const values = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim()
      let val = trimmed.slice(idx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      values[key] = val
    }
  }
  return values
}

const env = readBackendEnv()

const settings = {
  VITE_EXTENSION_MODE: env.CHROME_EXTENSION_MODE || DEFAULTS.VITE_EXTENSION_MODE,
  VITE_EXTENSION_ID: env.CHROME_EXTENSION_ID || DEFAULTS.VITE_EXTENSION_ID,
  VITE_EXTENSION_ENABLED: env.CHROME_EXTENSION_ENABLED || DEFAULTS.VITE_EXTENSION_ENABLED,
}

// Write .env.extension
const envContent = Object.entries(settings)
  .map(([k, v]) => `${k}=${v}`)
  .join('\n')
fs.writeFileSync(ENV_FILE, envContent + '\n')

// Log settings
const c = '\x1b[36m'
const b = '\x1b[1m'
const r = '\x1b[0m'
console.log('')
console.log(`${c}Chrome Extension Build Settings${r}`)
console.log(`  Mode:    ${b}${settings.VITE_EXTENSION_MODE}${r}`)
console.log(`  ID:      ${b}${settings.VITE_EXTENSION_ID || '(not set)'}${r}`)
console.log(`  Enabled: ${b}${settings.VITE_EXTENSION_ENABLED}${r}`)
console.log('')
