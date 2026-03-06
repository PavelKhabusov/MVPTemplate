import { useState, useEffect, useCallback } from 'react'
import { Zap } from 'lucide-react'
import { SettingSkeleton } from './shared/Skeleton'
import { getVoximplantConfig, connectVoximplant } from './services/api'

interface VoxConfig { login: string; appId: string | null }

export default function VoximplantSettings() {
  const [voxConfig, setVoxConfig] = useState<VoxConfig | null>(null)
  const [voxLoading, setVoxLoading] = useState(true)
  const [showVoxForm, setShowVoxForm] = useState(false)
  const [voxLogin, setVoxLogin] = useState('')
  const [voxPassword, setVoxPassword] = useState('')
  const [voxAppId, setVoxAppId] = useState('')
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
      await connectVoximplant({ login: voxLogin, password: voxPassword, appId: voxAppId || undefined })
      setShowVoxForm(false); setVoxPassword(''); await loadVoxConfig()
    } catch (err) {
      setVoxError(err instanceof Error ? err.message : 'Ошибка подключения')
    } finally { setVoxSaving(false) }
  }

  return (
    <div className="bg-bg-secondary rounded-xl p-3">
      <div className="text-[10px] text-text-muted mb-2.5 uppercase tracking-wider">Провайдер телефонии</div>
      {voxLoading ? <SettingSkeleton /> : showVoxForm ? (
        <div className="flex flex-col gap-2">
          <input type="text" placeholder="Login (user@app.account.voximplant.com)" value={voxLogin} onChange={(e) => setVoxLogin(e.target.value)}
            className="bg-bg-primary border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-brand" />
          <input type="password" placeholder="Пароль" value={voxPassword} onChange={(e) => setVoxPassword(e.target.value)}
            className="bg-bg-primary border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-brand" />
          <input type="text" placeholder="App ID (необязательно)" value={voxAppId} onChange={(e) => setVoxAppId(e.target.value)}
            className="bg-bg-primary border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-brand" />
          {voxError && <div className="text-[11px] text-red-400">{voxError}</div>}
          <div className="flex gap-2">
            <button onClick={handleVoxConnect} disabled={voxSaving || !voxLogin || !voxPassword}
              className="flex-1 bg-gradient-to-r from-brand to-brand-dark text-white rounded-lg py-2 text-xs font-medium disabled:opacity-50 cursor-pointer border-none font-sans">
              {voxSaving ? 'Подключение...' : 'Подключить'}
            </button>
            <button onClick={() => { setShowVoxForm(false); setVoxError(null) }}
              className="bg-transparent border border-bg-tertiary rounded-lg py-2 px-3 text-xs text-text-secondary cursor-pointer font-sans">Отмена</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-bg-primary flex items-center justify-center"><Zap size={16} className="text-brand-light" /></div>
              <div>
                <div className="text-[13px] font-medium">Voximplant</div>
                <div className={`text-[11px] ${voxConfig?.login ? 'text-success' : 'text-text-muted'}`}>{voxConfig?.login ? '● Подключён' : '○ Не подключён'}</div>
              </div>
            </div>
            <button onClick={() => { if (voxConfig?.login) setVoxLogin(voxConfig.login); if (voxConfig?.appId) setVoxAppId(voxConfig.appId); setShowVoxForm(true) }}
              className="bg-transparent border border-bg-tertiary rounded-md py-1 px-2.5 text-text-secondary text-[11px] cursor-pointer font-sans">
              {voxConfig?.login ? 'Изменить' : 'Подключить'}
            </button>
          </div>
          {voxConfig?.login ? (
            <div className="text-[11px] text-text-muted bg-bg-primary rounded-lg py-2 px-2.5">
              {voxConfig.login}{voxConfig.appId && ` · App: ${voxConfig.appId}`}
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-1.5">
              <a href="https://voximplant.com/" target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-brand no-underline hover:text-brand-light transition">Зарегистрироваться на voximplant.com →</a>
              <div className="text-[10px] text-text-muted leading-relaxed">
                После регистрации создайте приложение и пользователя в панели Voximplant. Логин имеет формат: user@app.account.voximplant.com
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}