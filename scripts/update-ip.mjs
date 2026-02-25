#!/usr/bin/env node
// Updates EXPO_PUBLIC_API_URL in apps/mobile/.env with current local IP

import { networkInterfaces } from 'os'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../apps/mobile/.env')
const port = process.env.PORT || '3000'

function getLocalIP() {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal (loopback) and non-IPv4
      if (!net.internal && net.family === 'IPv4' && !net.address.startsWith('172.')) {
        return net.address
      }
    }
  }
  return 'localhost'
}

const ip = getLocalIP()
const url = `http://${ip}:${port}`

if (!existsSync(envPath)) {
  writeFileSync(envPath, `EXPO_PUBLIC_API_URL=${url}\n`)
  console.log(`Created .env with API_URL=${url}`)
  process.exit(0)
}

let content = readFileSync(envPath, 'utf-8')
const match = content.match(/^EXPO_PUBLIC_API_URL=(.*)$/m)

if (match) {
  const oldUrl = match[1]
  if (oldUrl === url) {
    console.log(`IP unchanged: ${url}`)
  } else {
    content = content.replace(/^EXPO_PUBLIC_API_URL=.*$/m, `EXPO_PUBLIC_API_URL=${url}`)
    writeFileSync(envPath, content)
    console.log(`Updated API_URL: ${oldUrl} → ${url}`)
  }
} else {
  content = `EXPO_PUBLIC_API_URL=${url}\n${content}`
  writeFileSync(envPath, content)
  console.log(`Added API_URL=${url}`)
}