import fs from 'fs'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const backendEnvPath = path.join(root, 'apps', 'backend', '.env')
const backendExamplePath = path.join(root, 'apps', 'backend', '.env.example')
const mobileEnvPath = path.join(root, 'apps', 'mobile', '.env')
const mobileExamplePath = path.join(root, 'apps', 'mobile', '.env.example')

function randomHex(bytes) {
  return crypto.randomBytes(bytes).toString('hex')
}

// --- Backend .env ---
if (fs.existsSync(backendEnvPath)) {
  console.log(`[skip] apps/backend/.env already exists`)
} else {
  if (!fs.existsSync(backendExamplePath)) {
    console.error('[error] apps/backend/.env.example not found')
    process.exit(1)
  }

  let content = fs.readFileSync(backendExamplePath, 'utf-8')

  // Generate JWT secrets
  content = content.replace(
    'change-me-access-secret-min-32-chars',
    randomHex(32),
  )
  content = content.replace(
    'change-me-refresh-secret-min-32-chars',
    randomHex(32),
  )

  fs.writeFileSync(backendEnvPath, content, 'utf-8')
  console.log(`[ok] Created apps/backend/.env with generated JWT secrets`)
}

// --- Mobile .env ---
if (fs.existsSync(mobileEnvPath)) {
  console.log(`[skip] apps/mobile/.env already exists`)
} else {
  if (!fs.existsSync(mobileExamplePath)) {
    console.error('[error] apps/mobile/.env.example not found')
    process.exit(1)
  }

  fs.copyFileSync(mobileExamplePath, mobileEnvPath)
  console.log(`[ok] Created apps/mobile/.env`)
}

console.log('\nDone. Review .env files and add optional keys (Stripe, YooKassa, Robokassa, etc.)')
