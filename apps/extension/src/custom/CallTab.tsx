import { useState, useEffect, useCallback } from 'react'
import { Headphones, Smartphone, Phone, PhoneOff, Save, Zap } from 'lucide-react'
import { ContactSkeleton } from './shared/Skeleton'
import ErrorBlock from './shared/ErrorBlock'
import type { Contact, CallState, CallMode, SelectedContact } from './types'
import { statusColors } from './data/mock'
import { useContacts } from './hooks/useContacts'
import { useSheetColumns } from './hooks/useSheetColumns'
import { useCall } from './hooks/useCall'
import { writeCallResult } from './services/sheets'
import { initiateCall } from './services/api'
import CallTimer from './shared/CallTimer'
import WaveAnimation from './shared/WaveAnimation'
import LimitModal from './shared/LimitModal'
import { useTranslation } from '@mvp/i18n/src/browser'

interface CallTabProps {
  lang?: string
}

export default function CallTab({ lang: _lang }: CallTabProps) {
  const { t } = useTranslation()
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null)
  const [sheetName, setSheetName] = useState<string | null>(null)
  const [selectedFromSheet, setSelectedFromSheet] = useState<SelectedContact | null>(null)
  const [voxConnected, setVoxConnected] = useState(false)
  const [callMode, setCallMode] = useState<CallMode>('browser')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [note, setNote] = useState('')
  const [showNoteBox, setShowNoteBox] = useState(false)
  const [managerPhone, setManagerPhone] = useState('')
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  // Get current sheet context
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_SHEET' }, (res) => {
      if (chrome.runtime.lastError) return
      if (res?.spreadsheetId) setSpreadsheetId(res.spreadsheetId)
    })
    const listener = (message: any) => {
      if (message.type === 'TAB_CONTEXT_CHANGED') {
        setSpreadsheetId(message.payload?.spreadsheetId || null)
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  // Check for selected contact from content script
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SELECTED_CONTACT' }, (contact) => {
      if (chrome.runtime.lastError) return
      if (contact) setSelectedFromSheet(contact)
    })
  }, [])

  const { columns, loading: columnsLoading } = useSheetColumns({
    spreadsheetId,
    sheetName: sheetName || undefined,
  })

  const { callState: voxCallState, duration, error: callError, sdkReady, makeCall: voxMakeCall, hangup: voxHangup, reset: voxReset } = useCall({
    onCallEnded: () => setShowNoteBox(true),
  })

  const [simCallState, setSimCallState] = useState<CallState>('idle')
  const callState: CallState = sdkReady ? (voxCallState as CallState) : simCallState

  const handleStartCall = useCallback(async () => {
    if (!selectedContact) return
    if (callMode === 'phone' && !managerPhone.trim()) return
    if (limitReached) { setShowLimitModal(true); return }

    try {
      if (spreadsheetId) {
        await initiateCall({
          to: selectedContact.phone,
          mode: callMode,
          contactName: selectedContact.name,
          sheetId: spreadsheetId,
          rowIndex: selectedContact.id,
          ...(callMode === 'phone' && managerPhone ? { managerPhone: managerPhone.trim() } : {}),
        })
      }
    } catch {
      // Backend may not be running
    }

    if (callMode === 'phone') {
      setSimCallState('calling')
      setTimeout(() => setSimCallState('active'), 3000)
    } else if (sdkReady) {
      await voxMakeCall(selectedContact.phone)
    } else {
      setSimCallState('calling')
      setTimeout(() => setSimCallState('active'), 2000)
    }
  }, [sdkReady, selectedContact, callMode, spreadsheetId, managerPhone, voxMakeCall, limitReached])

  const handleHangup = useCallback(() => {
    if (sdkReady) voxHangup()
    else { setSimCallState('ended'); setShowNoteBox(true) }
  }, [sdkReady, voxHangup])

  const handleSaveNote = useCallback(async () => {
    if (spreadsheetId && selectedContact) {
      try {
        await writeCallResult(spreadsheetId, selectedContact.id, columns, {
          date: new Date().toLocaleString(),
          status: t('ext.statusAnswered'),
          note: note || undefined,
        }, sheetName || undefined)
      } catch { /* Sheets API may not be configured */ }
    }
    setNote('')
    setShowNoteBox(false)
    if (sdkReady) voxReset()
    else setSimCallState('idle')
  }, [spreadsheetId, selectedContact, note, sdkReady, voxReset, columns, sheetName, t])

  const nameCol = columns.name || 'A'
  const phoneCol = columns.phone || 'B'

  const { contacts: sheetContacts, loading: contactsLoading, error: contactsError, reload: reloadContacts } = useContacts({
    spreadsheetId: columnsLoading ? null : spreadsheetId,
    nameColumn: nameCol,
    phoneColumn: phoneCol,
    sheetName: sheetName || undefined,
  })

  const loading = columnsLoading || contactsLoading

  const displayContacts: Contact[] = sheetContacts.map((c) => ({
    id: c.id, name: c.name, phone: c.phone, company: '', lastCall: '', status: 'answered' as const,
  }))

  useEffect(() => {
    if (displayContacts.length > 0 && !selectedFromSheet) setSelectedContact(displayContacts[0])
  }, [sheetContacts.length]) // eslint-disable-line

  useEffect(() => {
    if (!selectedFromSheet) return
    const normalized = selectedFromSheet.phone.replace(/[\s\-\(\)]/g, '')
    const existing = displayContacts.find((c) => c.phone.replace(/[\s\-\(\)]/g, '') === normalized)
    if (existing) setSelectedContact(existing)
    else setSelectedContact({ id: Date.now(), name: selectedFromSheet.contactName || t('ext.unknownContact'), phone: selectedFromSheet.phone, company: '', lastCall: '', status: 'answered' })
    setSelectedFromSheet(null)
  }, [selectedFromSheet]) // eslint-disable-line

  return (
    <div className="flex-1 overflow-y-auto p-3.5 px-4 flex flex-col gap-3">
      {showLimitModal && <LimitModal onClose={() => setShowLimitModal(false)} />}

      {!spreadsheetId && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
          <div className="text-[12px] text-amber-200">{t('ext.openSheetsFirst')}</div>
        </div>
      )}

      {voxConnected === false && spreadsheetId && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
          <Zap size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-[12px] font-medium text-amber-200">{t('ext.connectProvider')}</div>
            <div className="text-[11px] text-text-secondary mt-0.5">{t('ext.configureVoximplant')}</div>
          </div>
        </div>
      )}

      {/* Contact selector */}
      <div className="bg-bg-secondary rounded-xl p-3">
        <div className="text-[10px] text-text-muted mb-2 uppercase tracking-wider">{t('ext.contactFromSheet')}</div>
        {loading ? (
          <div className="flex flex-col gap-1.5"><ContactSkeleton /><ContactSkeleton /><ContactSkeleton /></div>
        ) : contactsError ? (
          <ErrorBlock message={contactsError} onRetry={reloadContacts} />
        ) : displayContacts.length === 0 ? (
          <div className="text-[11px] text-text-muted py-3 text-center">{t('ext.noContacts')}</div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {displayContacts.map((c) => {
              const colors = statusColors[c.status]
              return (
                <div key={c.id} onClick={() => setSelectedContact(c)}
                  className={`flex items-center gap-2.5 py-2 px-2.5 rounded-lg cursor-pointer transition-all duration-100 ${
                    selectedContact?.id === c.id ? 'bg-bg-tertiary border border-bg-hover' : 'bg-transparent border border-transparent'
                  }`}>
                  <div className="w-7.5 h-7.5 rounded-full bg-linear-to-br from-brand to-brand-dark flex items-center justify-center text-xs font-semibold shrink-0">{c.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{c.name}</div>
                    <div className="text-[11px] text-text-secondary font-mono">{c.phone}</div>
                  </div>
                  <div className="w-1.75 h-1.75 rounded-full shrink-0" style={{ background: colors.dot, boxShadow: `0 0 5px ${colors.dot}` }} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Call mode */}
      <div className="bg-bg-secondary rounded-xl p-3">
        <div className="text-[10px] text-text-muted mb-2 uppercase tracking-wider">{t('ext.callMode')}</div>
        <div className="flex gap-1.5">
          {(['browser', 'phone'] as const).map((id) => (
            <button key={id} onClick={() => setCallMode(id)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-medium cursor-pointer font-sans transition-all flex items-center justify-center gap-1 ${
                callMode === id ? 'border border-brand bg-brand/12 text-brand-light' : 'border border-border bg-transparent text-text-secondary'
              }`}>
              {id === 'browser' ? <Headphones size={13} /> : <Smartphone size={13} />}
              {id === 'browser' ? t('ext.modeBrowser') : t('ext.modePhone')}
            </button>
          ))}
        </div>
        {callMode === 'phone' && (
          <div className="mt-2">
            <input type="tel" placeholder={t('ext.managerPhonePlaceholder')} value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)}
              className="w-full bg-bg-primary border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-brand font-mono" />
            <div className="text-[10px] text-text-muted mt-1">{t('ext.callbackHint')}</div>
          </div>
        )}
      </div>

      {/* Call widget */}
      {selectedContact && (
        <div className="bg-bg-secondary rounded-xl p-3.5 flex flex-col items-center gap-2.5">
          {callState === 'idle' && (
            <>
              <div className="text-[13px] font-medium">{selectedContact.name}</div>
              <div className="text-[12px] text-text-secondary font-mono">{selectedContact.phone}</div>
              <button onClick={handleStartCall}
                className="w-14 h-14 rounded-full bg-linear-to-br from-success to-success-dark border-none cursor-pointer shadow-[0_4px_20px_rgba(34,197,94,0.4)] flex items-center justify-center hover:scale-110 transition-transform">
                <Phone size={22} className="text-white" />
              </button>
              <div className="text-[11px] text-text-muted">{t('ext.tapToCall')}</div>
            </>
          )}
          {callState === 'calling' && (
            <>
              <div className="text-[13px] font-medium">{selectedContact.name}</div>
              <div className="text-[11px] text-text-secondary">{t('ext.calling')}</div>
              <div className="flex gap-1">{[0, 1, 2].map((i) => <div key={i} className="w-2 h-2 rounded-full bg-brand" style={{ animation: `pulse-dot 1s ${i * 0.3}s infinite` }} />)}</div>
              <button onClick={() => { if (sdkReady) voxHangup(); else setSimCallState('idle') }}
                className="bg-danger text-white border-none rounded-lg py-1.75 px-4.5 text-xs cursor-pointer font-sans">{t('common.cancel')}</button>
            </>
          )}
          {callError && <div className="text-xs text-danger px-2 py-1 bg-danger/10 rounded-md">{callError}</div>}
          {callState === 'active' && (
            <>
              <div className="text-[13px] font-medium">{selectedContact.name}</div>
              {sdkReady ? (
                <span className="font-mono text-xl text-success font-medium">
                  {String(Math.floor(duration / 60)).padStart(2, '0')}:{String(duration % 60).padStart(2, '0')}
                </span>
              ) : <CallTimer active={true} />}
              <WaveAnimation active={true} />
              <button onClick={handleHangup}
                className="w-12 h-12 rounded-full bg-danger border-none cursor-pointer shadow-[0_4px_16px_rgba(239,68,68,0.4)] flex items-center justify-center">
                <PhoneOff size={20} className="text-white" />
              </button>
            </>
          )}
          {callState === 'ended' && (
            <>
              <div className="text-xs text-success">✓ {t('ext.callEnded')}</div>
              {showNoteBox && (
                <div className="w-full flex flex-col gap-2">
                  <textarea placeholder={t('ext.callNotePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)}
                    className="w-full box-border bg-bg-primary border border-border rounded-lg p-2.5 text-text-primary text-xs font-sans resize-none h-16 outline-none focus:border-brand transition-colors" />
                  <button onClick={handleSaveNote}
                    className="bg-linear-to-br from-brand to-brand-dark text-white border-none rounded-lg py-2.25 text-xs cursor-pointer font-sans font-medium flex items-center justify-center gap-1.5">
                    <Save size={13} /> {t('ext.saveToSheet')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
