import { Button, Spinner, useTheme, type ButtonProps } from 'tamagui'
import { ScalePress } from '../animations'

const variantStyles = {
  primary: {
    backgroundColor: '$primary' as const,
    color: '$background' as const,
  },
  secondary: {
    backgroundColor: '$secondary' as const,
    color: 'white' as const,
  },
  outline: {
    backgroundColor: 'transparent' as const,
    borderWidth: 1,
    borderColor: '$borderColor' as const,
    color: '$color' as const,
  },
  ghost: {
    backgroundColor: 'transparent' as const,
    color: '$color' as const,
  },
  danger: {
    backgroundColor: '$error' as const,
    color: 'white' as const,
  },
  accent: {
    backgroundColor: '$accent' as const,
    color: '$background' as const,
  },
} as const

// Map our named sizes to Tamagui size tokens so Button's internal font sizing works
const sizeToToken = { sm: '$3', md: '$4', lg: '$5' } as const

const sizeStyles = {
  sm: { height: 36, paddingHorizontal: '$3' as const },
  md: { height: 44, paddingHorizontal: '$4' as const },
  lg: { height: 52, paddingHorizontal: '$5' as const },
} as const

type Variant = keyof typeof variantStyles
type Size = keyof typeof sizeStyles

interface AppButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  loading?: boolean
  animated?: boolean
  variant?: Variant
  size?: Size
}

export function AppButton({
  loading,
  disabled,
  children,
  animated = true,
  variant = 'primary',
  size = 'md',
  ...props
}: AppButtonProps) {
  const theme = useTheme()
  const isDisabled = disabled || loading

  return (
    <ScalePress disabled={isDisabled} scale={animated ? undefined : 1}>
      <Button
        size={sizeToToken[size]}
        borderRadius={Number(theme.radiusSm?.val) ?? 8}
        disabled={isDisabled}
        opacity={isDisabled ? 0.5 : 1}
        role="button"
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...variantStyles[variant]}
        {...sizeStyles[size]}
        {...props}
      >
        {loading ? <Spinner color="$color" /> : children}
      </Button>
    </ScalePress>
  )
}
