import { useState, useEffect, useCallback } from 'react'
import { Zap } from 'lucide-react'
import { SettingSkeleton } from './shared/Skeleton'
import { getVoximplantConfig, connectVoximplant } from './services/api'
import { useTranslation } from '@mvp/i18n/src/browser'

const VOX_NODES = ['NODE_1','NODE_2','NODE_3','NODE_4','NODE_5','NODE_6','NODE_7','NODE_8','NODE_9','NODE_10','NODE_11','NODE_12'] as const

interface VoxConfig { login: string; appId: string | null; node: string | null }

export default function VoximplantSettings() {
  const { t } = useTranslation()
  const [voxConfig, setVoxConfig] = useState<VoxConfig | null>(null)
  const [voxLoading, setVoxLoading] = useState(true)
  const [showVoxForm, setShowVoxForm] = useState(false)
  const [voxLogin, setVoxLogin] = useState('')
  const [voxPassword, setVoxPassword] = useState('')
  const [voxAppId, setVoxAppId] = useState('')
  const [voxNode, setVoxNode] = useState('')
  const [voxError, setVoxError] = useState<string | null>(null)
  const [voxSaving, setVoxSaving] = useState(false)

  const loadVoxConfig = useCallback(async () => {
    setVoxLoading(true)
    try { const config = await getVoximplantConfig(); setVoxConfig(config) }
    catch { setVoxConfig(null) }
    finally { setVoxLoading(false) }
  }, [])

  useEffect(() => { loadVoxConfig() }, [loadVoxConfig])

  const handleVoxConnect = async () => {
    if (!voxLogin || !voxPassword) return
    setVoxSaving(true); setVoxError(null)
    try {
      await connectVoximplant({ login: voxLogin, password: voxPassword, appId: voxAppId || undefined, node: voxNode || undefined })
      setShowVoxForm(false); setVoxPassword(''); await loadVoxConfig()
    } catch (err) {
      setVoxError(err instanceof Error ? err.message : t('ext.errorGeneral'))
    } finally { setVoxSaving(false) }
  }

  return (
    <div className="bg-bg-secondary rounded-xl p-3">
      <div className="text-[10px] text-text-muted mb-2.5 uppercase tracking-wider">{t('ext.telephonyProvider')}</div>
      {voxLoading ? <SettingSkeleton /> : showVoxForm ? (
        <div className="flex flex-col gap-2">
          <input type="text" placeholder={t('ext.voxLoginPlaceholder')} value={voxLogin} onChange={(e) => setVoxLogin(e.target.value)}
            className="bg-bg-primary border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-brand" />
          <input type="password" placeholder={t('auth.password')} value={voxPassword} onChange={(e) => setVoxPassword(e.target.value)}
            className="bg-bg-primary border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-brand" />
          <input type="text" placeholder={t('ext.appIdOptional')} value={voxAppId} onChange={(e) => setVoxAppId(e.target.value)}
            className="bg-bg-primary border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-brand" />
          <select value={voxNode} onChange={(e) => setVoxNode(e.target.value)}
            className="bg-bg-primary border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-brand cursor-pointer">
            <option value="">{t('ext.voxNodePlaceholder')}</option>
            {VOX_NODES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <div className="text-[10px] text-text-muted">{t('ext.voxNodeDesc')}</div>
          {voxError && <div className="text-[11px] text-red-400">{voxError}</div>}
          <div className="flex gap-2">
            <button onClick={handleVoxConnect} disabled={voxSaving || !voxLogin || !voxPassword}
              className="flex-1 bg-gradient-to-r from-brand to-brand-dark text-white rounded-lg py-2 text-xs font-medium disabled:opacity-50 cursor-pointer border-none font-sans">
              {voxSaving ? t('ext.connecting') : t('ext.connect')}
            </button>
            <button onClick={() => { setShowVoxForm(false); setVoxError(null) }}
              className="bg-transparent border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-secondary cursor-pointer font-sans">{t('common.cancel')}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-bg-primary flex items-center justify-center"><Zap size={16} className="text-brand-light" /></div>
              <div>
                <div className="text-[13px] font-medium">Voximplant</div>
                <div className={`text-[11px] ${voxConfig?.login ? 'text-success' : 'text-text-muted'}`}>{voxConfig?.login ? t('ext.voxConnected') : t('ext.voxNotConnected')}</div>
              </div>
            </div>
            <button onClick={() => {
              if (voxConfig?.login) setVoxLogin(voxConfig.login)
              if (voxConfig?.appId) setVoxAppId(voxConfig.appId)
              if (voxConfig?.node) setVoxNode(voxConfig.node)
              setShowVoxForm(true)
            }}
              className="bg-transparent border border-bg-tertiary rounded-md py-1 px-2.5 text-text-secondary text-[11px] cursor-pointer font-sans">
              {voxConfig?.login ? t('common.edit') : t('ext.connect')}
            </button>
          </div>
          {voxConfig?.login ? (
            <div className="text-[11px] text-text-muted bg-bg-primary rounded-lg py-2 px-2.5">
              {voxConfig.login}
              {voxConfig.appId && ` · App: ${voxConfig.appId}`}
              {voxConfig.node && ` · ${voxConfig.node}`}
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-1.5">
              <a href="https://voximplant.com/" target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-brand no-underline hover:text-brand-light transition">{t('ext.registerVoximplant')}</a>
              <div className="text-[10px] text-text-muted leading-relaxed">
                {t('ext.voxLoginDesc')}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
