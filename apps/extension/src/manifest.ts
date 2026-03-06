import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'MVP Extension',
  version: '0.1.0',
  description: 'Your app — right in the browser',
  permissions: ['sidePanel', 'activeTab', 'storage'],
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  side_panel: {
    default_path: 'src/sidebar/index.html',
  },
  action: {
    default_title: 'MVP Extension',
    // For popup mode, set: default_popup: 'src/popup/index.html'
    // and remove side_panel above
  },
  icons: {
    '16': 'icons/icon-16.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
})
