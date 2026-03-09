import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'
import { useTranslation } from '@mvp/i18n/src/browser'

interface ErrorBlockProps {
  message: string
  onRetry?: () => void
}

type ErrorKey = 'ext.errorNetwork' | 'ext.errorUnauthorized' | 'ext.errorForbidden' | 'ext.errorNotFound' | null

function classifyError(message: string): { icon: typeof WifiOff; key: ErrorKey } {
  const lower = message.toLowerCase()
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch'))
    return { icon: WifiOff, key: 'ext.errorNetwork' }
  if (lower.includes('401') || lower.includes('unauthorized'))
    return { icon: AlertCircle, key: 'ext.errorUnauthorized' }
  if (lower.includes('403') || lower.includes('forbidden'))
    return { icon: AlertCircle, key: 'ext.errorForbidden' }
  if (lower.includes('404'))
    return { icon: AlertCircle, key: 'ext.errorNotFound' }
  return { icon: AlertCircle, key: null }
}

export default function ErrorBlock({ message, onRetry }: ErrorBlockProps) {
  const { t } = useTranslation()
  const { icon: Icon, key } = classifyError(message)
  const text = key ? t(key) : (message || t('ext.errorGeneral'))
  return (
    <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 flex flex-col items-center gap-2 text-center">
      <Icon size={18} className="text-red-400" />
      <div className="text-[12px] text-red-300 leading-relaxed">{text}</div>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1.5 text-[11px] text-brand cursor-pointer bg-transparent border border-brand/20 rounded-lg py-1.5 px-3 font-sans hover:bg-brand/10 transition">
          <RefreshCw size={11} /> {t('common.retry')}
        </button>
      )}
    </div>
  )
}
