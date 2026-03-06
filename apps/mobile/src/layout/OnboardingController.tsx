import { OnboardingWizard, useCoachMark } from '@mvp/onboarding'
import { useAppStore, useCompanyStore } from '@mvp/store'
import { APP_BRAND } from '@mvp/template-config/src/brand'
import { useTranslation } from '@mvp/i18n'
import { useTemplateFlag } from '@mvp/template-config'
import { createWizardSteps, createHomeCoachSteps } from '../onboarding/steps'

export function OnboardingController() {
  const { t } = useTranslation()
  const appName = useCompanyStore((s) => s.info.appName) || APP_BRAND.name
  const hasCompleted = useAppStore((s) => s.hasCompletedOnboarding)
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete)
  const { startTour } = useCoachMark()
  const onboardingEnabled = useTemplateFlag('onboarding', true)

  if (hasCompleted || !onboardingEnabled) return null

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
