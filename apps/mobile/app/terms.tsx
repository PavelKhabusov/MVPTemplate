import { useTranslation } from '@mvp/i18n'
import { DocumentScreen } from '../src/components/DocumentScreen'
import { getTermsOfService } from '../assets/content/terms-of-service'

export default function TermsScreen() {
  const { i18n } = useTranslation()
  return <DocumentScreen content={getTermsOfService(i18n.language)} titleKey="settings.terms" />
}
