import { useState, useEffect } from 'react'
import { Sparkles, Zap, Rocket, ArrowRight, Check } from 'lucide-react'
import { extensionConfig } from '../config'

type Lang = 'en' | 'ru' | 'es' | 'ja'

interface OnboardingScreenProps {
  onComplete: () => void
}

interface Step {
  icon: typeof Sparkles | string
  title: string
  description: string
}

const DEFAULT_STEPS: Array<{ icon: typeof Sparkles; titleKey: Partial<Record<Lang, string>>; descKey: Partial<Record<Lang, string>> }> = [
  {
    icon: Sparkles,
    titleKey: { en: 'Welcome', ru: 'Добро пожаловать', es: 'Bienvenido', ja: 'ようこそ' },
    descKey: { en: 'Your app is now available right in the browser. Access all features without switching tabs.', ru: 'Приложение теперь доступно прямо в браузере. Все функции — без переключения вкладок.', es: 'Tu app está disponible en el navegador. Accede a todas las funciones sin cambiar de pestaña.', ja: 'アプリがブラウザで利用可能になりました。タブを切り替えずにすべての機能にアクセスできます。' },
  },
  {
    icon: Zap,
    titleKey: { en: 'Key Features', ru: 'Возможности', es: 'Funciones', ja: '主な機能' },
    descKey: { en: 'Manage your account, track your subscription, and customize the experience — all from the sidebar.', ru: 'Управляйте аккаунтом, отслеживайте подписку и настраивайте всё — прямо из боковой панели.', es: 'Gestiona tu cuenta, sigue tu suscripción y personaliza la experiencia — todo desde la barra lateral.', ja: 'アカウント管理、サブスクリプション追跡、カスタマイズ — すべてサイドバーから。' },
  },
  {
    icon: Rocket,
    titleKey: { en: 'Get Started', ru: 'Начнём!', es: '¡Empezar!', ja: '始めましょう！' },
    descKey: { en: "You're all set! Start exploring the extension and make the most of your workflow.", ru: 'Всё готово! Начните использовать расширение и улучшите свой рабочий процесс.', es: '¡Todo listo! Empieza a explorar la extensión y mejora tu flujo de trabajo.', ja: '準備完了！拡張機能を使って作業効率を上げましょう。' },
  },
]

const ICON_MAP: Record<string, typeof Sparkles> = { Sparkles, Zap, Rocket }

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    chrome.storage?.local?.get('lang').then((r) => {
      if (['en', 'ru', 'es', 'ja'].includes(r?.lang)) setLang(r.lang)
    }).catch(() => {})
  }, [])

  // Merge default + custom steps
  const steps: Step[] = [
    ...DEFAULT_STEPS.map((s) => ({
      icon: s.icon,
      title: s.titleKey[lang] || s.titleKey.en || '',
      description: s.descKey[lang] || s.descKey.en || '',
    })),
    ...extensionConfig.onboardingSteps.map((s) => ({
      icon: s.icon,
      title: s.title[lang] || s.title.en || '',
      description: s.desc[lang] || s.desc.en || '',
    })),
  ]

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1
  const isEmoji = typeof step.icon === 'string'
  const LucideIcon = !isEmoji ? step.icon as typeof Sparkles : null

  const labels = {
    next: { en: 'Next', ru: 'Далее', es: 'Siguiente', ja: '次へ' },
    start: { en: 'Get Started', ru: 'Начать', es: 'Empezar', ja: '始める' },
    skip: { en: 'Skip', ru: 'Пропустить', es: 'Omitir', ja: 'スキップ' },
    step: { en: 'Step', ru: 'Шаг', es: 'Paso', ja: 'ステップ' },
    of: { en: 'of', ru: 'из', es: 'de', ja: '/' },
  }

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
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= currentStep ? 'bg-brand' : 'bg-bg-tertiary'
              }`}
            />
          ))}
        </div>
        <div className="text-[10px] text-text-muted mt-2">
          {labels.step[lang]} {currentStep + 1} {labels.of[lang]} {steps.length}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/20 to-brand-dark/20 border border-brand/20 flex items-center justify-center">
          {isEmoji ? (
            <span className="text-3xl">{step.icon as string}</span>
          ) : (
            LucideIcon && <LucideIcon size={28} className="text-brand-light" />
          )}
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
              {labels.start[lang]}
            </>
          ) : (
            <>
              {labels.next[lang]}
              <ArrowRight size={14} />
            </>
          )}
        </button>

        {!isLast && (
          <button
            onClick={onComplete}
            className="bg-transparent border-none text-[11px] text-text-muted cursor-pointer font-sans"
          >
            {labels.skip[lang]}
          </button>
        )}
      </div>
    </div>
  )
}
