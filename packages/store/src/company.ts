import { create } from 'zustand'

export interface CompanyInfo {
  appName: string
  companyName: string
  tagline: string
  supportEmail: string
  website: string
  phone: string
  address: string
}

interface CompanyStore {
  info: CompanyInfo
  setInfo: (info: Partial<CompanyInfo>) => void
}

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  appName: 'MVPTemplate',
  companyName: '',
  tagline: '',
  supportEmail: '',
  website: '',
  phone: '',
  address: '',
}

export const useCompanyStore = create<CompanyStore>()((set) => ({
  info: DEFAULT_COMPANY_INFO,
  setInfo: (info) => set((s) => ({ info: { ...s.info, ...info } })),
}))
