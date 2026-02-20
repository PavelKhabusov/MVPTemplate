import { styled, Button, Spinner, GetProps } from 'tamagui'
import { ScalePress } from '../animations'

const StyledButton = styled(Button, {
  borderRadius: '$4',
  fontWeight: 'bold',

  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
        color: 'white',
        hoverStyle: { opacity: 0.9 },
        pressStyle: { opacity: 0.8 },
      },
      secondary: {
        backgroundColor: '$secondary',
        color: 'white',
        hoverStyle: { opacity: 0.9 },
        pressStyle: { opacity: 0.8 },
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$primary',
        color: '$primary',
        hoverStyle: { backgroundColor: '$subtleBackground' },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$primary',
        hoverStyle: { backgroundColor: '$subtleBackground' },
      },
      danger: {
        backgroundColor: '$error',
        color: 'white',
        hoverStyle: { opacity: 0.9 },
        pressStyle: { opacity: 0.8 },
      },
    },
    size: {
      sm: { height: 36, paddingHorizontal: '$3', fontSize: '$2' },
      md: { height: 44, paddingHorizontal: '$4', fontSize: '$3' },
      lg: { height: 52, paddingHorizontal: '$5', fontSize: '$4' },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

type StyledButtonProps = GetProps<typeof StyledButton>

interface AppButtonProps extends StyledButtonProps {
  loading?: boolean
  animated?: boolean
}

export function AppButton({
  loading,
  disabled,
  children,
  animated = true,
  ...props
}: AppButtonProps) {
  const button = (
    <StyledButton disabled={disabled || loading} opacity={disabled ? 0.5 : 1} {...props}>
      {loading ? <Spinner color="$color" /> : children}
    </StyledButton>
  )

  if (animated) {
    return <ScalePress disabled={disabled || loading}>{button}</ScalePress>
  }

  return button
}
