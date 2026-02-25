import { useEffect, useRef, useState, useCallback } from 'react'
import { Platform, Pressable, TextInput } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { AnimatePresence, MotiView } from 'moti'

interface SearchModalProps {
  open: boolean
  onClose: () => void
  onSearch?: (query: string) => void
  results?: React.ReactNode
  placeholder?: string
}

export function SearchModal({ open, onClose, onSearch, results, placeholder }: SearchModalProps) {
  const theme = useTheme()
  const inputRef = useRef<TextInput>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (Platform.OS !== 'web' || !open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    onSearch?.(query)
  }, [query])

  if (Platform.OS !== 'web') return null

  return (
    <AnimatePresence>
      {open && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
          style={{
            position: 'fixed' as any,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: '15vh',
          } as any}
        >
          {/* Backdrop */}
          <Pressable
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            } as any}
          />

          {/* Modal Card */}
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: -10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.95, translateY: -10 }}
            transition={{ type: 'timing', duration: 200 }}
            style={{ width: '100%', maxWidth: 600, paddingHorizontal: 20, zIndex: 10001 }}
          >
            <YStack
              backgroundColor="$cardBackground"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              overflow="hidden"
              shadowColor="$cardShadow"
              shadowRadius={24}
              shadowOpacity={1}
              shadowOffset={{ width: 0, height: 8 }}
            >
              {/* Search Input */}
              <XStack
                alignItems="center"
                gap="$2"
                paddingHorizontal="$4"
                paddingVertical="$3"
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
              >
                <Ionicons name="search-outline" size={20} color={theme.mutedText.val} />
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={placeholder || 'Search...'}
                  placeholderTextColor={theme.mutedText.val}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: theme.color.val,
                    outlineStyle: 'none',
                    backgroundColor: 'transparent',
                  } as any}
                />
                <Pressable onPress={onClose}>
                  <XStack
                    backgroundColor="$subtleBackground"
                    borderRadius="$1"
                    paddingHorizontal="$1.5"
                    paddingVertical={2}
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text fontSize={11} color="$mutedText">ESC</Text>
                  </XStack>
                </Pressable>
              </XStack>

              {/* Results Area */}
              <YStack padding="$4" minHeight={120} alignItems="center" justifyContent="center">
                {results || (
                  <YStack alignItems="center" gap="$2">
                    <Ionicons name="search" size={32} color={theme.mutedText.val} style={{ opacity: 0.3 }} />
                    <Text color="$mutedText" fontSize="$2">
                      {query ? 'No results found' : 'Type to search...'}
                    </Text>
                  </YStack>
                )}
              </YStack>
            </YStack>
          </MotiView>
        </MotiView>
      )}
    </AnimatePresence>
  )
}
