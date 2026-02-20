import { YStack } from 'tamagui'
import { MotiView } from 'moti'
import { Skeleton } from 'moti/skeleton'

interface SkeletonListProps {
  count?: number
  height?: number
  gap?: number
  colorMode?: 'light' | 'dark'
}

export function SkeletonList({
  count = 5,
  height = 60,
  gap = 12,
  colorMode = 'light',
}: SkeletonListProps) {
  return (
    <YStack padding="$4" gap={gap}>
      {Array.from({ length: count }).map((_, i) => (
        <MotiView
          key={i}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: i * 80 }}
        >
          <Skeleton colorMode={colorMode} width="100%" height={height} radius={12} />
        </MotiView>
      ))}
    </YStack>
  )
}
