import { AlertTriangle, X } from 'lucide-react'

interface LimitModalProps {
  onClose: () => void
}

export default function LimitModal({ onClose }: LimitModalProps) {
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
            <div className="text-[14px] font-semibold mb-1">Лимит звонков достигнут</div>
            <div className="text-[12px] text-text-secondary leading-relaxed">
              Вы использовали все 30 звонков бесплатного тарифа в этом месяце. Перейдите на PRO для безлимитных звонков.
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full mt-1">
            <button onClick={onClose} className="w-full bg-gradient-to-r from-brand to-brand-dark text-white rounded-xl py-2.5 text-[13px] font-medium cursor-pointer font-sans border-none">
              Перейти на PRO — 990 ₽/мес
            </button>
            <button onClick={onClose} className="bg-transparent border-none text-[11px] text-text-muted cursor-pointer font-sans">
              Не сейчас
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}