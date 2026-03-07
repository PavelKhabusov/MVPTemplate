import { defineManifest } from '@crxjs/vite-plugin'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { extensionConfig } from './config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf-8')
  const result: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx > 0) result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }
  return result
}

const ext = readEnvFile(path.resolve(__dirname, '..', '.env.extension'))
const backendEnv = readEnvFile(path.resolve(__dirname, '..', '..', 'backend', '.env'))
const mode = ext.VITE_EXTENSION_MODE || 'sidebar'
const isPopup = mode === 'popup'
const googleClientId = backendEnv.CHROME_GOOGLE_CLIENT_ID || ext.CHROME_GOOGLE_CLIENT_ID || ''

const basePermissions = isPopup ? ['activeTab', 'storage'] : ['sidePanel', 'activeTab', 'storage']
const allPermissions = [...new Set([...basePermissions, ...extensionConfig.permissions])]

export default defineManifest({
  manifest_version: 3,
  name: 'MVPTemplate', // BRAND: change when forking
  version: '0.1.0',
  description: 'Production-ready cross-platform MVP starter', // BRAND: change when forking
  permissions: allPermissions,
  ...(extensionConfig.hostPermissions.length > 0
    ? { host_permissions: extensionConfig.hostPermissions }
    : {}),
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  ...(isPopup
    ? {}
    : {
        side_panel: {
          default_path: 'src/sidebar/index.html',
        },
      }),
  action: {
    default_title: 'MVPTemplate',
    ...(isPopup ? { default_popup: 'src/popup/index.html' } : {}),
  },
  ...(googleClientId ? { oauth2: { client_id: googleClientId, scopes: [] } } : {}),
  ...(extensionConfig.contentScripts
    ? {
        content_scripts: [
          {
            matches: extensionConfig.hostPermissions.length > 0
              ? extensionConfig.hostPermissions
              : ['<all_urls>'],
            js: ['src/content.ts'],
          },
        ],
      }
    : {}),
  icons: {
    '16': 'icons/icon-16.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
})
