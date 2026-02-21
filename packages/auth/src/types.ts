/**
 * Minimal HTTP client interface that the auth service needs.
 * Structurally compatible with an axios instance.
 */
export interface AuthHttpClient {
  post<T = any>(url: string, data?: any): Promise<{ data: T }>
  get<T = any>(url: string): Promise<{ data: T }>
}

/**
 * Dependencies injected into the auth service factory.
 */
export interface AuthServiceDeps {
  /** HTTP client for making API requests (e.g., configured axios instance) */
  http: AuthHttpClient
  /** Set the in-memory access token (called after login/refresh) */
  setAccessToken: (token: string | null) => void
}
