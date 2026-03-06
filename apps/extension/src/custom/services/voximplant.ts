// Dynamic import to avoid "window is not defined" during Vite build
let VI: typeof import('voximplant-websdk') | null = null

async function loadSDK() {
  if (!VI) VI = await import('voximplant-websdk')
  return VI
}

export type VoxCallState = 'idle' | 'calling' | 'active' | 'ended' | 'failed'

export interface VoxCallHandlers {
  onStateChange: (state: VoxCallState) => void
  onDurationTick: (seconds: number) => void
  onError: (message: string) => void
}

class VoximplantService {
  private sdk: any = null
  private currentCall: any = null
  private durationTimer: ReturnType<typeof setInterval> | null = null
  private callStartTime: number = 0
  private handlers: VoxCallHandlers | null = null
  private initialized = false
  private loggedIn = false

  async init(): Promise<void> {
    if (this.initialized) return
    const sdk = await loadSDK()
    this.sdk = sdk.getInstance()
    await new Promise<void>((resolve, reject) => {
      this.sdk!.on(sdk.Events.SDKReady, () => resolve())
      this.sdk!.on(sdk.Events.ConnectionFailed, () => reject(new Error('Connection failed')))
      this.sdk!.init({ micRequired: true, showDebugInfo: false, node: 'app.voximplant.com' })
    })
    this.initialized = true
  }

  async connect(): Promise<void> {
    if (!this.sdk) throw new Error('SDK not initialized')
    const sdk = await loadSDK()
    await new Promise<void>((resolve, reject) => {
      this.sdk!.on(sdk.Events.ConnectionEstablished, () => resolve())
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

  async setup(username: string, password: string): Promise<void> {
    await this.init()
    await this.connect()
    await this.login(username, password)
  }

  setHandlers(handlers: VoxCallHandlers) { this.handlers = handlers }

  async makeCall(phoneNumber: string): Promise<void> {
    if (!this.sdk) throw new Error('SDK not initialized')
    if (this.currentCall) throw new Error('Call already in progress')
    const sdk = await loadSDK()
    this.handlers?.onStateChange('calling')
    try {
      this.currentCall = this.sdk.call({ number: phoneNumber, video: { sendVideo: false, receiveVideo: false } })
      this.currentCall.on(sdk.CallEvents.Connected, () => {
        this.callStartTime = Date.now()
        this.handlers?.onStateChange('active')
        this.startDurationTimer()
      })
      this.currentCall.on(sdk.CallEvents.Disconnected, () => { this.cleanup(); this.handlers?.onStateChange('ended') })
      this.currentCall.on(sdk.CallEvents.Failed, (e: any) => { this.cleanup(); this.handlers?.onStateChange('failed'); this.handlers?.onError(`Call failed: ${e.reason}`) })
    } catch (err) {
      this.handlers?.onStateChange('failed')
      this.handlers?.onError(err instanceof Error ? err.message : 'Call failed')
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

  isConnected(): boolean { return this.loggedIn }

  disconnect(): void {
    if (this.currentCall) this.currentCall.hangup()
    this.cleanup()
    if (this.sdk) this.sdk.disconnect()
    this.loggedIn = false
    this.initialized = false
    this.sdk = null
  }
}

export const voximplantService = new VoximplantService()