import { memo } from 'react'
import { Pressable, Platform } from 'react-native'
import { useTheme } from 'tamagui'
import { MotiView } from 'moti'

interface AppSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  activeColor?: string
  size?: 'sm' | 'md'
}

const SIZES = {
  sm: { track: { w: 40, h: 24 }, thumb: 18, pad: 3 },
  md: { track: { w: 48, h: 28 }, thumb: 22, pad: 3 },
}

export const AppSwitch = memo(function AppSwitch({ checked, onCheckedChange, activeColor, size = 'md' }: AppSwitchProps) {
  const theme = useTheme()
  const s = SIZES[size]
  const accent = activeColor ?? theme.accent.val
  const trackColor = checked ? accent : theme.borderColor.val
  const translateX = checked ? s.track.w - s.thumb - s.pad * 2 : 0

  return (
    <Pressable
      onPress={() => onCheckedChange(!checked)}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      style={{ flexShrink: 0 }}
    >
      <MotiView
        animate={{ backgroundColor: trackColor as string }}
        transition={{ type: 'timing', duration: 150 }}
        style={{
          width: s.track.w,
          height: s.track.h,
          borderRadius: s.track.h / 2,
          padding: s.pad,
          justifyContent: 'center',
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        } as any}
      >
        <MotiView
          animate={{ translateX }}
          transition={{ type: 'timing', duration: 200 }}
          style={{
            width: s.thumb,
            height: s.thumb,
            borderRadius: s.thumb / 2,
            backgroundColor: '#fff',
            ...(Platform.OS === 'web'
              ? { boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }
              : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 }),
          } as any}
        />
      </MotiView>
    </Pressable>
  )
})
