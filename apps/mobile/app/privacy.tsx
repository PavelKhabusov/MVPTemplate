import { useTranslation } from '@mvp/i18n'
import { DocumentScreen } from '../src/components/DocumentScreen'
import { getPrivacyPolicy } from '../assets/content/privacy-policy'

export default function PrivacyScreen() {
  const { i18n } = useTranslation()
  return <DocumentScreen content={getPrivacyPolicy(i18n.language)} titleKey="settings.privacy" />
}
