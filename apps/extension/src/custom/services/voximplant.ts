// Dynamic import to avoid "window is not defined" during Vite build
let VI: typeof import('voximplant-websdk') | null = null

// Normalize phone number to E.164 format (e.g. "79142163340" → "+79142163340")
function normalizePhone(raw: string): string {
  // Strip whitespace, dashes, parentheses, dots
  const digits = raw.replace(/[\s\-().]/g, '')
  if (!digits) return ''
  // Already has +
  if (digits.startsWith('+')) return digits
  // Russian 8-xxx → +7-xxx
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  // Prepend + for everything else (7xxxxxxxxxx, country codes, etc.)
  return '+' + digits
}

async function loadSDK() {
  if (!VI) VI = await import('voximplant-websdk')
  return VI
}

export type VoxCallState = 'idle' | 'calling' | 'active' | 'ended' | 'failed'

export interface VoxCallHandlers {
  onStateChange: (state: VoxCallState) => void
  onDurationTick: (seconds: number) => void
  onError: (message: string) => void
  onConnectionDrop?: () => void
}

class VoximplantService {
  private sdk: any = null
  private currentCall: any = null
  private durationTimer: ReturnType<typeof setInterval> | null = null
  private callStartTime: number = 0
  private handlers: VoxCallHandlers | null = null
  private initialized = false
  private loggedIn = false
  private serverConnected = false

  async init(node?: string | null): Promise<void> {
    if (this.initialized) return
    const sdk = await loadSDK()
    this.sdk = sdk.getInstance()
    const config: Record<string, unknown> = { micRequired: false, showDebugInfo: false }
    if (node && (sdk as any).ConnectionNode?.[node]) {
      config.node = (sdk as any).ConnectionNode[node]
    }
    await new Promise<void>((resolve, reject) => {
      this.sdk!.on(sdk.Events.SDKReady, () => resolve())
      this.sdk!.on(sdk.Events.ConnectionFailed, () => reject(new Error('Connection failed')))
      this.sdk!.init(config)
    })
    // Handle connection drops after init (e.g. tab backgrounded, network change)
    this.sdk!.on(sdk.Events.ConnectionClosed, () => {
      this.serverConnected = false
      this.loggedIn = false
      this.handlers?.onConnectionDrop?.()
    })
    this.initialized = true
  }

  async connect(): Promise<void> {
    if (!this.sdk) throw new Error('SDK not initialized')
    if (this.serverConnected) return // Already connected
    const sdk = await loadSDK()
    await new Promise<void>((resolve, reject) => {
      this.sdk!.on(sdk.Events.ConnectionEstablished, () => { this.serverConnected = true; resolve() })
      this.sdk!.on(sdk.Events.ConnectionFailed, () => reject(new Error('Connection failed')))
      this.sdk!.connect()
    })
  }

  async login(username: string, password: string): Promise<void> {
    if (!this.sdk) throw new Error('SDK not initialized')
    if (this.loggedIn) return
    const sdk = await loadSDK()
    await new Promise<void>((resolve, reject) => {
      this.sdk!.on(sdk.Events.AuthResult, (e: any) => {
        if (e.result) resolve()
        else reject(new Error(`Auth failed: ${e.code}`))
      })
      this.sdk!.login(username, password)
    })
    this.loggedIn = true
  }

  async setup(username: string, password: string, node?: string | null): Promise<void> {
    await this.init(node)
    await this.connect()
    await this.login(username, password)
  }

  setHandlers(handlers: VoxCallHandlers) { this.handlers = handlers }

  async makeCall(phoneNumber: string): Promise<void> {
    if (!this.sdk) throw new Error('SDK not initialized')
    if (this.currentCall) throw new Error('Call already in progress')

    const normalized = normalizePhone(phoneNumber)
    if (!normalized) throw new Error(`Invalid phone number: "${phoneNumber}"`)

    // Request microphone access explicitly before dialing
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      throw new Error('Microphone access denied. Allow microphone for this extension in browser settings.')
    }
    const sdk = await loadSDK()
    this.handlers?.onStateChange('calling')
    try {
      this.currentCall = this.sdk.call({ number: normalized, video: { sendVideo: false, receiveVideo: false } })
      this.currentCall.on(sdk.CallEvents.Connected, () => {
        this.callStartTime = Date.now()
        this.handlers?.onStateChange('active')
        this.startDurationTimer()
      })
      this.currentCall.on(sdk.CallEvents.Disconnected, () => { this.cleanup(); this.handlers?.onStateChange('ended') })
      this.currentCall.on(sdk.CallEvents.Failed, (e: any) => {
        this.cleanup()
        this.handlers?.onError(`Call failed: ${e.reason}`)
        this.handlers?.onStateChange('idle') // Reset to idle so user can retry
      })
    } catch (err) {
      this.handlers?.onError(err instanceof Error ? err.message : 'Call failed')
      this.handlers?.onStateChange('idle')
      this.currentCall = null
    }
  }

  hangup(): void { if (this.currentCall) this.currentCall.hangup() }

  getCallDuration(): number {
    if (!this.callStartTime) return 0
    return Math.floor((Date.now() - this.callStartTime) / 1000)
  }

  private startDurationTimer(): void {
    this.stopDurationTimer()
    this.durationTimer = setInterval(() => { this.handlers?.onDurationTick(this.getCallDuration()) }, 1000)
  }

  private stopDurationTimer(): void {
    if (this.durationTimer) { clearInterval(this.durationTimer); this.durationTimer = null }
  }

  private cleanup(): void {
    this.stopDurationTimer()
    this.currentCall = null
    this.callStartTime = 0
  }

  isReady(): boolean { return this.loggedIn }

  disconnect(): void {
    if (this.currentCall) this.currentCall.hangup()
    this.cleanup()
    if (this.sdk) this.sdk.disconnect()
    this.loggedIn = false
    this.serverConnected = false
    this.initialized = false
    this.sdk = null
  }
}

export const voximplantService = new VoximplantService()