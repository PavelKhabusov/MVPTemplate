import { useState } from 'react'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { ScalePress } from '../animations/ScalePress'

export interface LocationSuggestion {
  displayName: string
}

interface LocationInputProps {
  value: string
  onChangeText: (text: string) => void
  onSelectLocation: (location: string) => void
  suggestions: LocationSuggestion[]
  isLoading?: boolean
  placeholder?: string
}

export function LocationInput({
  value,
  onChangeText,
  onSelectLocation,
  suggestions,
  isLoading,
  placeholder,
}: LocationInputProps) {
  const theme = useTheme()
  const [focused, setFocused] = useState(false)

  const showDropdown = focused && value.length >= 2 && suggestions.length > 0

  return (
    <YStack zIndex={10}>
      <XStack
        backgroundColor="$subtleBackground"
        borderWidth={1}
        borderColor={focused ? theme.accent.val : '$borderColor'}
        borderRadius="$3"
        height={44}
        alignItems="center"
        paddingHorizontal="$2.5"
        gap="$2"
      >
        <Ionicons name="location-outline" size={18} color={theme.mutedText.val} />
        <Input
          flex={1}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder ?? 'Search city or address...'}
          placeholderTextColor={theme.mutedText.val}
          borderWidth={0}
          backgroundColor="transparent"
          height={44}
          fontSize={15}
          color="$color"
          paddingHorizontal={0}
        />
        {isLoading && (
          <Ionicons name="hourglass-outline" size={16} color={theme.mutedText.val} />
        )}
      </XStack>

      {showDropdown && (
        <YStack
          position="absolute"
          bottom={48}
          left={0}
          right={0}
          zIndex={100}
          backgroundColor="$cardBackground"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$3"
          overflow="hidden"
          elevation={4}
        >
          {suggestions.map((s, i) => (
            <ScalePress key={i} onPress={() => onSelectLocation(s.displayName)}>
              <XStack
                paddingVertical="$2.5"
                paddingHorizontal="$3"
                gap="$2"
                alignItems="center"
                borderBottomWidth={i < suggestions.length - 1 ? 0.5 : 0}
                borderBottomColor="$borderColor"
              >
                <Ionicons name="navigate-outline" size={16} color={theme.accent.val} />
                <Text flex={1} fontSize={14} color="$color" numberOfLines={1}>
                  {s.displayName}
                </Text>
              </XStack>
            </ScalePress>
          ))}
        </YStack>
      )}
    </YStack>
  )
}
