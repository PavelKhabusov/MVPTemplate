import type { ComponentType, LazyExoticComponent } from 'react'

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
  /** Custom tabs inserted before Settings */
  tabs: CustomTab[]

  /** Extra sections rendered inside SettingsTab */
  settingsSections: Array<LazyExoticComponent<ComponentType<any>> | ComponentType<any>>

  /** Extra onboarding steps appended to the default ones */
  onboardingSteps: OnboardingStep[]

  /** Enable content scripts from src/content/ */
  contentScripts: boolean

  /** Register chrome.tabs listeners synchronously in background.ts to send TAB_CONTEXT_CHANGED (required for MV3 service workers) */
  tabTracking: boolean

  /** Dynamic import of custom background message handlers */
  backgroundHandlers: (() => Promise<{ default: Record<string, (message: any, sender: any, sendResponse: (r: any) => void) => boolean | void> }>) | null

  /** Additional manifest permissions */
  permissions: string[]

  /** Additional manifest host_permissions */
  hostPermissions: string[]
}

/**
 * Extension configuration.
 * Customize this file for your product.
 * Default: empty config (template shell only).
 */
export const extensionConfig: ExtensionConfig = {
  tabs: [],
  settingsSections: [],
  onboardingSteps: [],
  contentScripts: false,
  tabTracking: false,
  backgroundHandlers: null,
  permissions: [],
  hostPermissions: [],
}
