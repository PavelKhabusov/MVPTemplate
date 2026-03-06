import { defineManifest } from '@crxjs/vite-plugin'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { extensionConfig } from './config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readExtensionEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, '..', '.env.extension')
  if (!fs.existsSync(envPath)) return {}
  const content = fs.readFileSync(envPath, 'utf-8')
  const result: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const idx = line.indexOf('=')
    if (idx > 0) result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }
  return result
}

const ext = readExtensionEnv()
const mode = ext.VITE_EXTENSION_MODE || 'sidebar'
const isPopup = mode === 'popup'

const basePermissions = isPopup ? ['activeTab', 'storage'] : ['sidePanel', 'activeTab', 'storage']
const allPermissions = [...new Set([...basePermissions, ...extensionConfig.permissions])]

export default defineManifest({
  manifest_version: 3,
  name: 'MVP Extension',
  version: '0.1.0',
  description: 'Your app — right in the browser',
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
    default_title: 'MVP Extension',
    ...(isPopup ? { default_popup: 'src/popup/index.html' } : {}),
  },
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
