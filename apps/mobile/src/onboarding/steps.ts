import type { WizardStep, CoachMarkStep } from '@mvp/onboarding'

/**
 * Factory for wizard steps — pass the `t` translation function and app name.
 * Called inside a component that has access to useTranslation().
 */
export function createWizardSteps(
  t: (key: string, opts?: Record<string, string>) => string,
  appName: string,
): WizardStep[] {
  return [
    {
      id: 'welcome',
      icon: 'rocket-outline',
      title: t('onboarding.step1Title', { appName }),
      description: t('onboarding.step1Desc'),
    },
    {
      id: 'explore',
      icon: 'compass-outline',
      title: t('onboarding.step2Title'),
      description: t('onboarding.step2Desc'),
    },
    {
      id: 'connect',
      icon: 'notifications-outline',
      title: t('onboarding.step3Title'),
      description: t('onboarding.step3Desc'),
    },
    {
      id: 'ready',
      icon: 'checkmark-circle-outline',
      title: t('onboarding.step4Title'),
      description: t('onboarding.step4Desc'),
    },
  ]
}

/**
 * Steps for the in-app spotlight tour on the home screen.
 * stepId values must match the `stepId` prop on <CoachMark> wrappers.
 */
export function createHomeCoachSteps(t: (key: string) => string): CoachMarkStep[] {
  return [
    {
      id: 'home-stats',
      title: t('onboarding.tourStats'),
      description: t('onboarding.tourStatsDesc'),
    },
    {
      id: 'home-actions',
      title: t('onboarding.tourActions'),
      description: t('onboarding.tourActionsDesc'),
    },
    {
      id: 'home-notes',
      title: t('onboarding.tourNotes'),
      description: t('onboarding.tourNotesDesc'),
    },
  ]
}
