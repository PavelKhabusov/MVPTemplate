import { useState, useCallback, useEffect, useRef } from 'react'
import { voximplantService, type VoxCallState } from '../services/voximplant'

interface UseCallOptions {
  onCallEnded?: (duration: number) => void
}

export function useCall(options?: UseCallOptions) {
  const [callState, setCallState] = useState<VoxCallState>('idle')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    voximplantService.setHandlers({
      onStateChange: (state) => {
        setCallState(state)
        if (state === 'ended') {
          const dur = voximplantService.getCallDuration()
          setDuration(dur)
          optionsRef.current?.onCallEnded?.(dur)
        }
        if (state === 'idle' || state === 'calling') {
          setDuration(0)
          setError(null)
        }
      },
      onDurationTick: (seconds) => setDuration(seconds),
      onError: (message) => setError(message),
    })
  }, [])

  const initSDK = useCallback(async (username: string, password: string, node?: string | null) => {
    try {
      setError(null)
      await voximplantService.setup(username, password, node)
      setSdkReady(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize SDK')
      setSdkReady(false)
    }
  }, [])

  const makeCall = useCallback(async (phoneNumber: string) => {
    setError(null)
    await voximplantService.makeCall(phoneNumber)
  }, [])

  const hangup = useCallback(() => voximplantService.hangup(), [])

  const reset = useCallback(() => {
    setCallState('idle')
    setDuration(0)
    setError(null)
  }, [])

  return { callState, duration, error, sdkReady, initSDK, makeCall, hangup, reset }
}