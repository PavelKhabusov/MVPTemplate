import { Sheet, YStack, Text, H3 } from 'tamagui'
import { ScrollView } from 'react-native'
import { useTranslation } from '@mvp/i18n'

interface HelpItem {
  title: string
  content: string
}

const HELP_CONTENT: Record<string, HelpItem[]> = {
  home: [
    { title: 'Getting Started', content: 'Welcome to the app! Browse the home screen to see the latest updates.' },
    { title: 'Navigation', content: 'Use the bottom tabs to switch between Home, Explore, and Profile.' },
  ],
  explore: [
    { title: 'Search', content: 'Use the search bar to find content. Results update as you type.' },
    { title: 'Filters', content: 'Apply filters to narrow down results.' },
  ],
  profile: [
    { title: 'Edit Profile', content: 'Tap on your profile info to update your name or avatar.' },
    { title: 'Settings', content: 'Access settings to change theme, language, and notification preferences.' },
  ],
  settings: [
    { title: 'Theme', content: 'Choose between System, Light, or Dark mode.' },
    { title: 'Language', content: 'Switch between English and Russian.' },
    { title: 'Privacy', content: 'View our Privacy Policy and manage your data preferences.' },
  ],
}

interface HelpSheetProps {
  open: boolean
  onClose: () => void
  screen?: string
}

export function HelpSheet({ open, onClose, screen = 'home' }: HelpSheetProps) {
  const { t } = useTranslation()
  const items = HELP_CONTENT[screen] ?? HELP_CONTENT.home

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen: boolean) => !isOpen && onClose()}
      snapPointsMode="percent"
      snapPoints={[60]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Frame padding="$4">
        <Sheet.Handle />
        <ScrollView>
          <YStack gap="$4" paddingTop="$2">
            <H3>Help</H3>
            {items.map((item, i) => (
              <YStack key={i} gap="$1">
                <Text fontWeight="600" fontSize="$3">
                  {item.title}
                </Text>
                <Text color="$mutedText" fontSize="$2">
                  {item.content}
                </Text>
              </YStack>
            ))}
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  )
}
