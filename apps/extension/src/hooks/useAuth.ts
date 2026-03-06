import { useState, useEffect, useCallback } from 'react'
import * as api from '../services/api'

export function useAuth() {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chrome.storage?.local
      ?.get(['accessToken'])
      .then((result) => {
        if (result?.accessToken) setAuthed(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = useCallback(async (email: string, password: string) => {
    await api.login(email, password)
    setAuthed(true)
  }, [])

  const handleRegister = useCallback(async (email: string, password: string) => {
    await api.register(email, password)
    setAuthed(true)
  }, [])

  const handleLogout = useCallback(async () => {
    await api.logout()
    setAuthed(false)
  }, [])

  return { authed, loading, login: handleLogin, register: handleRegister, logout: handleLogout }
}
