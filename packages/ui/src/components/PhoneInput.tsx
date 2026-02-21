import { useState, useMemo, useCallback } from 'react'
import { FlatList, Modal, Platform } from 'react-native'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { countries, applyMask, extractDigits } from '@mvp/lib'
import type { Country } from '@mvp/lib'
import { ScalePress } from '../animations/ScalePress'

interface PhoneInputProps {
  value: string
  onChangePhone: (fullNumber: string) => void
  defaultCountryCode?: string
  placeholder?: string
}

export function PhoneInput({
  value,
  onChangePhone,
  defaultCountryCode = 'RU',
  placeholder,
}: PhoneInputProps) {
  const theme = useTheme()

  // Parse initial country from value or default
  const initialCountry = useMemo(() => {
    if (value) {
      const match = countries.find((c) => value.startsWith(c.dialCode))
      if (match) return match
    }
    return countries.find((c) => c.code === defaultCountryCode) ?? countries[0]
  }, [])

  const [country, setCountry] = useState<Country>(initialCountry)
  const [digits, setDigits] = useState(() => {
    if (value && value.startsWith(country.dialCode)) {
      return extractDigits(value.slice(country.dialCode.length))
    }
    return extractDigits(value)
  })
  const [pickerVisible, setPickerVisible] = useState(false)
  const [search, setSearch] = useState('')

  const masked = applyMask(digits, country.mask)

  const handleTextChange = useCallback(
    (text: string) => {
      const d = extractDigits(text)
      const maxDigits = (country.mask.match(/#/g) || []).length
      const trimmed = d.slice(0, maxDigits)
      setDigits(trimmed)
      onChangePhone(trimmed ? country.dialCode + trimmed : '')
    },
    [country, onChangePhone],
  )

  const handleCountrySelect = useCallback(
    (c: Country) => {
      setCountry(c)
      setPickerVisible(false)
      setSearch('')
      // Reset digits if mask length changed significantly
      const maxDigits = (c.mask.match(/#/g) || []).length
      const trimmed = digits.slice(0, maxDigits)
      setDigits(trimmed)
      onChangePhone(trimmed ? c.dialCode + trimmed : '')
    },
    [digits, onChangePhone],
  )

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return countries
    const q = search.toLowerCase()
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    )
  }, [search])

  return (
    <>
      <XStack
        backgroundColor="$subtleBackground"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$3"
        height={44}
        alignItems="center"
        overflow="hidden"
      >
        {/* Country selector */}
        <ScalePress onPress={() => setPickerVisible(true)}>
          <XStack
            paddingHorizontal="$2.5"
            height={44}
            alignItems="center"
            gap="$1.5"
            borderRightWidth={1}
            borderRightColor="$borderColor"
          >
            <Text fontSize={20}>{country.flag}</Text>
            <Text fontSize={14} color="$mutedText">{country.dialCode}</Text>
            <Ionicons name="chevron-down" size={14} color={theme.mutedText.val} />
          </XStack>
        </ScalePress>

        {/* Phone number input */}
        <Input
          flex={1}
          value={masked}
          onChangeText={handleTextChange}
          keyboardType="phone-pad"
          placeholder={placeholder ?? country.mask.replace(/#/g, '0')}
          placeholderTextColor={theme.mutedText.val}
          borderWidth={0}
          backgroundColor="transparent"
          height={44}
          fontSize={15}
          color="$color"
          paddingHorizontal="$2.5"
        />
      </XStack>

      {/* Country Picker Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        onRequestClose={() => setPickerVisible(false)}
      >
        <YStack flex={1} backgroundColor="$background" paddingTop={Platform.OS === 'ios' ? '$6' : '$4'}>
          {/* Header */}
          <XStack paddingHorizontal="$4" paddingBottom="$3" alignItems="center" justifyContent="space-between">
            <Text fontSize={18} fontWeight="bold" color="$color">Country</Text>
            <ScalePress onPress={() => { setPickerVisible(false); setSearch('') }}>
              <Ionicons name="close-circle" size={28} color={theme.mutedText.val} />
            </ScalePress>
          </XStack>

          {/* Search */}
          <YStack paddingHorizontal="$4" paddingBottom="$2">
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search country..."
              placeholderTextColor={theme.mutedText.val}
              backgroundColor="$subtleBackground"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$3"
              height={40}
              fontSize={15}
              color="$color"
              paddingHorizontal="$3"
              autoFocus
            />
          </YStack>

          {/* List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <ScalePress onPress={() => handleCountrySelect(item)}>
                <XStack
                  paddingVertical="$2.5"
                  paddingHorizontal="$4"
                  gap="$3"
                  alignItems="center"
                  backgroundColor={item.code === country.code ? '$subtleBackground' : 'transparent'}
                >
                  <Text fontSize={24}>{item.flag}</Text>
                  <Text flex={1} fontSize={16} color="$color">{item.name}</Text>
                  <Text fontSize={14} color="$mutedText">{item.dialCode}</Text>
                  {item.code === country.code && (
                    <Ionicons name="checkmark" size={20} color={theme.accent.val} />
                  )}
                </XStack>
              </ScalePress>
            )}
          />
        </YStack>
      </Modal>
    </>
  )
}
