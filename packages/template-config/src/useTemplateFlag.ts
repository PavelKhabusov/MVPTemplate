import { useTemplateConfigStore } from './store'

export function useTemplateFlag(key: string, defaultEnabled: boolean): boolean {
  const override = useTemplateConfigStore((s) => s.overrides[key])
  return override !== undefined ? override : defaultEnabled
}
