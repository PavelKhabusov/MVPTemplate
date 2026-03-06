import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'

interface ErrorBlockProps {
  message: string
  onRetry?: () => void
}

function classifyError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch'))
    return { icon: WifiOff, text: 'Нет подключения к серверу. Проверьте интернет.' }
  if (lower.includes('401') || lower.includes('unauthorized'))
    return { icon: AlertCircle, text: 'Сессия истекла. Войдите заново.' }
  if (lower.includes('403') || lower.includes('forbidden'))
    return { icon: AlertCircle, text: 'Нет доступа.' }
  if (lower.includes('404'))
    return { icon: AlertCircle, text: 'Данные не найдены.' }
  return { icon: AlertCircle, text: message || 'Произошла ошибка' }
}

export default function ErrorBlock({ message, onRetry }: ErrorBlockProps) {
  const { icon: Icon, text } = classifyError(message)
  return (
    <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 flex flex-col items-center gap-2 text-center">
      <Icon size={18} className="text-red-400" />
      <div className="text-[12px] text-red-300 leading-relaxed">{text}</div>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1.5 text-[11px] text-brand cursor-pointer bg-transparent border border-brand/20 rounded-lg py-1.5 px-3 font-sans hover:bg-brand/10 transition">
          <RefreshCw size={11} /> Повторить
        </button>
      )}
    </div>
  )
}