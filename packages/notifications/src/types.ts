export interface NotificationHttpClient {
  get<T = any>(url: string): Promise<{ data: T }>
  post<T = any>(url: string, data?: any): Promise<{ data: T }>
  delete<T = any>(url: string): Promise<{ data: T }>
}

export interface Notification {
  id: string
  title: string
  body: string | null
  type: string
  isRead: boolean
  createdAt: string
}
