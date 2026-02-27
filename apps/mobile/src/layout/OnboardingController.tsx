import { OnboardingWizard, useCoachMark } from '@mvp/ui'
import { useAppStore, useCompanyStore } from '@mvp/store'
import { useTranslation } from '@mvp/i18n'
import { createWizardSteps, createHomeCoachSteps } from '../onboarding/steps'

export function OnboardingController() {
  const { t } = useTranslation()
  const appName = useCompanyStore((s) => s.info.appName) || 'MVPTemplate'
  const hasCompleted = useAppStore((s) => s.hasCompletedOnboarding)
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete)
  const { startTour } = useCoachMark()

  if (hasCompleted) return null

  return (
    <OnboardingWizard
      visible
      steps={createWizardSteps(t, appName)}
      labels={{
        skip: t('onboarding.skip'),
        next: t('onboarding.next'),
        complete: t('onboarding.getStarted'),
      }}
      onComplete={() => {
        setOnboardingComplete()
        setTimeout(() => startTour(createHomeCoachSteps(t), {
          skip: t('onboarding.skip'),
          next: t('onboarding.next'),
          done: t('common.done'),
        }), 600)
      }}
      onSkip={setOnboardingComplete}
    />
  )
}
