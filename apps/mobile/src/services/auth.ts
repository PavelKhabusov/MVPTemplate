import { createAuthService } from '@mvp/auth'
import { api, setAccessToken } from './api'

export const authApi = createAuthService({ http: api, setAccessToken })
