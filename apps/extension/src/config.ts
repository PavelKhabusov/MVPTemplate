import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { Phone, Clock } from 'lucide-react'

type Lang = 'en' | 'ru' | 'es' | 'ja'

export interface CustomTab {
  id: string
  label: Partial<Record<Lang, string>>
  icon: ComponentType<{ size: number; className?: string }>
  component: LazyExoticComponent<ComponentType<any>> | ComponentType<any>
}

export interface OnboardingStep {
  icon: string
  title: Partial<Record<Lang, string>>
  desc: Partial<Record<Lang, string>>
}

export interface ExtensionConfig {
  tabs: CustomTab[]
  settingsSections: Array<LazyExoticComponent<ComponentType<any>> | ComponentType<any>>
  onboardingSteps: OnboardingStep[]
  contentScripts: boolean
  /** Register chrome.tabs listeners synchronously in background.ts to send TAB_CONTEXT_CHANGED (required for MV3 service workers) */
  tabTracking: boolean
  backgroundHandlers: (() => Promise<{ default: Record<string, (message: any, sender: any, sendResponse: (r: any) => void) => boolean | void> }>) | null
  permissions: string[]
  hostPermissions: string[]
}

export const extensionConfig: ExtensionConfig = {
  tabs: [
    {
      id: 'call',
      label: { en: 'Call', ru: 'Звонок', es: 'Llamar', ja: '通話' },
      icon: Phone,
      component: lazy(() => import('./custom/CallTab')),
    },
    {
      id: 'history',
      label: { en: 'History', ru: 'История', es: 'Historial', ja: '履歴' },
      icon: Clock,
      component: lazy(() => import('./custom/HistoryTab')),
    },
  ],

  settingsSections: [
    lazy(() => import('./custom/VoximplantSettings')),
    lazy(() => import('./custom/ColumnMappingSettings')),
  ],

  onboardingSteps: [
    {
      icon: '📞',
      title: { en: 'Make calls', ru: 'Звоните клиентам', es: 'Haz llamadas', ja: '電話をかける' },
      desc: { en: 'Call directly from Google Sheets', ru: 'Звоните прямо из Google Таблиц', es: 'Llama directamente desde Google Sheets', ja: 'Google Sheetsから直接電話' },
    },
    {
      icon: '📊',
      title: { en: 'Auto-save results', ru: 'Автосохранение', es: 'Guardado automático', ja: '自動保存' },
      desc: { en: 'Call results are saved to the spreadsheet', ru: 'Результаты звонков сохраняются в таблицу', es: 'Los resultados se guardan en la hoja', ja: '通話結果がスプレッドシートに保存' },
    },
    {
      icon: '🎙️',
      title: { en: 'Call recording', ru: 'Запись звонков', es: 'Grabación', ja: '通話録音' },
      desc: { en: 'All calls are recorded for review', ru: 'Все звонки записываются для прослушивания', es: 'Todas las llamadas se graban', ja: 'すべての通話が録音されます' },
    },
  ],

  contentScripts: true,

  tabTracking: true,

  backgroundHandlers: () => import('./custom/backgroundHandlers'),

  permissions: ['identity', 'tabs'],
  hostPermissions: ['*://docs.google.com/*', 'https://sheets.googleapis.com/*'],
}