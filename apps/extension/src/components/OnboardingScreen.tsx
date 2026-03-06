import { useState } from 'react'
import { Sparkles, Zap, Rocket, ArrowRight, Check } from 'lucide-react'

interface OnboardingScreenProps {
  onComplete: () => void
}

const STEPS = [
  {
    icon: Sparkles,
    title: 'Welcome',
    description: 'Your app is now available right in the browser. Access all features without switching tabs.',
  },
  {
    icon: Zap,
    title: 'Key Features',
    description: 'Manage your account, track your subscription, and customize the experience — all from the sidebar.',
  },
  {
    icon: Rocket,
    title: 'Get Started',
    description: "You're all set! Start exploring the extension and make the most of your workflow.",
  },
] as const

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1
  const Icon = step.icon

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  return (
    <div className="w-full h-screen bg-bg-primary text-text-primary flex flex-col overflow-hidden">
      {/* Progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= currentStep ? 'bg-brand' : 'bg-bg-tertiary'
              }`}
            />
          ))}
        </div>
        <div className="text-[10px] text-text-muted mt-2">
          Step {currentStep + 1} of {STEPS.length}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/20 to-brand-dark/20 border border-brand/20 flex items-center justify-center">
          <Icon size={28} className="text-brand-light" />
        </div>

        <div className="text-center">
          <div className="text-[17px] font-semibold mb-2">{step.title}</div>
          <div className="text-[13px] text-text-secondary leading-relaxed">{step.description}</div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-6 pb-6 flex flex-col gap-2">
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-brand to-brand-dark text-white rounded-xl py-3 text-[13px] font-medium cursor-pointer font-sans border-none"
        >
          {isLast ? (
            <>
              <Check size={15} />
              Get Started
            </>
          ) : (
            <>
              Next
              <ArrowRight size={14} />
            </>
          )}
        </button>

        {!isLast && (
          <button
            onClick={onComplete}
            className="bg-transparent border-none text-[11px] text-text-muted cursor-pointer font-sans"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  )
}
