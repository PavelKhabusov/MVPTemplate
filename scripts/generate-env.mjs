import fs from 'fs'
import crypto from 'crypto'
import os from 'os'
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

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address
      }
    }
  }
  return 'localhost'
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

  let mobileContent = fs.readFileSync(mobileExamplePath, 'utf-8')

  const localIP = getLocalIP()
  mobileContent = mobileContent.replace(
    'EXPO_PUBLIC_API_URL=http://localhost:3000',
    `EXPO_PUBLIC_API_URL=http://${localIP}:3000`,
  )

  fs.writeFileSync(mobileEnvPath, mobileContent, 'utf-8')
  console.log(`[ok] Created apps/mobile/.env (API_URL → http://${localIP}:3000)`)
}

console.log('\nDone. Review .env files and add optional keys (Stripe, YooKassa, Robokassa, etc.)')
