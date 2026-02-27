import { useTranslation } from '@mvp/i18n'
import { DocumentScreen } from '../src/components/DocumentScreen'
import { getPublicOffer } from '../assets/content/public-offer'

export default function OfferScreen() {
  const { i18n } = useTranslation()
  return <DocumentScreen content={getPublicOffer(i18n.language)} titleKey="settings.offer" />
}
