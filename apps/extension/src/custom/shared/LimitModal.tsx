import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from '@mvp/i18n/src/browser'

interface LimitModalProps {
  onClose: () => void
}

export default function LimitModal({ onClose }: LimitModalProps) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-5 max-w-[280px] w-full relative">
        <button onClick={onClose} className="absolute top-3 right-3 bg-transparent border-none text-text-muted cursor-pointer">
          <X size={16} />
        </button>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-11 h-11 rounded-full bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-400" />
          </div>
          <div>
            <div className="text-[14px] font-semibold mb-1">{t('ext.limitTitle')}</div>
            <div className="text-[12px] text-text-secondary leading-relaxed">
              {t('ext.limitDesc')}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full mt-1">
            <button onClick={onClose} className="w-full bg-gradient-to-r from-brand to-brand-dark text-white rounded-xl py-2.5 text-[13px] font-medium cursor-pointer font-sans border-none">
              {t('ext.upgradePro')}
            </button>
            <button onClick={onClose} className="bg-transparent border-none text-[11px] text-text-muted cursor-pointer font-sans">
              {t('ext.notNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
