import { useState, useRef, useEffect } from 'react'
import { Play, Pause, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { useHistory, type HistoryCall } from './hooks/useHistory'
import { mockCallHistory, statusColors } from './data/mock'
import { CallCardSkeleton } from './shared/Skeleton'
import ErrorBlock from './shared/ErrorBlock'

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function statusLabel(status: string): string {
  switch (status) {
    case 'ANSWERED': case 'answered': return 'Дозвонился'
    case 'NO_ANSWER': case 'missed': return 'Не взял'
    case 'BUSY': case 'busy': return 'Занято'
    case 'FAILED': case 'failed': return 'Ошибка'
    default: return status
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'ANSWERED': case 'answered': return statusColors.answered
    case 'NO_ANSWER': case 'BUSY': case 'FAILED': case 'missed': case 'busy': case 'failed': return statusColors.missed
    default: return { bg: '#f3f4f6', text: '#6b7280' }
  }
}

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) audio.pause(); else audio.play()
    setPlaying(!playing)
  }
  return (
    <button onClick={toggle} className="flex items-center gap-1 bg-brand/12 border border-brand/20 rounded-md py-1 px-2.5 text-brand-light text-[11px] cursor-pointer font-sans">
      <audio ref={audioRef} src={url} preload="none" onTimeUpdate={() => { const a = audioRef.current; if (a && a.duration) setProgress(a.currentTime / a.duration) }} onEnded={() => { setPlaying(false); setProgress(0) }} />
      {playing ? <Pause size={11} /> : <Play size={11} />}
      <div className="w-12 h-1 bg-brand/20 rounded-full overflow-hidden">
        <div className="h-full bg-brand-light rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </button>
  )
}

function CallCard({ call }: { call: HistoryCall }) {
  const colors = statusColor(call.status)
  const isAnswered = call.status === 'ANSWERED' || call.status === 'answered'
  return (
    <div className="bg-bg-secondary rounded-xl p-3">
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <div className="text-[13px] font-medium">{call.contactName || 'Без имени'}</div>
          <div className="text-[11px] text-text-secondary font-mono">{call.contactPhone}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] py-[2px] px-2 rounded-full font-medium" style={{ background: colors.bg, color: colors.text }}>{statusLabel(call.status)}</div>
          <div className="text-[10px] text-text-muted mt-[3px]">{formatDate(call.startedAt)}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAnswered && call.recordingUrl ? <AudioPlayer url={call.recordingUrl} /> : isAnswered ? <span className="text-[11px] text-text-muted">{formatDuration(call.duration)}</span> : null}
        </div>
      </div>
      {call.note && (
        <div className="mt-2 text-[11px] text-text-secondary bg-bg-primary rounded-md py-1.5 px-2 leading-relaxed flex items-start gap-1.5">
          <MessageSquare size={11} className="shrink-0 mt-0.5" />{call.note}
        </div>
      )}
    </div>
  )
}

const mockHistoryCalls: HistoryCall[] = mockCallHistory.map((m) => ({
  id: String(m.id), contactName: m.name, contactPhone: m.phone, status: m.status,
  duration: m.duration !== '—' ? parseInt(m.duration.split(':')[0]) * 60 + parseInt(m.duration.split(':')[1]) : null,
  recordingUrl: null, note: m.note || null, startedAt: new Date().toISOString(),
}))

interface HistoryTabProps { lang?: string }

export default function HistoryTab({ lang: _lang }: HistoryTabProps) {
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_SHEET' }, (res) => {
      if (chrome.runtime.lastError) return
      if (res?.spreadsheetId) setSpreadsheetId(res.spreadsheetId)
    })
  }, [])

  const { calls, loading, error, page, totalPages, total, nextPage, prevPage, refresh } = useHistory(spreadsheetId)
  const useMock = error != null || (calls.length === 0 && !loading)
  const displayCalls = useMock ? mockHistoryCalls : calls

  return (
    <div className="flex-1 overflow-y-auto p-3.5 px-4 flex flex-col gap-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-text-secondary">{useMock ? 'Демо данные' : `Все звонки · ${total}`}</span>
        <button onClick={refresh} className="text-[11px] text-brand cursor-pointer hover:text-brand-light transition bg-transparent border-none font-sans">Обновить</button>
      </div>
      {loading && <div className="flex flex-col gap-2"><CallCardSkeleton /><CallCardSkeleton /><CallCardSkeleton /></div>}
      {!loading && error && <ErrorBlock message={error} onRetry={refresh} />}
      {!loading && displayCalls.length === 0 && !error && <div className="text-center py-8 text-text-muted text-xs">Нет звонков</div>}
      {!loading && displayCalls.map((call) => <CallCard key={call.id} call={call} />)}
      {!useMock && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-3">
          <button onClick={prevPage} disabled={page <= 1} className="text-xs text-brand disabled:text-text-muted disabled:cursor-default cursor-pointer flex items-center gap-0.5 bg-transparent border-none font-sans"><ChevronLeft size={13} />Назад</button>
          <span className="text-xs text-text-secondary">{page} / {totalPages}</span>
          <button onClick={nextPage} disabled={page >= totalPages} className="text-xs text-brand disabled:text-text-muted disabled:cursor-default cursor-pointer flex items-center gap-0.5 bg-transparent border-none font-sans">Далее<ChevronRight size={13} /></button>
        </div>
      )}
    </div>
  )
}